-- 1. Bổ sung cột GhiChu cho local
ALTER TABLE "public"."HOA_DON" ADD COLUMN IF NOT EXISTS "GhiChu" text;
ALTER TABLE "public"."STOCK_TRANSFER" ADD COLUMN IF NOT EXISTS "GhiChu" text;

-- 2. Đảm bảo hàm run_automated_business_flow tồn tại (Bản fix cho local)
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
    v_ma_hd text;
    v_gia numeric;
BEGIN
    SELECT * INTO v_provider_nv FROM public."NHAN_VIEN" WHERE role = 'Provider' AND "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    SELECT * INTO v_retailer_nv FROM public."NHAN_VIEN" WHERE role = 'Retailer' AND "TrangThai" = 'Active' AND "MaKho" != v_provider_nv."MaKho" ORDER BY random() LIMIT 1;
    SELECT * INTO v_staff_nv FROM public."NHAN_VIEN" WHERE role = 'Staff' AND "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    
    SELECT "MaSP" INTO v_ma_sp FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;

    -- A. CHUYỂN KHO
    IF v_provider_nv IS NOT NULL AND v_retailer_nv IS NOT NULL THEN
        v_qty := floor(random() * 10 + 5);
        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") 
        VALUES (v_provider_nv."MaKho", v_ma_sp, 100, now()) 
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + 100;

        INSERT INTO public."STOCK_TRANSFER" (
            "ma_sp", "from_kho", "to_kho", "so_luong", "sender_id", "receiver_id", "status", "GhiChu"
        ) VALUES (
            v_ma_sp, v_provider_nv."MaKho", v_retailer_nv."MaKho", v_qty, v_provider_nv.user_id, v_retailer_nv.user_id, 'PENDING',
            'AUTO-TRANSFER: ' || v_provider_nv."MaNV" || ' to ' || v_retailer_nv."MaNV"
        );
    END IF;

    -- B. PHẢN HỒI CHUYỂN KHO
    FOR v_transfer_id IN SELECT id FROM public."STOCK_TRANSFER" WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT 1 LOOP
        v_rand := random();
        IF v_rand < 0.2 THEN
            v_decline_reason := (ARRAY['DAMAGED', 'INCORRECT_QUANTITY', 'WRONG_PRODUCT', 'OTHER'])[floor(random() * 4 + 1)]::decline_reason;
            UPDATE public."STOCK_TRANSFER" SET status = 'DECLINED', reason = v_decline_reason, updated_at = now() WHERE id = v_transfer_id;
        ELSE
            UPDATE public."STOCK_TRANSFER" SET status = 'CONFIRMED', updated_at = now() WHERE id = v_transfer_id;
            UPDATE public."TON_KHO" SET "SoLuongTon" = "SoLuongTon" - (SELECT so_luong FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id) 
            WHERE "MaKho" = (SELECT from_kho FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id) AND "MaSP" = (SELECT ma_sp FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id);
            INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") 
            VALUES ((SELECT to_kho FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id), (SELECT ma_sp FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id), (SELECT so_luong FROM public."STOCK_TRANSFER" WHERE id = v_transfer_id), now())
            ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon", "LastUpdated" = now();
        END IF;
    END LOOP;

    -- C. TẠO HÓA ĐƠN
    IF v_staff_nv IS NOT NULL AND v_ma_sp IS NOT NULL THEN
        SELECT "GiaNiemYet" INTO v_gia FROM public."SAN_PHAM" WHERE "MaSP" = v_ma_sp;
        v_ma_hd := 'HD-LOCAL-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_staff_nv."MaNV", v_staff_nv."MaKho", v_gia, 'AUTO-INVOICE by ' || v_staff_nv."MaNV");
        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, 1, v_gia, v_gia);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Kích hoạt chạy ngay lập tức để tạo bằng chứng
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();
