SET client_encoding = 'UTF8';

-- Definitive Fixed Function (Short ID)
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
        -- SHORT ID (Max 20 chars)
        v_ma_hd := 'AUTO-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
        
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv."MaNV", v_nv."MaKho", v_gia, 'FIXED AUTO-INVOICE AT ' || to_char(now(), 'HH24:MI:SS'));
        
        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, 1, v_gia, v_gia);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Run 3 times
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();

-- SHOW CONCRETE EVIDENCE
SELECT '--- CONCRETE EVIDENCE ---' as status;
SELECT "MaHD", "NgayLap", "GhiChu" 
FROM public."HOA_DON" 
WHERE "MaHD" LIKE 'AUTO-%'
ORDER BY "NgayLap" DESC;
