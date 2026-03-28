-- Cho phép người dùng chưa đăng nhập (anon) được phép xem danh sách Kho
-- Điều này cần thiết để hiển thị dropdown trong trang Đăng ký
CREATE POLICY "Allow anon users to read KHO" ON "public"."KHO"
FOR SELECT TO anon USING (true);

-- Tương tự cho các chính sách SELECT khác đã có cho authenticated
-- Chúng ta đảm bảo KHO luôn có thể đọc được
ALTER POLICY "Allow authenticated users to read KHO" ON "public"."KHO" TO authenticated, anon;
