-- 1. Seed some Goods Receipts (PHIEU_NHAP) to provide cost data for profitability
INSERT INTO "public"."PHIEU_NHAP" ("MaPN", "NgayNhap", "MaNCC", "MaKho", "TongTienNhap") VALUES
('PN001', now() - interval '10 days', 'NCC01', 'KHO_HCM', 100000000.00),
('PN002', now() - interval '5 days', 'NCC02', 'KHO_HN', 150000000.00);

INSERT INTO "public"."CT_PHIEU_NHAP" ("MaPN", "MaSP", "SoLuong", "DonGiaNhap", "ThanhTien") VALUES
('PN001', 'SP001', 2, 20000000.00, 40000000.00),
('PN001', 'SP002', 2, 30000000.00, 60000000.00),
('PN002', 'SP003', 5, 25000000.00, 125000000.00),
('PN002', 'SP005', 5, 5000000.00, 25000000.00);

-- 2. Seed some Sales Invoices (HOA_DON) for TODAY to populate Dashboard
INSERT INTO "public"."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien") VALUES
('HD-TODAY-01', now(), 'NV01', 'KHO_HCM', 63490000.00),
('HD-TODAY-02', now(), 'NV02', 'KHO_HN', 31000000.00);

INSERT INTO "public"."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien") VALUES
('HD-TODAY-01', 'SP001', 1, 28500000.00, 28500000.00),
('HD-TODAY-01', 'SP002', 1, 34990000.00, 34990000.00),
('HD-TODAY-02', 'SP003', 1, 31000000.00, 31000000.00);

-- 3. Update Inventory (TON_KHO) to ensure there is enough stock for dashboard/transfers
INSERT INTO "public"."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") VALUES
('KHO_HCM', 'SP001', 50, now()),
('KHO_HCM', 'SP002', 30, now()),
('KHO_HCM', 'SP003', 20, now()),
('KHO_HN', 'SP001', 10, now()),
('KHO_HN', 'SP004', 15, now())
ON CONFLICT ("MaKho", "MaSP") DO UPDATE 
SET "SoLuongTon" = "public"."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon", "LastUpdated" = now();

-- 4. Seed some sample Stock Transfers (STOCK_TRANSFER)
-- Note: sender_id and receiver_id would normally be UUIDs from auth.users.
-- Since we can't easily seed auth.users via SQL without side effects,
-- these records might not show up for a specific logged-in user until linked,
-- but they provide sample data for the "Admin" view or global lists.
INSERT INTO "public"."STOCK_TRANSFER" ("ma_sp", "from_kho", "to_kho", "so_luong", "status", "created_at") VALUES
('SP001', 'KHO_HCM', 'KHO_HN', 5, 'PENDING', now() - interval '1 hour'),
('SP002', 'KHO_HCM', 'KHO_DN', 2, 'CONFIRMED', now() - interval '2 days'),
('SP003', 'KHO_HN', 'KHO_HCM', 1, 'DECLINED', now() - interval '1 day');

-- Update the declined one with a reason
UPDATE "public"."STOCK_TRANSFER" 
SET "reason" = 'DAMAGED', "reason_detail" = 'Vỏ hộp bị móp méo nặng trong quá trình vận chuyển.'
WHERE "ma_sp" = 'SP003' AND "status" = 'DECLINED';
