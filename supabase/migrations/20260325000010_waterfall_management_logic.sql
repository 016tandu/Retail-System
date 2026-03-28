-- 1. Hàm cập nhật hồ sơ cá nhân (My Profile)
CREATE OR REPLACE FUNCTION update_my_profile(
    p_ho_ten text,
    p_ngay_sinh date
) RETURNS void AS $$
BEGIN
    UPDATE public."NHAN_VIEN"
    SET "HoTen" = p_ho_ten,
        "NgaySinh" = p_ngay_sinh
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Hàm quản lý nhân viên theo mô hình thác nước
CREATE OR REPLACE FUNCTION manage_employee(
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
    -- Lấy thông tin người thực hiện
    SELECT role, "MaKho" INTO v_my_role, v_my_kho FROM public."NHAN_VIEN" WHERE user_id = auth.uid();
    
    -- Lấy thông tin đối tượng đích
    SELECT role, "MaKho" INTO v_target_role, v_target_kho FROM public."NHAN_VIEN" WHERE "MaNV" = p_target_ma_nv;

    -- Logic Thác nước:
    -- Admin chỉ được sửa Provider và Retailer
    IF v_my_role = 'Admin' AND v_target_role IN ('Provider', 'Retailer') THEN
        UPDATE public."NHAN_VIEN" 
        SET role = p_new_role, "TrangThai" = p_new_trang_thai 
        WHERE "MaNV" = p_target_ma_nv;
        
    -- Retailer chỉ được sửa Staff trong cùng Kho
    ELSIF v_my_role = 'Retailer' AND v_target_role = 'Staff' AND v_my_kho = v_target_kho THEN
        UPDATE public."NHAN_VIEN" 
        SET "TrangThai" = p_new_trang_thai 
        WHERE "MaNV" = p_target_ma_nv;
        
    ELSE
        RAISE EXCEPTION 'Bạn không có quyền quản lý nhân viên này theo mô hình cấp bậc.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hàm cập nhật thông tin Kho (Dành cho Provider/Admin)
CREATE OR REPLACE FUNCTION update_warehouse_info(
    p_ma_kho character varying,
    p_ten_kho text,
    p_khu_vuc character varying
) RETURNS void AS $$
DECLARE
    v_my_role character varying;
BEGIN
    SELECT role INTO v_my_role FROM public."NHAN_VIEN" WHERE user_id = auth.uid();
    
    IF v_my_role IN ('Admin', 'Provider') THEN
        UPDATE public."KHO"
        SET "TenKho" = p_ten_kho, "KhuVuc" = p_khu_vuc
        WHERE "MaKho" = p_ma_kho;
    ELSE
        RAISE EXCEPTION 'Chỉ Nhà cung cấp hoặc Quản trị viên mới có quyền sửa thông tin Kho.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
