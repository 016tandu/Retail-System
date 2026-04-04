-- Fix remaining RLS/reporting inconsistencies.
-- 1) Harden create_invoice RPC and run as SECURITY DEFINER.
-- 2) Make reporting RPCs SECURITY DEFINER.
-- 3) Remove write side-effects from ton_kho_toan_quoc (read-only inventory report).

CREATE OR REPLACE FUNCTION public.create_invoice(
    p_ma_nv character varying,
    p_ma_kho character varying,
    p_items jsonb
) RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_ma_nv character varying;
    v_actor_role character varying;
    v_actor_kho character varying;
    v_actor_trang_thai character varying;

    v_target_trang_thai character varying;

    v_ma_hd character varying;
    v_item jsonb;
    v_tong_tien numeric(15, 2) := 0;
    v_thanh_tien numeric(15, 2);
    v_ma_sp character varying;
    v_so_luong integer;
    v_don_gia numeric(15, 2);
BEGIN
    SELECT nv."MaNV", nv.role, nv."MaKho", nv."TrangThai"
    INTO v_actor_ma_nv, v_actor_role, v_actor_kho, v_actor_trang_thai
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_actor_ma_nv IS NULL THEN
        RAISE EXCEPTION 'Caller profile not found in NHAN_VIEN.';
    END IF;

    IF v_actor_trang_thai IS DISTINCT FROM 'Active' THEN
        RAISE EXCEPTION 'Only active employees can create invoices.';
    END IF;

    IF v_actor_role NOT IN ('Admin', 'Retailer', 'Staff') THEN
        RAISE EXCEPTION 'Role % is not allowed to create invoices.', v_actor_role;
    END IF;

    -- Non-admin users can only create invoices for themselves and their own warehouse.
    IF v_actor_role <> 'Admin' THEN
        IF p_ma_nv IS DISTINCT FROM v_actor_ma_nv THEN
            RAISE EXCEPTION 'You can only create invoices as your own employee code.';
        END IF;

        IF p_ma_kho IS DISTINCT FROM v_actor_kho THEN
            RAISE EXCEPTION 'You can only create invoices for your own warehouse.';
        END IF;
    END IF;

    SELECT nv."TrangThai"
    INTO v_target_trang_thai
    FROM public."NHAN_VIEN" nv
    WHERE nv."MaNV" = p_ma_nv
    LIMIT 1;

    IF v_target_trang_thai IS NULL THEN
        RAISE EXCEPTION 'Employee % not found.', p_ma_nv;
    END IF;

    IF v_target_trang_thai <> 'Active' THEN
        RAISE EXCEPTION 'Employee % is not active and cannot create invoices.', p_ma_nv;
    END IF;

    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'p_items must be a non-empty JSON array.';
    END IF;

    v_ma_hd := 'HD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- First pass: validate and calculate invoice total.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;

        IF v_ma_sp IS NULL OR v_ma_sp = '' THEN
            RAISE EXCEPTION 'Each item must include MaSP.';
        END IF;

        IF v_so_luong IS NULL OR v_so_luong <= 0 THEN
            RAISE EXCEPTION 'Invalid SoLuong for product %.', v_ma_sp;
        END IF;

        IF v_don_gia IS NULL OR v_don_gia <= 0 THEN
            RAISE EXCEPTION 'Invalid DonGia for product %.', v_ma_sp;
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public."TON_KHO" tk
            WHERE tk."MaKho" = p_ma_kho
              AND tk."MaSP" = v_ma_sp
              AND tk."SoLuongTon" >= v_so_luong
        ) THEN
            RAISE EXCEPTION 'Insufficient stock for product % at warehouse %.', v_ma_sp, p_ma_kho;
        END IF;

        v_thanh_tien := v_so_luong * v_don_gia;
        v_tong_tien := v_tong_tien + v_thanh_tien;
    END LOOP;

    INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien")
    VALUES (v_ma_hd, now(), p_ma_nv, p_ma_kho, v_tong_tien);

    -- Second pass: insert details and atomically decrement stock.
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;
        v_thanh_tien := v_so_luong * v_don_gia;

        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, v_so_luong, v_don_gia, v_thanh_tien);

        UPDATE public."TON_KHO"
        SET "SoLuongTon" = "SoLuongTon" - v_so_luong,
            "LastUpdated" = now()
        WHERE "MaKho" = p_ma_kho
          AND "MaSP" = v_ma_sp
          AND "SoLuongTon" >= v_so_luong;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Concurrent stock update detected for product % at warehouse %.', v_ma_sp, p_ma_kho;
        END IF;
    END LOOP;

    RETURN v_ma_hd;
END;
$$;

CREATE OR REPLACE FUNCTION public.doanh_thu_vung(
    start_date date,
    end_date date,
    region_code character varying
)
RETURNS TABLE(khu_vuc character varying, so_don_hang bigint, doanh_thu numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF start_date IS NULL OR end_date IS NULL THEN
        RAISE EXCEPTION 'start_date and end_date are required.';
    END IF;

    IF start_date > end_date THEN
        RAISE EXCEPTION 'start_date cannot be greater than end_date.';
    END IF;

    RETURN QUERY
    SELECT
        k."KhuVuc" AS khu_vuc,
        COUNT(hd."MaHD") AS so_don_hang,
        COALESCE(SUM(hd."TongTien"), 0) AS doanh_thu
    FROM public."HOA_DON" hd
    JOIN public."KHO" k ON hd."MaKho" = k."MaKho"
    WHERE hd."NgayLap" >= start_date
      AND hd."NgayLap" < (end_date + INTERVAL '1 day')
      AND (region_code = 'ALL' OR k."KhuVuc" = region_code)
    GROUP BY k."KhuVuc";
END;
$$;

CREATE OR REPLACE FUNCTION public.ton_kho_toan_quoc(
    p_masp character varying DEFAULT NULL
)
RETURNS TABLE(ma_kho character varying, ten_kho character varying, khu_vuc character varying, so_luong_ton integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k."MaKho" AS ma_kho,
        k."TenKho" AS ten_kho,
        k."KhuVuc" AS khu_vuc,
        COALESCE(
            SUM(
                CASE
                    WHEN p_masp IS NULL THEN COALESCE(tk."SoLuongTon", 0)
                    WHEN tk."MaSP" = p_masp THEN COALESCE(tk."SoLuongTon", 0)
                    ELSE 0
                END
            ),
            0
        )::integer AS so_luong_ton
    FROM public."KHO" k
    LEFT JOIN public."TON_KHO" tk ON tk."MaKho" = k."MaKho"
    GROUP BY k."MaKho", k."TenKho", k."KhuVuc"
    ORDER BY k."MaKho";
END;
$$;

CREATE OR REPLACE FUNCTION public.top_selling_products(
    p_limit integer
)
RETURNS TABLE(
    masp character varying,
    tensp character varying,
    total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_limit IS NULL OR p_limit < 1 THEN
        RAISE EXCEPTION 'p_limit must be >= 1.';
    END IF;

    RETURN QUERY
    SELECT
        ct."MaSP" AS masp,
        sp."TenSP" AS tensp,
        SUM(ct."SoLuong") AS total_sold
    FROM public."CT_HOA_DON" ct
    JOIN public."SAN_PHAM" sp ON ct."MaSP" = sp."MaSP"
    GROUP BY ct."MaSP", sp."TenSP"
    ORDER BY total_sold DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_profitability(
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone
) RETURNS TABLE (
    ma_sp character varying,
    ten_sp character varying,
    so_luong_ban bigint,
    doanh_thu numeric,
    gia_von numeric,
    loi_nhuan numeric,
    ty_suat_loi_nhuan numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'p_start_date and p_end_date are required.';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'p_start_date cannot be greater than p_end_date.';
    END IF;

    RETURN QUERY
    WITH product_costs AS (
        SELECT
            cpn."MaSP",
            AVG(cpn."DonGiaNhap") AS avg_cost
        FROM public."CT_PHIEU_NHAP" cpn
        GROUP BY cpn."MaSP"
    ),
    sales_data AS (
        SELECT
            chd."MaSP",
            sp."TenSP",
            SUM(chd."SoLuong") AS total_qty,
            SUM(chd."ThanhTien") AS total_revenue
        FROM public."CT_HOA_DON" chd
        JOIN public."HOA_DON" hd ON chd."MaHD" = hd."MaHD"
        JOIN public."SAN_PHAM" sp ON chd."MaSP" = sp."MaSP"
        WHERE hd."NgayLap" >= p_start_date
          AND hd."NgayLap" <= p_end_date
        GROUP BY chd."MaSP", sp."TenSP"
    )
    SELECT
        sd."MaSP",
        sd."TenSP",
        sd.total_qty,
        sd.total_revenue,
        (sd.total_qty * COALESCE(pc.avg_cost, 0))::numeric AS total_cost,
        (sd.total_revenue - (sd.total_qty * COALESCE(pc.avg_cost, 0)))::numeric AS profit,
        CASE
            WHEN sd.total_revenue > 0
            THEN ((sd.total_revenue - (sd.total_qty * COALESCE(pc.avg_cost, 0))) / sd.total_revenue * 100)::numeric
            ELSE 0
        END AS margin_percent
    FROM sales_data sd
    LEFT JOIN product_costs pc ON sd."MaSP" = pc."MaSP"
    ORDER BY profit DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.create_invoice(character varying, character varying, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.doanh_thu_vung(date, date, character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ton_kho_toan_quoc(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.top_selling_products(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_profitability(timestamp with time zone, timestamp with time zone) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_invoice(character varying, character varying, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.doanh_thu_vung(date, date, character varying) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ton_kho_toan_quoc(character varying) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.top_selling_products(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_profitability(timestamp with time zone, timestamp with time zone) TO authenticated, service_role;
