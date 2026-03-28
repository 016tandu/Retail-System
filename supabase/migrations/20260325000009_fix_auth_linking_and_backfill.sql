-- 1. Cập nhật hàm xử lý user mới để thông minh và an toàn hơn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_ma_kho character varying;
BEGIN
    -- Kiểm tra xem ma_kho truyền vào có tồn tại trong bảng KHO không
    SELECT "MaKho" INTO v_ma_kho 
    FROM public."KHO" 
    WHERE "MaKho" = coalesce(new.raw_user_meta_data->>'ma_kho', 'KHO_HCM');

    -- Nếu không tìm thấy kho hợp lệ, gán mặc định là KHO_HCM
    IF v_ma_kho IS NULL THEN
        v_ma_kho := 'KHO_HCM';
    END IF;

    -- Chèn vào bảng NHAN_VIEN
    -- Sử dụng ON CONFLICT để tránh lỗi nếu trigger chạy lại
    INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
    VALUES (
        'NV-' || upper(substring(md5(new.id::text) from 1 for 6)),
        coalesce(new.raw_user_meta_data->>'full_name', 'Người dùng mới'),
        new.id,
        coalesce(new.raw_user_meta_data->>'role', 'Staff'),
        v_ma_kho,
        'Active'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Đảm bảo RLS cho phép trigger (chạy với quyền postgres) hoạt động
ALTER TABLE public."NHAN_VIEN" FORCE ROW LEVEL SECURITY;

-- 3. Script liên kết bù cho các user hiện có trong auth.users nhưng thiếu trong NHAN_VIEN
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, raw_user_meta_data FROM auth.users LOOP
        -- Chỉ chèn nếu user_id chưa tồn tại trong NHAN_VIEN
        IF NOT EXISTS (SELECT 1 FROM public."NHAN_VIEN" WHERE user_id = user_record.id) THEN
            INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
            VALUES (
                'NV-' || upper(substring(md5(user_record.id::text) from 1 for 6)),
                coalesce(user_record.raw_user_meta_data->>'full_name', 'User Backfilled'),
                user_record.id,
                coalesce(user_record.raw_user_meta_data->>'role', 'Staff'),
                'KHO_HCM', -- Mặc định cho dữ liệu cũ
                'Active'
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
