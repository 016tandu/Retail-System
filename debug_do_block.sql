SET client_encoding = 'UTF8';

DO $$
DECLARE
    v_nv record;
    v_ma_sp record;
    v_ma_hd text;
BEGIN
    RAISE NOTICE '--- DEBUG START ---';
    
    -- Step 1: Find Employee
    SELECT * INTO v_nv FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' LIMIT 1;
    IF v_nv IS NULL THEN
        RAISE NOTICE 'DEBUG: v_nv is NULL';
    ELSE
        RAISE NOTICE 'DEBUG: v_nv found: %, Kho: %', v_nv."MaNV", v_nv."MaKho";
    END IF;

    -- Step 2: Find Product
    SELECT * INTO v_ma_sp FROM public."SAN_PHAM" LIMIT 1;
    IF v_ma_sp IS NULL THEN
        RAISE NOTICE 'DEBUG: v_ma_sp is NULL';
    ELSE
        RAISE NOTICE 'DEBUG: v_ma_sp found: %, Gia: %', v_ma_sp."MaSP", v_ma_sp."GiaNiemYet";
    END IF;

    -- Step 3: Insert
    IF v_nv IS NOT NULL AND v_ma_sp IS NOT NULL THEN
        v_ma_hd := 'HD-DO-' || to_char(now(), 'HH24MI');
        RAISE NOTICE 'DEBUG: Attempting INSERT with MaHD: %', v_ma_hd;
        
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv."MaNV", v_nv."MaKho", v_ma_sp."GiaNiemYet", 'DO BLOCK TEST');
        
        RAISE NOTICE 'DEBUG: INSERT SUCCESSFUL';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'DEBUG: EXCEPTION CAUGHT: %', SQLERRM;
END $$;

-- Check result
SELECT "MaHD", "NgayLap", "GhiChu" FROM public."HOA_DON" WHERE "MaHD" LIKE 'HD-DO-%';
