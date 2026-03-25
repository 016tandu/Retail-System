-- Seed Warehouses (KHO)
INSERT INTO "public"."KHO" ("MaKho", "TenKho", "KhuVuc") VALUES
('KHO_HCM', 'Kho Tổng TP.Hồ Chí Minh', 'MN'),
('KHO_HN', 'Kho Chi Nhánh Hà Nội', 'MB'),
('KHO_DN', 'Kho Chi Nhánh Đà Nẵng', 'MT');

-- Seed Suppliers (NHA_CUNG_CAP)
INSERT INTO "public"."NHA_CUNG_CAP" ("MaNCC", "TenNCC", "DiaChi", "SDT") VALUES
('NCC01', 'Nhà Phân Phối FPT', 'Số 10, Phạm Văn Bạch, Cầu Giấy, Hà Nội', '02473003000'),
('NCC02', 'Công ty TNHH Digiworld', 'Số 16, Đường số 5, KCN Sóng Thần, Dĩ An, Bình Dương', '02839290038');

-- Seed Products (SAN_PHAM)
INSERT INTO "public"."SAN_PHAM" ("MaSP", "TenSP", "DonViTinh", "GiaNiemYet") VALUES
('SP001', 'Laptop Dell XPS 13 9315', 'Cái', 28500000.00),
('SP002', 'iPhone 15 Pro Max 256GB', 'Cái', 34990000.00),
('SP003', 'Samsung Galaxy S24 Ultra', 'Cái', 31000000.00),
('SP004', 'MacBook Air M2 2023', 'Cái', 26500000.00),
('SP005', 'Tai nghe Sony WH-1000XM5', 'Cái', 8490000.00);

-- Seed Employees (NHAN_VIEN)
INSERT INTO "public"."NHAN_VIEN" ("MaNV", "HoTen", "NgaySinh", "MaKho") VALUES
('NV01', 'Nguyễn Văn A', '1990-01-15', 'KHO_HCM'),
('NV02', 'Trần Thị B', '1992-05-20', 'KHO_HN'),
('NV03', 'Lê Văn C', '1995-11-30', 'KHO_DN');