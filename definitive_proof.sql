SET client_encoding = 'UTF8';

-- Final Robust Function
CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void AS $$
DECLARE
    v_nv_id text;
    v_nv_kho text;
    v_sp_id text;
    v_sp_gia numeric;
    v_ma_hd text;
BEGIN
    -- 1. Fetch Random Active Employee
    SELECT "MaNV", "MaKho" INTO v_nv_id, v_nv_kho FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    
    -- 2. Fetch Random Product
    SELECT "MaSP", "GiaNiemYet" INTO v_sp_id, v_sp_gia FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;

    -- 3. Execute Business Logic
    IF v_nv_id IS NOT NULL AND v_sp_id IS NOT NULL THEN
        -- Create Invoice with Short ID (Max 20 chars)
        v_ma_hd := 'AT-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
        
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv_id, v_nv_kho, v_sp_gia, 'AUTOMATED FLOW SUCCESS AT ' || to_char(now(), 'HH24:MI:SS'));
        
        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_sp_id, 1, v_sp_gia, v_sp_gia);
        
        -- Create Transfer record
        INSERT INTO public."STOCK_TRANSFER" ("ma_sp", "from_kho", "to_kho", "so_luong", "status", "GhiChu")
        VALUES (v_sp_id, 'KHO_HCM', 'KHO_HN', 1, 'PENDING', 'AUTO-TRANSFER EVIDENCE');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Execute multiple times
SELECT public.run_automated_business_flow();
SELECT public.run_automated_business_flow();

-- SHOW FINAL EVIDENCE
SELECT '--- FINAL EVIDENCE ---' as status;
SELECT "MaHD", "NgayLap", "GhiChu" 
FROM public."HOA_DON" 
WHERE "MaHD" LIKE 'AT-%'
ORDER BY "NgayLap" DESC;
