-- Seed Invoices (HOA_DON)
-- Note: TongTien will be updated by a trigger or calculated manually after details are inserted.
-- For this seed, we'll set it manually for simplicity.
INSERT INTO "public"."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien") VALUES
('HD001', '2026-01-15T10:30:00Z', 'NV01', 'KHO_HCM', 65000000.00),
('HD002', '2026-01-16T11:00:00Z', 'NV02', 'KHO_HN', 34990000.00),
('HD003', '2026-01-17T14:00:00Z', 'NV03', 'KHO_DN', 8490000.00),
('HD004', '2026-01-18T16:45:00Z', 'NV01', 'KHO_HCM', 31000000.00);

-- Seed Invoice Details (CT_HOA_DON)
INSERT INTO "public"."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien") VALUES
('HD001', 'SP001', 1, 28500000.00, 28500000.00),
('HD001', 'SP004', 1, 26500000.00, 26500000.00),
('HD002', 'SP002', 1, 34990000.00, 34990000.00),
('HD003', 'SP005', 1, 8490000.00, 8490000.00),
('HD004', 'SP003', 1, 31000000.00, 31000000.00);
