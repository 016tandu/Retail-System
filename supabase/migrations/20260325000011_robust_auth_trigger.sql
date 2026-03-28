-- 1. Xóa trigger cũ để đảm bảo không bị xung đột definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Cập nhật hàm xử lý user mới với cơ chế an toàn tối đa
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_ma_nv character varying;
    v_ma_kho character varying;
BEGIN
    -- Tạo MaNV duy nhất
    v_ma_nv := 'NV-' || upper(substring(md5(new.id::text) from 1 for 6));
    
    -- Kiểm tra kho hợp lệ
    SELECT "MaKho" INTO v_ma_kho 
    FROM public."KHO" 
    WHERE "MaKho" = (new.raw_user_meta_data->>'ma_kho');

    IF v_ma_kho IS NULL THEN
        v_ma_kho := 'KHO_HCM'; -- Kho mặc định nếu không khớp
    END IF;

    -- Chèn hồ sơ nhân viên
    INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
    VALUES (
        v_ma_nv,
        coalesce(new.raw_user_meta_data->>'full_name', 'Người dùng mới'),
        new.id,
        coalesce(new.raw_user_meta_data->>'role', 'Staff'),
        v_ma_kho,
        'Active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
        "HoTen" = EXCLUDED."HoTen",
        "role" = EXCLUDED."role",
        "MaKho" = EXCLUDED."MaKho";

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Nếu có lỗi, vẫn cho phép tạo user auth nhưng ghi log (nếu có hệ thống log)
    RETURN new;
END;
$$;

-- 3. Tạo lại trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Cưỡng bức tạo hồ sơ cho tất cả user hiện có nhưng chưa có trong NHAN_VIEN
-- (Bao gồm cả user 'managermienbac@sysdesign.com' của bạn)
DO $$
DECLARE
    r RECORD;
    v_ma_kho_check text;
BEGIN
    FOR r IN SELECT id, raw_user_meta_data FROM auth.users LOOP
        IF NOT EXISTS (SELECT 1 FROM public."NHAN_VIEN" WHERE user_id = r.id) THEN
            
            SELECT "MaKho" INTO v_ma_kho_check FROM public."KHO" WHERE "MaKho" = (r.raw_user_meta_data->>'ma_kho');
            IF v_ma_kho_check IS NULL THEN v_ma_kho_check := 'KHO_HCM'; END IF;

            INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
            VALUES (
                'NV-' || upper(substring(md5(r.id::text) from 1 for 6)),
                coalesce(r.raw_user_meta_data->>'full_name', 'Backfilled User'),
                r.id,
                coalesce(r.raw_user_meta_data->>'role', 'Staff'),
                v_ma_kho_check,
                'Active'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
