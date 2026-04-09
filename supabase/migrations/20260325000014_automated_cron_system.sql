-- 1. Kích hoạt pg_cron (Supabase mặc định hỗ trợ)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Bổ sung cột GhiChu cho các bảng nghiệp vụ
ALTER TABLE "public"."HOA_DON" ADD COLUMN IF NOT EXISTS "GhiChu" text;
ALTER TABLE "public"."STOCK_TRANSFER" ADD COLUMN IF NOT EXISTS "GhiChu" text;

-- 3. Hàm Seeding Tự Động (Smart Automated Business Flow)
CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void AS $$
DECLARE
    v_provider_nv record;
    v_retailer_nv record;
    v_staff_nv record;
    v_ma_sp character varying;
    v_qty integer;
    v_transfer_id uuid;
    v_rand float;
    v_decline_reason decline_reason;
BEGIN
    -- Lấy ngẫu nhiên các Actor
    SELECT * INTO v_provider_nv FROM public."NHAN_VIEN" WHERE role = 'Provider' AND "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    SELECT * INTO v_retailer_nv FROM public."NHAN_VIEN" WHERE role = 'Retailer' AND "TrangThai" = 'Active' AND "MaKho" != v_provider_nv."MaKho" ORDER BY random() LIMIT 1;
    SELECT * INTO v_staff_nv FROM public."NHAN_VIEN" WHERE role = 'Staff' AND "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    
    -- Lấy sản phẩm ngẫu nhiên
    SELECT "MaSP" INTO v_ma_sp FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;

    -- A. GIẢ LẬP NHẬP HÀNG & CHUYỂN KHO (PROVIDER -> RETAILER)
    IF v_provider_nv IS NOT NULL AND v_retailer_nv IS NOT NULL THEN
        v_qty := floor(random() * 20 + 10);
        
        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") 
        VALUES (v_provider_nv."MaKho", v_ma_sp, 100, now()) 
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + 100;

        INSERT INTO public."STOCK_TRANSFER" (
            "ma_sp", "from_kho", "to_kho", "so_luong", "sender_id", "receiver_id", "status", "GhiChu"
        ) VALUES (
            v_ma_sp, 
            v_provider_nv."MaKho", 
            v_retailer_nv."MaKho", 
            v_qty, 
            v_provider_nv.user_id, 
            v_retailer_nv.user_id, 
            'PENDING',
            format('Hệ thống tự động chuyển ngày %s. Người gửi: %s (%s). Người nhận dự kiến: %s (%s)', 
                   to_char(now(), 'DD/MM/YYYY HH24:MI'), v_provider_nv."HoTen", v_provider_nv."MaNV", v_retailer_nv."HoTen", v_retailer_nv."MaNV")
        );
    END IF;

    -- B. XỬ LÝ PHẢN HỒI CHUYỂN KHO (Tỉ lệ 1/5 Decline)
    FOR v_transfer_id IN SELECT id FROM public."STOCK_TRANSFER" WHERE status = 'PENDING' AND created_at < now() - interval '1 second' ORDER BY random() LIMIT 1 LOOP
        v_rand := random();
        IF v_rand < 0.2 THEN
            v_decline_reason := (ARRAY['DAMAGED', 'INCORRECT_QUANTITY', 'WRONG_PRODUCT', 'OTHER'])[floor(random() * 4 + 1)]::decline_reason;
            UPDATE public."STOCK_TRANSFER" 
            SET status = 'DECLINED', reason = v_decline_reason, reason_detail = 'Kiểm tra tự động phát hiện sai lệch.', updated_at = now()
            WHERE id = v_transfer_id;
        ELSE
            DECLARE
                v_t record;
            BEGIN
                SELECT * INTO v_t FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id;
                UPDATE public."TON_KHO" SET "SoLuongTon" = "SoLuongTon" - v_t.so_luong, "LastUpdated" = now()
                WHERE "MaKho" = v_t.from_kho AND "MaSP" = v_t.ma_sp;
                INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") 
                VALUES (v_t.to_kho, v_t.ma_sp, v_t.so_luong, now())
                ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon", "LastUpdated" = now();
                UPDATE public."STOCK_TRANSFER" SET status = 'CONFIRMED', updated_at = now() WHERE id = v_transfer_id;
            END;
        END IF;
    END LOOP;

    -- C. TẠO HÓA ĐƠN BÁN LẺ (STAFF)
    IF v_staff_nv IS NOT NULL THEN
        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") 
        VALUES (v_staff_nv."MaKho", v_ma_sp, 50, now()) 
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + 50;

        DECLARE
            v_ma_hd text;
            v_gia numeric;
        BEGIN
            SELECT "GiaNiemYet" INTO v_gia FROM public."SAN_PHAM" WHERE "MaSP" = v_ma_sp;
            v_ma_hd := 'AUTO-HD-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
            INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
            VALUES (v_ma_hd, now(), v_staff_nv."MaNV", v_staff_nv."MaKho", v_gia, 
                   format('Hóa đơn tự động tạo ngày %s bởi %s (%s)', to_char(now(), 'DD/MM/YYYY HH24:MI'), v_staff_nv."HoTen", v_staff_nv."MaNV"));
            INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
            VALUES (v_ma_hd, v_ma_sp, 1, v_gia, v_gia);
            UPDATE public."TON_KHO" SET "SoLuongTon" = "SoLuongTon" - 1, "LastUpdated" = now()
            WHERE "MaKho" = v_staff_nv."MaKho" AND "MaSP" = v_ma_sp;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Lên lịch Cron Job (Mỗi 20 phút)
SELECT cron.schedule('techstore-automated-flow', '*/20 * * * *', 'SELECT run_automated_business_flow()');

-- 5. View kiểm tra lỗi và lịch sử thực thi (Sửa lỗi thiếu cột)
CREATE OR REPLACE VIEW public.v_cron_monitor AS
SELECT 
    r.jobid,
    j.schedule,
    j.command,
    r.start_time as last_run,
    CASE 
        WHEN r.status = 'succeeded' THEN '✅ Thành công'
        WHEN r.status = 'failed' THEN '❌ Thất bại'
        ELSE '⏳ Đang chờ'
    END as tinh_trang,
    r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.command LIKE '%run_automated_business_flow%'
ORDER BY r.start_time DESC
LIMIT 10;
