-- Debug inventory and employees
SELECT 'EMPLOYEES:' as info;
SELECT "MaNV", "HoTen", "role", "TrangThai", "MaKho" FROM public."NHAN_VIEN";

SELECT 'PRODUCTS:' as info;
SELECT "MaSP", "TenSP" FROM public."SAN_PHAM" LIMIT 5;

SELECT 'WAREHOUSES:' as info;
SELECT "MaKho", "TenKho" FROM public."KHO";
