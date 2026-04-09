SET client_encoding = 'UTF8';

-- Definitive Fixed Function with Logging
CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void AS $$
DECLARE
    v_nv record;
    v_ma_sp character varying;
    v_ma_hd text;
    v_gia numeric;
BEGIN
    -- Log start
    RAISE NOTICE 'Starting automated flow...';

    -- Get random active employee
    SELECT * INTO v_nv FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    IF v_nv IS NULL THEN
        RAISE NOTICE 'ERROR: No active employee found!';
        RETURN;
    END IF;
    RAISE NOTICE 'Selected employee: %', v_nv."MaNV";

    -- Get random product
    SELECT "MaSP", "GiaNiemYet" INTO v_ma_sp, v_gia FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;
    IF v_ma_sp IS NULL THEN
        RAISE NOTICE 'ERROR: No product found!';
        RETURN;
    END IF;
    RAISE NOTICE 'Selected product: %', v_ma_sp;

    -- Forced Invoice Creation
    v_ma_hd := 'HD-AUTO-FIX-' || to_char(now(), 'HH24MI') || '-' || upper(substring(md5(random()::text) from 1 for 4));
    
    INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
    VALUES (v_ma_hd, now(), v_nv."MaNV", v_nv."MaKho", v_gia, 'AUTO-INVOICE LOG AT ' || to_char(now(), 'HH24:MI:SS'));
    
    INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
    VALUES (v_ma_hd, v_ma_sp, 1, v_gia, v_gia);
    
    RAISE NOTICE 'SUCCESS: Invoice % created.', v_ma_hd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Run
SELECT public.run_automated_business_flow();

-- Show Final Evidence
SELECT "MaHD", "NgayLap", "GhiChu" 
FROM public."HOA_DON" 
WHERE "MaHD" LIKE 'HD-AUTO-FIX-%'
ORDER BY "NgayLap" DESC;
