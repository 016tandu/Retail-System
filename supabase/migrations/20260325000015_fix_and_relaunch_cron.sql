-- 1. Safely unschedule old jobs
DO $$
BEGIN
    PERFORM cron.unschedule('techstore-automated-flow');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('generate-random-invoices');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('techstore-main-flow');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Definitive Automated Function (Verified Logic)
CREATE OR REPLACE FUNCTION public.run_automated_business_flow()
RETURNS void AS $$
DECLARE
    v_nv_id text;
    v_nv_kho text;
    v_sp_id text;
    v_sp_gia numeric;
    v_ma_hd text;
BEGIN
    -- Fetch Random Active Employee
    SELECT "MaNV", "MaKho" INTO v_nv_id, v_nv_kho FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active' ORDER BY random() LIMIT 1;
    
    -- Fetch Random Product
    SELECT "MaSP", "GiaNiemYet" INTO v_sp_id, v_sp_gia FROM public."SAN_PHAM" ORDER BY random() LIMIT 1;

    IF v_nv_id IS NOT NULL AND v_sp_id IS NOT NULL THEN
        -- Short ID (Max 20 chars) to satisfy database constraint
        v_ma_hd := 'AT-' || to_char(now(), 'YYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));
        
        -- Insert Invoice
        INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
        VALUES (v_ma_hd, now(), v_nv_id, v_nv_kho, v_sp_gia, 'AUTO-INVOICE AT ' || to_char(now(), 'HH24:MI'));
        
        -- Insert Details
        INSERT INTO public."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_sp_id, 1, v_sp_gia, v_sp_gia);
        
        -- Logic for simple auto-confirm of one pending transfer (if exists)
        UPDATE public."STOCK_TRANSFER" 
        SET status = 'CONFIRMED', updated_at = now() 
        WHERE id = (SELECT id FROM public."STOCK_TRANSFER" WHERE status = 'PENDING' LIMIT 1);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Register the Job (Every 20 minutes)
SELECT cron.schedule('techstore-main-flow', '*/20 * * * *', 'SELECT run_automated_business_flow()');
