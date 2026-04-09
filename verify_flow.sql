-- Verify script
SELECT 'ACTIVE EMPLOYEES COUNT:' as info;
SELECT count(*) FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active';

SELECT 'RUNNING AUTOMATED FLOW...' as info;
SELECT public.run_automated_business_flow();

SELECT 'LATEST INVOICES (CONCRETE EVIDENCE):' as info;
SELECT "MaHD", "NgayLap", "MaNV", "TongTien", "GhiChu" 
FROM public."HOA_DON" 
ORDER BY "NgayLap" DESC LIMIT 5;
