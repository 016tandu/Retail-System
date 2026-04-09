SET client_encoding = 'UTF8';

SELECT 'EMPLOYEES:' as info;
SELECT "MaNV", "role", "TrangThai", "MaKho" FROM public."NHAN_VIEN";

SELECT 'PRODUCTS:' as info;
SELECT "MaSP" FROM public."SAN_PHAM" LIMIT 5;

SELECT 'WAREHOUSES:' as info;
SELECT "MaKho" FROM public."KHO";
