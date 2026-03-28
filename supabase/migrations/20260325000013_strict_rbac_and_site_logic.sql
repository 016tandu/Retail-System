-- 1. Bảng quản lý liên kết quyền vận chuyển/xem NCC giữa Retailer và Supplier
CREATE TABLE IF NOT EXISTS "public"."RETAILER_SUPPLIER_LINK" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "retailer_user_id" uuid REFERENCES auth.users(id),
    "supplier_ma_ncc" character varying(10) REFERENCES "public"."NHA_CUNG_CAP"("MaNCC"),
    "created_at" timestamp with time zone DEFAULT now(),
    UNIQUE("retailer_user_id", "supplier_ma_ncc")
);

ALTER TABLE "public"."RETAILER_SUPPLIER_LINK" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only Admin can manage links" ON "public"."RETAILER_SUPPLIER_LINK" FOR ALL TO authenticated USING ((SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) = 'Admin');
CREATE POLICY "Users can view their own links" ON "public"."RETAILER_SUPPLIER_LINK" FOR SELECT TO authenticated USING (auth.uid() = retailer_user_id);

-- 2. Cập nhật RLS cho NHA_CUNG_CAP (Chặt chẽ hơn)
DROP POLICY IF EXISTS "Regional visibility for NHA_CUNG_CAP" ON "public"."NHA_CUNG_CAP";
CREATE POLICY "Strict visibility for NHA_CUNG_CAP" ON "public"."NHA_CUNG_CAP"
FOR SELECT TO authenticated
USING (
    (SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) IN ('Admin', 'Provider')
    OR
    "MaNCC" IN (SELECT supplier_ma_ncc FROM "public"."RETAILER_SUPPLIER_LINK" WHERE retailer_user_id = auth.uid())
);

-- 3. Cập nhật RLS cho STOCK_TRANSFER
DROP POLICY IF EXISTS "Users can view transfers they are involved in" ON "public"."STOCK_TRANSFER";
CREATE POLICY "Role-based visibility for STOCK_TRANSFER" ON "public"."STOCK_TRANSFER"
FOR SELECT TO authenticated
USING (
    (SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) = 'Admin'
    OR
    sender_id = auth.uid()
    OR
    receiver_id = auth.uid()
);

-- 4. Hàm lấy danh sách cấp trên trực tiếp (Nearest Superiors)
CREATE OR REPLACE FUNCTION get_nearest_superiors(p_user_id uuid)
RETURNS TABLE (ho_ten text, role character varying) AS $$
DECLARE
    v_my_role character varying;
    v_my_kho character varying;
BEGIN
    SELECT role, "MaKho" INTO v_my_role, v_my_kho FROM public."NHAN_VIEN" WHERE user_id = p_user_id;

    IF v_my_role = 'Staff' THEN
        -- Staff -> Thấy các Retailer cùng kho
        RETURN QUERY SELECT nv."HoTen"::text, nv.role FROM public."NHAN_VIEN" nv WHERE nv.role = 'Retailer' AND nv."MaKho" = v_my_kho AND nv."TrangThai" = 'Active';
    ELSIF v_my_role IN ('Retailer', 'Provider') THEN
        -- Retailer/Provider -> Thấy các Admin
        RETURN QUERY SELECT nv."HoTen"::text, nv.role FROM public."NHAN_VIEN" nv WHERE nv.role = 'Admin' AND nv."TrangThai" = 'Active';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Cập nhật hàm báo cáo tồn kho để hỗ trợ filter chi nhánh/miền cho Admin
CREATE OR REPLACE FUNCTION ton_kho_advanced(
    p_ma_sp character varying DEFAULT NULL, -- NULL = All products
    p_khu_vuc character varying DEFAULT NULL -- NULL = All regions (Admin only)
) RETURNS TABLE (
    ma_kho character varying,
    ten_kho text,
    khu_vuc character varying,
    ma_sp character varying,
    ten_sp text,
    so_luong_ton integer
) AS $$
DECLARE
    v_my_role character varying;
    v_my_kho character varying;
    v_my_region character varying;
BEGIN
    SELECT role, "MaKho" INTO v_my_role, v_my_kho FROM public."NHAN_VIEN" WHERE user_id = auth.uid();
    SELECT k."KhuVuc" INTO v_my_region FROM public."KHO" k WHERE k."MaKho" = v_my_kho;

    RETURN QUERY
    SELECT 
        k."MaKho", k."TenKho", k."KhuVuc", sp."MaSP", sp."TenSP"::text, COALESCE(tk."SoLuongTon", 0)
    FROM public."KHO" k
    CROSS JOIN public."SAN_PHAM" sp
    LEFT JOIN public."TON_KHO" tk ON k."MaKho" = tk."MaKho" AND sp."MaSP" = tk."MaSP"
    WHERE 
        (p_ma_sp IS NULL OR sp."MaSP" = p_ma_sp)
        AND (
            v_my_role = 'Admin' 
            OR (v_my_role IN ('Retailer', 'Staff') AND k."MaKho" = v_my_kho)
            OR (v_my_role = 'Provider' AND k."KhuVuc" = v_my_region)
        )
        AND (p_khu_vuc IS NULL OR k."KhuVuc" = p_khu_vuc);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
