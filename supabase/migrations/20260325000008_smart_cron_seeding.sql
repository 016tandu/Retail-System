-- 1. Kích hoạt extension pg_cron (nếu Supabase của bạn hỗ trợ local)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Cập nhật hàm sinh hóa đơn ngẫu nhiên để "thông minh" hơn
-- Nó sẽ ưu tiên nhân viên Active cho hóa đơn mới, nhưng thỉnh thoảng tạo hóa đơn cũ cho nhân viên Resigned
CREATE OR REPLACE FUNCTION generate_smart_random_data()
RETURNS void AS $$
DECLARE
    v_ma_nv character varying;
    v_ma_kho character varying;
    v_ma_sp character varying;
    v_gia_niemyet numeric;
    v_items jsonb;
    v_is_historical boolean;
    v_ngay_lap timestamp with time zone;
BEGIN
    -- 20% cơ hội tạo dữ liệu lịch sử (từ nhân viên đã nghỉ)
    v_is_historical := (random() < 0.2);

    IF v_is_historical THEN
        SELECT "MaNV", "MaKho" INTO v_ma_nv, v_ma_kho 
        FROM "public"."NHAN_VIEN" 
        WHERE "TrangThai" = 'Resigned' 
        ORDER BY random() LIMIT 1;
        
        v_ngay_lap := now() - (random() * interval '1 year'); -- Ngày ngẫu nhiên trong 1 năm qua
    ELSE
        SELECT "MaNV", "MaKho" INTO v_ma_nv, v_ma_kho 
        FROM "public"."NHAN_VIEN" 
        WHERE "TrangThai" = 'Active' 
        ORDER BY random() LIMIT 1;
        
        v_ngay_lap := now();
    END IF;

    -- Nếu tìm thấy nhân viên (đôi khi database chưa có nhân viên Resigned)
    IF v_ma_nv IS NOT NULL THEN
        -- Chọn sản phẩm ngẫu nhiên
        SELECT "MaSP", "GiaNiemYet" INTO v_ma_sp, v_gia_niemyet
        FROM "public"."SAN_PHAM"
        ORDER BY random() LIMIT 1;

        -- Tạo items
        v_items := jsonb_build_array(
            jsonb_build_object('MaSP', v_ma_sp, 'SoLuong', floor(random() * 3 + 1)::int, 'DonGia', v_gia_niemyet)
        );

        -- Chèn trực tiếp (vì create_invoice có chặn Resigned, ở đây ta chèn thủ công để giả lập lịch sử)
        INSERT INTO "public"."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien")
        VALUES (
            'SEED-' || to_char(v_ngay_lap, 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4)),
            v_ngay_lap,
            v_ma_nv,
            v_ma_kho,
            v_gia_niemyet
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Lên lịch chạy mỗi phút (giả lập hệ thống đang vận hành liên tục)
-- Lưu ý: Lệnh này có thể cần chạy thủ công nếu môi trường local không hỗ trợ cron table trực tiếp
-- SELECT cron.schedule('generate-random-invoices', '* * * * *', 'SELECT generate_smart_random_data()');
