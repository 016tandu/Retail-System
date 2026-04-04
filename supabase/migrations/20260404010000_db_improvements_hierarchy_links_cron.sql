-- DB Improvements batch:
-- 1) Fix hierarchy promotion/demotion workflow.
-- 2) Auto-link Retailer <-> Supplier (many-many) by region.
-- 3) Schedule recurring invoice generation (>=5 invoices/day/retailer branch).

-- ---------------------------------------------------------------------------
-- 1) Hierarchy and employee management logic
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.hierarchy_control(
    p_target_ma_nv character varying,
    p_action text,
    p_target_role text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_my_role character varying;
    v_target_role character varying;
BEGIN
    SELECT nv.role INTO v_my_role
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_my_role IS DISTINCT FROM 'Admin' THEN
        RAISE EXCEPTION 'Only Admin can change employee role hierarchy.';
    END IF;

    SELECT nv.role INTO v_target_role
    FROM public."NHAN_VIEN" nv
    WHERE nv."MaNV" = p_target_ma_nv
    LIMIT 1;

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Target employee not found: %', p_target_ma_nv;
    END IF;

    IF upper(p_action) = 'PROMOTE' THEN
        IF v_target_role = 'Staff' THEN
            IF p_target_role IS NULL OR p_target_role NOT IN ('Retailer', 'Provider', 'Admin') THEN
                RAISE EXCEPTION 'For Staff promotion, p_target_role must be Retailer, Provider, or Admin.';
            END IF;
            UPDATE public."NHAN_VIEN" SET role = p_target_role WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        IF v_target_role IN ('Retailer', 'Provider') THEN
            IF p_target_role IS DISTINCT FROM 'Admin' THEN
                RAISE EXCEPTION 'Retailer/Provider can only be promoted to Admin.';
            END IF;
            UPDATE public."NHAN_VIEN" SET role = 'Admin' WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        RAISE EXCEPTION 'Unsupported PROMOTE transition from role %.', v_target_role;
    END IF;

    IF upper(p_action) = 'DEMOTE' THEN
        IF v_target_role IN ('Retailer', 'Provider') THEN
            UPDATE public."NHAN_VIEN" SET role = 'Staff' WHERE "MaNV" = p_target_ma_nv;
            RETURN;
        END IF;

        RAISE EXCEPTION 'Only Retailer/Provider can be demoted to Staff.';
    END IF;

    RAISE EXCEPTION 'Unsupported action %, expected PROMOTE or DEMOTE.', p_action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.manage_employee(
    p_target_ma_nv character varying,
    p_new_role character varying,
    p_new_trang_thai character varying
) RETURNS void AS $$
DECLARE
    v_my_role character varying;
    v_my_kho character varying;
    v_target_role character varying;
    v_target_kho character varying;
BEGIN
    SELECT nv.role, nv."MaKho" INTO v_my_role, v_my_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    SELECT nv.role, nv."MaKho" INTO v_target_role, v_target_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv."MaNV" = p_target_ma_nv
    LIMIT 1;

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'Target employee not found: %', p_target_ma_nv;
    END IF;

    IF p_new_trang_thai IS NULL OR p_new_trang_thai NOT IN ('Active', 'Resigned') THEN
        RAISE EXCEPTION 'p_new_trang_thai must be Active or Resigned.';
    END IF;

    -- Role changes are centralized in hierarchy_control.
    IF p_new_role IS NOT NULL AND p_new_role <> v_target_role THEN
        RAISE EXCEPTION 'Use hierarchy_control for role changes.';
    END IF;

    IF v_my_role = 'Admin' THEN
        UPDATE public."NHAN_VIEN"
        SET "TrangThai" = p_new_trang_thai
        WHERE "MaNV" = p_target_ma_nv
          AND role <> 'Admin';
        RETURN;
    END IF;

    IF v_my_role = 'Retailer' AND v_target_role = 'Staff' AND v_my_kho = v_target_kho THEN
        UPDATE public."NHAN_VIEN"
        SET "TrangThai" = p_new_trang_thai
        WHERE "MaNV" = p_target_ma_nv;
        RETURN;
    END IF;

    RAISE EXCEPTION 'You are not allowed to change status of this employee.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2) Auto-link Retailer-Supplier by region (many-many)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auto_link_suppliers_for_retailer(p_retailer_user_id uuid)
RETURNS void AS $$
DECLARE
    v_region character varying;
BEGIN
    SELECT k."KhuVuc" INTO v_region
    FROM public."NHAN_VIEN" nv
    JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
    WHERE nv.user_id = p_retailer_user_id
      AND nv.role = 'Retailer'
    LIMIT 1;

    IF v_region IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public."RETAILER_SUPPLIER_LINK" ("retailer_user_id", "supplier_ma_ncc")
    SELECT p_retailer_user_id, ncc."MaNCC"
    FROM public."NHA_CUNG_CAP" ncc
    WHERE ncc."KhuVuc" = v_region
    ON CONFLICT ("retailer_user_id", "supplier_ma_ncc") DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.auto_link_retailers_for_supplier(p_supplier_ma_ncc character varying)
RETURNS void AS $$
DECLARE
    v_region character varying;
BEGIN
    SELECT ncc."KhuVuc" INTO v_region
    FROM public."NHA_CUNG_CAP" ncc
    WHERE ncc."MaNCC" = p_supplier_ma_ncc
    LIMIT 1;

    IF v_region IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO public."RETAILER_SUPPLIER_LINK" ("retailer_user_id", "supplier_ma_ncc")
    SELECT nv.user_id, p_supplier_ma_ncc
    FROM public."NHAN_VIEN" nv
    JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
    WHERE nv.role = 'Retailer'
      AND nv.user_id IS NOT NULL
      AND k."KhuVuc" = v_region
    ON CONFLICT ("retailer_user_id", "supplier_ma_ncc") DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trg_auto_link_on_retailer_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.role = 'Retailer' THEN
        IF TG_OP = 'INSERT'
           OR OLD.role IS DISTINCT FROM NEW.role
           OR OLD."MaKho" IS DISTINCT FROM NEW."MaKho" THEN
            PERFORM public.auto_link_suppliers_for_retailer(NEW.user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_on_retailer_change ON public."NHAN_VIEN";
CREATE TRIGGER trg_auto_link_on_retailer_change
AFTER INSERT OR UPDATE OF role, "MaKho"
ON public."NHAN_VIEN"
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_link_on_retailer_change();

CREATE OR REPLACE FUNCTION public.trg_auto_link_on_supplier_change()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR OLD."KhuVuc" IS DISTINCT FROM NEW."KhuVuc" THEN
        PERFORM public.auto_link_retailers_for_supplier(NEW."MaNCC");
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_link_on_supplier_change ON public."NHA_CUNG_CAP";
CREATE TRIGGER trg_auto_link_on_supplier_change
AFTER INSERT OR UPDATE OF "KhuVuc"
ON public."NHA_CUNG_CAP"
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_link_on_supplier_change();

-- Backfill existing links by current region mapping.
INSERT INTO public."RETAILER_SUPPLIER_LINK" ("retailer_user_id", "supplier_ma_ncc")
SELECT nv.user_id, ncc."MaNCC"
FROM public."NHAN_VIEN" nv
JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
JOIN public."NHA_CUNG_CAP" ncc ON ncc."KhuVuc" = k."KhuVuc"
WHERE nv.role = 'Retailer'
  AND nv.user_id IS NOT NULL
ON CONFLICT ("retailer_user_id", "supplier_ma_ncc") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Smart daily invoice generation + cron schedule
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_daily_retailer_invoices(p_min_per_branch integer DEFAULT 5)
RETURNS void AS $$
DECLARE
    v_branch record;
    v_existing_count integer;
    v_needed integer;
    v_i integer;
    v_ma_nv character varying;
    v_ma_sp character varying;
    v_don_gia numeric;
    v_so_luong_ton integer;
    v_so_luong integer;
    v_items jsonb;
BEGIN
    IF p_min_per_branch < 1 THEN
        RAISE EXCEPTION 'p_min_per_branch must be >= 1';
    END IF;

    FOR v_branch IN
        SELECT DISTINCT nv."MaKho"
        FROM public."NHAN_VIEN" nv
        WHERE nv.role = 'Retailer'
          AND nv."TrangThai" = 'Active'
    LOOP
        SELECT count(*) INTO v_existing_count
        FROM public."HOA_DON" hd
        WHERE hd."MaKho" = v_branch."MaKho"
          AND hd."NgayLap"::date = now()::date;

        v_needed := GREATEST(p_min_per_branch - v_existing_count, 0);

        IF v_needed = 0 THEN
            CONTINUE;
        END IF;

        FOR v_i IN 1..v_needed LOOP
            SELECT nv."MaNV" INTO v_ma_nv
            FROM public."NHAN_VIEN" nv
            WHERE nv."MaKho" = v_branch."MaKho"
              AND nv."TrangThai" = 'Active'
              AND nv.role IN ('Staff', 'Retailer')
            ORDER BY random()
            LIMIT 1;

            IF v_ma_nv IS NULL THEN
                EXIT;
            END IF;

            SELECT tk."MaSP", sp."GiaNiemYet", tk."SoLuongTon"
            INTO v_ma_sp, v_don_gia, v_so_luong_ton
            FROM public."TON_KHO" tk
            JOIN public."SAN_PHAM" sp ON sp."MaSP" = tk."MaSP"
            WHERE tk."MaKho" = v_branch."MaKho"
              AND tk."SoLuongTon" > 0
            ORDER BY random()
            LIMIT 1;

            IF v_ma_sp IS NULL THEN
                EXIT;
            END IF;

            v_so_luong := LEAST(v_so_luong_ton, floor(random() * 3 + 1)::int);

            v_items := jsonb_build_array(
                jsonb_build_object(
                    'MaSP', v_ma_sp,
                    'SoLuong', v_so_luong,
                    'DonGia', v_don_gia
                )
            );

            BEGIN
                PERFORM public.create_invoice(v_ma_nv, v_branch."MaKho", v_items);
            EXCEPTION WHEN OTHERS THEN
                -- Skip single bad random attempt, continue filling remaining quota.
                CONTINUE;
            END;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE
    v_job record;
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension unavailable: %', SQLERRM;
    END;

    IF to_regnamespace('cron') IS NULL THEN
        RAISE NOTICE 'cron schema not available. Skip schedule creation.';
        RETURN;
    END IF;

    FOR v_job IN
        SELECT jobid
        FROM cron.job
        WHERE jobname = 'generate-daily-retailer-invoices'
    LOOP
        PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
        'generate-daily-retailer-invoices',
        '5 * * * *',
        'SELECT public.generate_daily_retailer_invoices(5);'
    );
END $$;
