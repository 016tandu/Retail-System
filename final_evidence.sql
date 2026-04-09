SET client_encoding = 'UTF8';

-- 1. Ensure columns and roles
ALTER TABLE "public"."NHAN_VIEN" ADD COLUMN IF NOT EXISTS "role" character varying(20) DEFAULT 'Staff';
ALTER TABLE "public"."NHAN_VIEN" ADD COLUMN IF NOT EXISTS "TrangThai" character varying(20) DEFAULT 'Active';
ALTER TABLE "public"."HOA_DON" ADD COLUMN IF NOT EXISTS "GhiChu" text;
ALTER TABLE "public"."STOCK_TRANSFER" ADD COLUMN IF NOT EXISTS "GhiChu" text;

UPDATE "public"."NHAN_VIEN" SET "role" = 'Admin', "TrangThai" = 'Active' WHERE "MaNV" = 'NV01';
UPDATE "public"."NHAN_VIEN" SET "role" = 'Provider', "TrangThai" = 'Active' WHERE "MaNV" = 'NV02';
UPDATE "public"."NHAN_VIEN" SET "role" = 'Retailer', "TrangThai" = 'Active' WHERE "MaNV" = 'NV03';

-- 2. Definitive Function
CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void AS $$
DECLARE
    v_nv record;
    v_ma_sp character varying;
    v_ma_hd text;
    v_gia numeric;
BEGIN
    -- Get random active employee
    SELECT * INTO v_nv FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    -- Get random product
    SELECT "MaSP", "GiaNiemYet" INTO v_ma_sp, v_gia FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;

    IF v_nv IS NOT NULL AND v_ma_sp IS NOT NULL THEN
        -- Forced Invoice Creation
        v_ma_hd := 'HD-EVIDENCE-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
        
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv."MaNV", v_nv."MaKho", v_gia, 'MANUAL TEST EVIDENCE AT ' || to_char(now(), 'HH24:MI:SS'));
        
        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, 1, v_gia, v_gia);
        
        -- Forced Transfer record
        INSERT INTO public."STOCK_TRANSFER" ("ma_sp", "from_kho", "to_kho", "so_luong", "status", "GhiChu")
        VALUES (v_ma_sp, 'KHO_HCM', 'KHO_HN', 1, 'PENDING', 'MANUAL TRANSFER EVIDENCE');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Run
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();

-- 4. Result Evidence
SELECT '--- RESULT EVIDENCE ---' as status;
SELECT "MaHD", "NgayLap", "MaNV", "TongTien", "GhiChu" 
FROM public."HOA_DON" 
WHERE "MaHD" LIKE 'HD-EVIDENCE-%'
ORDER BY "NgayLap" DESC;
