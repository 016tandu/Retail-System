-- Migration gieo trồng dữ liệu cốt lõi (Core Seeding)
-- Đảm bảo KHO, NHA_CUNG_CAP, SAN_PHAM, NHAN_VIEN có dữ liệu chính xác

-- 1. Gieo trồng KHO
INSERT INTO "public"."KHO" ("MaKho", "TenKho", "KhuVuc") VALUES
('KHO_HCM', 'Kho Tổng TP.Hồ Chí Minh', 'MN'),
('KHO_HN', 'Kho Chi Nhánh Hà Nội', 'MB'),
('KHO_DN', 'Kho Chi Nhánh Đà Nẵng', 'MT')
ON CONFLICT ("MaKho") DO UPDATE SET 
    "TenKho" = EXCLUDED."TenKho", 
    "KhuVuc" = EXCLUDED."KhuVuc";

-- 2. Gieo trồng NHA_CUNG_CAP
INSERT INTO "public"."NHA_CUNG_CAP" ("MaNCC", "TenNCC", "DiaChi", "SDT") VALUES
('NCC01', 'Nhà Phân Phối FPT', 'Số 10, Phạm Văn Bạch, Cầu Giấy, Hà Nội', '02473003000'),
('NCC02', 'Công ty TNHH Digiworld', 'Số 16, Đường số 5, KCN Sóng Thần, Dĩ An, Bình Dương', '02839290038'),
('NCC03', 'Apple Vietnam', 'Quận 1, TP.HCM', '02812345678')
ON CONFLICT ("MaNCC") DO UPDATE SET 
    "TenNCC" = EXCLUDED."TenNCC", 
    "DiaChi" = EXCLUDED."DiaChi", 
    "SDT" = EXCLUDED."SDT";

-- 3. Gieo trồng SAN_PHAM
INSERT INTO "public"."SAN_PHAM" ("MaSP", "TenSP", "DonViTinh", "GiaNiemYet") VALUES
('SP001', 'Laptop Dell XPS 13 9315', 'Cái', 28500000.00),
('SP002', 'iPhone 15 Pro Max 256GB', 'Cái', 34990000.00),
('SP003', 'Samsung Galaxy S24 Ultra', 'Cái', 31000000.00),
('SP004', 'MacBook Air M2 2023', 'Cái', 26500000.00),
('SP005', 'Tai nghe Sony WH-1000XM5', 'Cái', 8490000.00),
('SP006', 'iPad Pro M2', 'Cái', 22000000.00)
ON CONFLICT ("MaSP") DO UPDATE SET 
    "TenSP" = EXCLUDED."TenSP", 
    "DonViTinh" = EXCLUDED."DonViTinh", 
    "GiaNiemYet" = EXCLUDED."GiaNiemYet";

-- 4. Gieo trồng NHAN_VIEN
-- Lưu ý: Không cập nhật user_id nếu đã có để tránh làm hỏng liên kết tài khoản
INSERT INTO "public"."NHAN_VIEN" ("MaNV", "HoTen", "NgaySinh", "MaKho", "role", "TrangThai") VALUES
('NV01', 'Nguyễn Văn A', '1990-01-15', 'KHO_HCM', 'Admin', 'Active'),
('NV02', 'Trần Thị B', '1992-05-20', 'KHO_HN', 'Provider', 'Active'),
('NV03', 'Lê Văn C', '1995-11-30', 'KHO_DN', 'Retailer', 'Active'),
('NV04', 'Phạm Thị D', '1988-08-08', 'KHO_HCM', 'Staff', 'Resigned'),
('NV05', 'Hoàng Văn E', '1993-03-03', 'KHO_HN', 'Retailer', 'Active')
ON CONFLICT ("MaNV") DO UPDATE SET 
    "HoTen" = EXCLUDED."HoTen", 
    "MaKho" = EXCLUDED."MaKho", 
    "role" = EXCLUDED."role", 
    "TrangThai" = EXCLUDED."TrangThai";
