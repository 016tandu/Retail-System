-- 1. Cập nhật thông tin Nhà cung cấp để hỗ trợ phân vùng
ALTER TABLE "public"."NHA_CUNG_CAP" ADD COLUMN IF NOT EXISTS "KhuVuc" character varying(10);

-- Gán vùng mặc định cho dữ liệu hiện có
UPDATE "public"."NHA_CUNG_CAP" SET "KhuVuc" = 'MN' WHERE "MaNCC" = 'NCC03';
UPDATE "public"."NHA_CUNG_CAP" SET "KhuVuc" = 'MB' WHERE "MaNCC" = 'NCC01';
UPDATE "public"."NHA_CUNG_CAP" SET "KhuVuc" = 'MT' WHERE "MaNCC" = 'NCC02';

-- 2. Cập nhật RLS cho NHA_CUNG_CAP: Retailer chỉ xem được NCC trong vùng của kho mình
DROP POLICY IF EXISTS "Allow authenticated users to read NHA_CUNG_CAP" ON "public"."NHA_CUNG_CAP";

CREATE POLICY "Regional visibility for NHA_CUNG_CAP" ON "public"."NHA_CUNG_CAP"
FOR SELECT TO authenticated
USING (
    (SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) IN ('Admin', 'Provider')
    OR 
    "KhuVuc" = (
        SELECT k."KhuVuc" 
        FROM "public"."KHO" k 
        JOIN "public"."NHAN_VIEN" nv ON k."MaKho" = nv."MaKho" 
        WHERE nv.user_id = auth.uid()
    )
);

-- 3. Cập nhật RLS cho SAN_PHAM: Chỉ Admin và Provider được CRUD
DROP POLICY IF EXISTS "Allow authenticated users to read SAN_PHAM" ON "public"."SAN_PHAM";
CREATE POLICY "Everyone can read products" ON "public"."SAN_PHAM" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admin and Provider can CRUD products" ON "public"."SAN_PHAM"
FOR ALL TO authenticated
USING ((SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) IN ('Admin', 'Provider'))
WITH CHECK ((SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) IN ('Admin', 'Provider'));

-- 4. Hàm Thăng cấp/Giáng cấp (Waterfall Promotion/Demotion)
CREATE OR REPLACE FUNCTION hierarchy_control(
    p_target_ma_nv character varying,
    p_action text -- 'PROMOTE' hoặc 'DEMOTE'
) RETURNS void AS $$
DECLARE
    v_my_role character varying;
    v_target_role character varying;
    v_my_kho character varying;
    v_target_kho character varying;
BEGIN
    SELECT role, "MaKho" INTO v_my_role, v_my_kho FROM public."NHAN_VIEN" WHERE user_id = auth.uid();
    SELECT role, "MaKho" INTO v_target_role, v_target_kho FROM public."NHAN_VIEN" WHERE "MaNV" = p_target_ma_nv;

    -- ADMIN: Quản lý Provider <-> Retailer
    IF v_my_role = 'Admin' THEN
        IF p_action = 'PROMOTE' AND v_target_role = 'Retailer' THEN
            UPDATE public."NHAN_VIEN" SET role = 'Provider' WHERE "MaNV" = p_target_ma_nv;
        ELSIF p_action = 'DEMOTE' AND v_target_role = 'Provider' THEN
            UPDATE public."NHAN_VIEN" SET role = 'Retailer' WHERE "MaNV" = p_target_ma_nv;
        ELSE
            RAISE EXCEPTION 'Admin chỉ có thể Thăng cấp Retailer hoặc Giáng cấp Provider.';
        END IF;

    -- RETAILER: Quản lý Staff
    ELSIF v_my_role = 'Retailer' THEN
        IF v_my_kho != v_target_kho THEN
            RAISE EXCEPTION 'Bạn chỉ có thể quản lý nhân viên trong cùng kho.';
        END IF;

        IF p_action = 'PROMOTE' AND v_target_role = 'Staff' THEN
            -- Retailer không thể tự thăng staff lên bằng cấp mình (Retailer), 
            -- nhưng có thể gửi yêu cầu (ở đây ta cho phép lên Staff+ hoặc tương đương tùy logic, 
            -- hiện tại ta giữ đúng yêu cầu: quản lý được trực tiếp cấp nhỏ tiếp theo)
            -- Giả sử thăng staff lên một vị trí đặc biệt hoặc đơn giản là Active lại.
            UPDATE public."NHAN_VIEN" SET "TrangThai" = 'Active' WHERE "MaNV" = p_target_ma_nv;
        ELSE
            RAISE EXCEPTION 'Retailer chỉ có thể quản lý trạng thái của Staff.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Bạn không có quyền thực hiện thao tác này.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
