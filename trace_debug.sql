SET client_encoding = 'UTF8';

DO $$
DECLARE
    v_nv_id text;
    v_nv_kho text;
    v_sp_id text;
    v_sp_gia numeric;
    v_ma_hd text;
BEGIN
    RAISE NOTICE '--- TRACE START ---';
    
    -- 1. Fetch Employee
    SELECT "MaNV", "MaKho" INTO v_nv_id, v_nv_kho FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' LIMIT 1;
    RAISE NOTICE 'TRACE: Employee fetched: %, Kho: %', v_nv_id, v_nv_kho;

    -- 2. Fetch Product
    SELECT "MaSP", "GiaNiemYet" INTO v_sp_id, v_sp_gia FROM public."SAN_PHAM" LIMIT 1;
    RAISE NOTICE 'TRACE: Product fetched: %, Price: %', v_sp_id, v_sp_gia;

    -- 3. Logic Check
    IF v_nv_id IS NULL THEN
        RAISE NOTICE 'TRACE: FAILED - v_nv_id is null';
    ELSIF v_sp_id IS NULL THEN
        RAISE NOTICE 'TRACE: FAILED - v_sp_id is null';
    ELSE
        v_ma_hd := 'HD-TRACE-' || to_char(now(), 'HH24MI');
        RAISE NOTICE 'TRACE: SUCCESS - Attempting INSERT with MaHD: %', v_ma_hd;
        
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv_id, v_nv_kho, v_sp_gia, 'TRACE TEST');
        
        RAISE NOTICE 'TRACE: INSERT COMPLETED';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TRACE: ERROR DETECTED: % (%)', SQLERRM, SQLSTATE;
END $$;

-- Verify
SELECT "MaHD", "NgayLap", "GhiChu" FROM public."HOA_DON" WHERE "MaHD" LIKE 'HD-TRACE-%';
