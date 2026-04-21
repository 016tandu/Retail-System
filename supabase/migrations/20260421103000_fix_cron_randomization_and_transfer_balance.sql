-- Fix automated cron flow:
-- 1) Invoice actor is selected from a random region each run.
-- 2) Transfer attempts per run are scaled to cover invoice frequency under 80/20 confirm/decline simulation.
-- 3) Keep a single `techstore-main-flow` schedule definition.

CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_region character varying;
    v_provider_region character varying;
    v_provider record;
    v_retailer record;
    v_seller record;
    v_product record;
    v_transfer record;
    v_transfer_id uuid;
    v_transfer_attempts integer := 2;
    v_transfer_qty integer;
    v_rand double precision;
    v_decline_reason decline_reason;
    v_source_ma_sp character varying;
    v_source_price numeric(15, 2);
    v_invoice_ma_sp character varying;
    v_invoice_price numeric(15, 2);
    v_from_before integer;
    v_to_before integer;
    v_from_after integer;
    v_to_after integer;
    v_invoice_id character varying;
    i integer;
BEGIN
    -- Random region selection from active invoice actors (Staff/Retailer).
    -- Provider can be cross-region if same-region Provider is unavailable.
    SELECT regions."KhuVuc"
    INTO v_target_region
    FROM (
        SELECT DISTINCT k."KhuVuc"
        FROM public."NHAN_VIEN" nv
        JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
        WHERE nv."TrangThai" = 'Active'
          AND nv.role IN ('Staff', 'Retailer')
    ) regions
    ORDER BY random()
    LIMIT 1;

    IF v_target_region IS NULL THEN
        RETURN;
    END IF;

    -- Pick actors in that random region.
    SELECT rv.*
    INTO v_retailer
    FROM public."NHAN_VIEN" rv
    JOIN public."KHO" kr ON kr."MaKho" = rv."MaKho"
    WHERE rv.role = 'Retailer'
      AND rv."TrangThai" = 'Active'
      AND rv.user_id IS NOT NULL
      AND kr."KhuVuc" = v_target_region
    ORDER BY random()
    LIMIT 1;

    IF v_retailer IS NULL THEN
        SELECT rv.*
        INTO v_retailer
        FROM public."NHAN_VIEN" rv
        WHERE rv.role = 'Retailer'
          AND rv."TrangThai" = 'Active'
          AND rv.user_id IS NOT NULL
        ORDER BY random()
        LIMIT 1;
    END IF;

    SELECT pv.*
    INTO v_provider
    FROM public."NHAN_VIEN" pv
    JOIN public."KHO" kp ON kp."MaKho" = pv."MaKho"
    WHERE pv.role = 'Provider'
      AND pv."TrangThai" = 'Active'
      AND pv.user_id IS NOT NULL
      AND kp."KhuVuc" = v_target_region
    ORDER BY random()
    LIMIT 1;

    -- Fallback to any active Provider when same-region Provider does not exist.
    IF v_provider IS NULL THEN
        SELECT pv.*
        INTO v_provider
        FROM public."NHAN_VIEN" pv
        WHERE pv.role = 'Provider'
          AND pv."TrangThai" = 'Active'
          AND pv.user_id IS NOT NULL
        ORDER BY random()
        LIMIT 1;
    END IF;

    IF v_retailer IS NULL OR v_provider IS NULL OR v_retailer.user_id IS NULL OR v_provider.user_id IS NULL THEN
        RETURN;
    END IF;

    SELECT k."KhuVuc"
    INTO v_provider_region
    FROM public."KHO" k
    WHERE k."MaKho" = v_provider."MaKho"
    LIMIT 1;

    -- Invoice seller is selected from the random target region.
    SELECT sv.*
    INTO v_seller
    FROM public."NHAN_VIEN" sv
    JOIN public."KHO" ks ON ks."MaKho" = sv."MaKho"
    WHERE sv."TrangThai" = 'Active'
      AND sv.role IN ('Staff', 'Retailer')
      AND ks."KhuVuc" = v_target_region
    ORDER BY random()
    LIMIT 1;

    IF v_seller IS NULL THEN
        SELECT sv.*
        INTO v_seller
        FROM public."NHAN_VIEN" sv
        WHERE sv."MaKho" = v_retailer."MaKho"
          AND sv."TrangThai" = 'Active'
          AND sv.role IN ('Staff', 'Retailer')
        ORDER BY random()
        LIMIT 1;
    END IF;

    IF v_seller IS NULL THEN
        RETURN;
    END IF;

    -- Product source preference: provider stock first, then catalog fallback.
    SELECT tk."MaSP", sp."GiaNiemYet"
    INTO v_product
    FROM public."TON_KHO" tk
    JOIN public."SAN_PHAM" sp ON sp."MaSP" = tk."MaSP"
    WHERE tk."MaKho" = v_provider."MaKho"
    ORDER BY tk."SoLuongTon" DESC, random()
    LIMIT 1;

    IF v_product."MaSP" IS NULL THEN
        SELECT sp."MaSP", sp."GiaNiemYet"
        INTO v_product
        FROM public."SAN_PHAM" sp
        ORDER BY random()
        LIMIT 1;
    END IF;

    IF v_product."MaSP" IS NULL THEN
        RETURN;
    END IF;

    v_source_ma_sp := v_product."MaSP";
    v_source_price := v_product."GiaNiemYet";

    -- Transfer capacity rule:
    -- invoice target per run = 1
    -- confirm ratio = 80%
    -- transfer attempts >= ceil(1 / 0.8) = 2
    FOR i IN 1..v_transfer_attempts LOOP
        v_transfer_qty := floor(random() * 8 + 5)::integer; -- 5..12

        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
        VALUES (v_provider."MaKho", v_product."MaSP", v_transfer_qty * 2, now())
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE
        SET
            "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon",
            "LastUpdated" = now();

        INSERT INTO public."STOCK_TRANSFER" (
            "ma_sp", "from_kho", "to_kho", "so_luong",
            "sender_id", "receiver_id", "status",
            "from_region", "to_region", "sender_role", "receiver_role", "GhiChu"
        )
        VALUES (
            v_product."MaSP",
            v_provider."MaKho",
            v_retailer."MaKho",
            v_transfer_qty,
            v_provider.user_id,
            v_retailer.user_id,
            'PENDING',
            COALESCE(v_provider_region, v_target_region),
            v_target_region,
            'Provider',
            'Retailer',
            format(
                'AUTO-TRANSFER region=%s provider=%s retailer=%s at %s',
                v_target_region,
                v_provider."MaNV",
                v_retailer."MaNV",
                to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
            )
        )
        RETURNING id INTO v_transfer_id;
    END LOOP;

    -- Process up to v_transfer_attempts pending transfers each run.
    FOR v_transfer IN
        SELECT st.*
        FROM public."STOCK_TRANSFER" st
        WHERE st.status = 'PENDING'
        ORDER BY st.created_at ASC
        LIMIT v_transfer_attempts
    LOOP
        v_rand := random();

        IF v_rand < 0.2 THEN
            v_decline_reason := (
                ARRAY['DAMAGED', 'INCORRECT_QUANTITY', 'WRONG_PRODUCT', 'OTHER']
            )[floor(random() * 4 + 1)]::decline_reason;

            UPDATE public."STOCK_TRANSFER"
            SET
                status = 'DECLINED',
                reason = v_decline_reason,
                reason_detail = 'Auto decline for simulation (20% path).',
                updated_at = now()
            WHERE id = v_transfer.id;

            CONTINUE;
        END IF;

        SELECT tk."SoLuongTon"
        INTO v_from_before
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.from_kho
          AND tk."MaSP" = v_transfer.ma_sp
        FOR UPDATE;

        IF v_from_before IS NULL OR v_from_before < v_transfer.so_luong THEN
            UPDATE public."STOCK_TRANSFER"
            SET
                status = 'DECLINED',
                reason = 'INCORRECT_QUANTITY',
                reason_detail = 'Auto decline due to insufficient source stock at confirm time.',
                updated_at = now()
            WHERE id = v_transfer.id;
            CONTINUE;
        END IF;

        SELECT tk."SoLuongTon"
        INTO v_to_before
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.to_kho
          AND tk."MaSP" = v_transfer.ma_sp
        FOR UPDATE;

        v_to_before := COALESCE(v_to_before, 0);

        UPDATE public."TON_KHO"
        SET
            "SoLuongTon" = "SoLuongTon" - v_transfer.so_luong,
            "LastUpdated" = now()
        WHERE "MaKho" = v_transfer.from_kho
          AND "MaSP" = v_transfer.ma_sp;

        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
        VALUES (v_transfer.to_kho, v_transfer.ma_sp, v_transfer.so_luong, now())
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE
        SET
            "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon",
            "LastUpdated" = now();

        SELECT tk."SoLuongTon"
        INTO v_from_after
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.from_kho
          AND tk."MaSP" = v_transfer.ma_sp
        LIMIT 1;

        SELECT tk."SoLuongTon"
        INTO v_to_after
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.to_kho
          AND tk."MaSP" = v_transfer.ma_sp
        LIMIT 1;

        UPDATE public."STOCK_TRANSFER"
        SET
            status = 'CONFIRMED',
            updated_at = now(),
            "from_qty_before" = COALESCE("from_qty_before", v_from_before),
            "to_qty_before" = COALESCE("to_qty_before", v_to_before),
            "from_qty_after" = v_from_after,
            "to_qty_after" = v_to_after,
            reason = NULL,
            reason_detail = NULL
        WHERE id = v_transfer.id;
    END LOOP;

    -- One invoice per run, by seller in the selected random region.
    SELECT tk."MaSP", sp."GiaNiemYet"
    INTO v_invoice_ma_sp, v_invoice_price
    FROM public."TON_KHO" tk
    JOIN public."SAN_PHAM" sp ON sp."MaSP" = tk."MaSP"
    WHERE tk."MaKho" = v_seller."MaKho"
      AND tk."SoLuongTon" > 0
    ORDER BY random()
    LIMIT 1;

    IF v_invoice_ma_sp IS NULL THEN
        v_invoice_ma_sp := v_source_ma_sp;
        v_invoice_price := v_source_price;

        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
        VALUES (v_seller."MaKho", v_invoice_ma_sp, floor(random() * 8 + 5)::integer, now())
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE
        SET
            "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon",
            "LastUpdated" = now();
    END IF;

    UPDATE public."TON_KHO"
    SET
        "SoLuongTon" = "SoLuongTon" - 1,
        "LastUpdated" = now()
    WHERE "MaKho" = v_seller."MaKho"
      AND "MaSP" = v_invoice_ma_sp
      AND "SoLuongTon" >= 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    LOOP
        v_invoice_id := 'AT-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) FROM 1 FOR 4));
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public."HOA_DON" hd
            WHERE hd."MaHD" = v_invoice_id
        );
    END LOOP;

    INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
    VALUES (
        v_invoice_id,
        now(),
        v_seller."MaNV",
        v_seller."MaKho",
        v_invoice_price,
        format(
            'AUTO-INVOICE region=%s seller=%s(%s) warehouse=%s at %s',
            v_target_region,
            v_seller."HoTen",
            v_seller."MaNV",
            v_seller."MaKho",
            to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
        )
    );

    INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
    VALUES (
        v_invoice_id,
        v_invoice_ma_sp,
        1,
        v_invoice_price,
        v_invoice_price
    );
END;
$$;

DO $$
DECLARE
    v_job record;
BEGIN
    IF to_regnamespace('cron') IS NULL THEN
        RETURN;
    END IF;

    FOR v_job IN
        SELECT jobid
        FROM cron.job
        WHERE jobname = 'techstore-main-flow'
    LOOP
        PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
        'techstore-main-flow',
        '*/20 * * * *',
        'SELECT public.run_automated_business_flow();'
    );
END $$;
