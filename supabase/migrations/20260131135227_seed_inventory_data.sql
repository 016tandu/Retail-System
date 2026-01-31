-- Seed Inventory Data (TON_KHO)
INSERT INTO "public"."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated") VALUES
-- Product SP001
('KHO_HCM', 'SP001', 100, NOW()),
('KHO_HN', 'SP001', 50, NOW()),
('KHO_DN', 'SP001', 20, NOW()),

-- Product SP002
('KHO_HCM', 'SP002', 80, NOW()),
('KHO_HN', 'SP002', 40, NOW()),
('KHO_DN', 'SP002', 15, NOW()),

-- Product SP003
('KHO_HCM', 'SP003', 120, NOW()),
('KHO_HN', 'SP003', 60, NOW()),

-- Product SP004
('KHO_HCM', 'SP004', 70, NOW());
-- Note: SP005 has no inventory yet in any kho
