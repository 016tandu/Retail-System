-- Mở khóa RLS để API có thể truy vấn dữ liệu cơ sở
ALTER TABLE "public"."KHO" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SAN_PHAM" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NHAN_VIEN" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TON_KHO" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HOA_DON" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."STOCK_TRANSFER" DISABLE ROW LEVEL SECURITY;

-- Lưu ý: Đây là hành động để debug và đảm bảo API hoạt động. 
-- Sau khi xác nhận dữ liệu, chúng ta nên bật lại và thiết lập Policy chuẩn.
