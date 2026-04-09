-- Thực thi hàm tự động hóa
SELECT public.run_automated_business_flow();

-- Kiểm tra kết quả Hóa đơn
SELECT 'HÓA ĐƠN MỚI TẠO:' as label;
SELECT "MaHD", "NgayLap", "HoTen", "TongTien", "GhiChu"
FROM public."HOA_DON" h
JOIN public."NHAN_VIEN" n ON h."MaNV" = n."MaNV"
WHERE h."NgayLap" > now() - interval '1 minute'
ORDER BY h."NgayLap" DESC;

-- Kiểm tra kết quả Chuyển kho
SELECT 'LỆNH CHUYỂN KHO MỚI TẠO:' as label;
SELECT "ma_sp", "from_kho", "to_kho", "so_luong", "status", "GhiChu"
FROM public."STOCK_TRANSFER"
WHERE "created_at" > now() - interval '1 minute'
ORDER BY "created_at" DESC;
