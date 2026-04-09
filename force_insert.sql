SET client_encoding = 'UTF8';

-- 1. Check basic availability
SELECT count(*) as nv_active_count FROM public."NHAN_VIEN" WHERE "TrangThai" = 'Active';
SELECT count(*) as sp_count FROM public."SAN_PHAM";

-- 2. Try DIRECT INSERT (Force Evidence)
INSERT INTO public."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien", "GhiChu")
VALUES (
    'HD-DIRECT-' || to_char(now(), 'HH24MI'), 
    now(), 
    'NV01', 
    'KHO_HCM', 
    1000000, 
    'DIRECT INSERT TEST AT ' || to_char(now(), 'HH24:MI:SS')
);

-- 3. Verify Direct Insert
SELECT "MaHD", "NgayLap", "GhiChu" 
FROM public."HOA_DON" 
WHERE "MaHD" LIKE 'HD-DIRECT-%';
