-- Đảm bảo có nhân viên Active để Cron Job có thể chạy (Mã rút gọn < 10 ký tự)
INSERT INTO "public"."NHAN_VIEN" ("MaNV", "HoTen", "role", "MaKho", "TrangThai") VALUES
('SYS-AD01', 'Hệ Thống Admin', 'Admin', 'KHO_HCM', 'Active'),
('SYS-PR01', 'Cung Ứng Tổng', 'Provider', 'KHO_HCM', 'Active'),
('SYS-RT01', 'Quản Lý MB', 'Retailer', 'KHO_HN', 'Active'),
('SYS-RT02', 'Quản Lý MT', 'Retailer', 'KHO_DN', 'Active'),
('SYS-ST01', 'Bán Hàng HCM', 'Staff', 'KHO_HCM', 'Active'),
('SYS-ST02', 'Bán Hàng HN', 'Staff', 'KHO_HN', 'Active')
ON CONFLICT ("MaNV") DO UPDATE SET "TrangThai" = 'Active';
