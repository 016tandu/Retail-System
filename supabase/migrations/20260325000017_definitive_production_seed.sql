-- DEFINITIVE SEEDING FOR PRODUCTION
-- 1. Warehouses
INSERT INTO "public"."KHO" ("MaKho", "TenKho", "KhuVuc") VALUES
('KHO_HCM', 'Kho Tổng TP.Hồ Chí Minh', 'MN'),
('KHO_HN', 'Kho Chi Nhánh Hà Nội', 'MB'),
('KHO_DN', 'Kho Chi Nhánh Đà Nẵng', 'MT')
ON CONFLICT ("MaKho") DO NOTHING;

-- 2. Products
INSERT INTO "public"."SAN_PHAM" ("MaSP", "TenSP", "DonViTinh", "GiaNiemYet") VALUES
('SP001', 'iPhone 15 Pro Max', 'Cái', 34990000),
('SP002', 'Laptop Dell XPS 13', 'Cái', 28500000),
('SP003', 'Sony WH-1000XM5', 'Cái', 8490000)
ON CONFLICT ("MaSP") DO NOTHING;

-- 3. Initial Stock (Crucial for Invoices)
INSERT INTO "public"."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") VALUES
('KHO_HCM', 'SP001', 100, now()),
('KHO_HCM', 'SP002', 100, now()),
('KHO_HN', 'SP001', 50, now()),
('KHO_DN', 'SP003', 50, now())
ON CONFLICT ("MaKho", "MaSP") DO UPDATE SET "SoLuongTon" = 100;

-- 4. Employees (Short MaNV)
INSERT INTO "public"."NHAN_VIEN" ("MaNV", "HoTen", "role", "MaKho", "TrangThai") VALUES
('AD-01', 'Admin Hệ Thống', 'Admin', 'KHO_HCM', 'Active'),
('PR-01', 'Cung Ứng', 'Provider', 'KHO_HCM', 'Active'),
('RT-01', 'Quản Lý HN', 'Retailer', 'KHO_HN', 'Active'),
('ST-01', 'Staff HCM', 'Staff', 'KHO_HCM', 'Active')
ON CONFLICT ("MaNV") DO UPDATE SET "TrangThai" = 'Active';
