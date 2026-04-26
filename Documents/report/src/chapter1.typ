#let chapter-1() = [
= CHƯƠNG 1: KHẢO SÁT HIỆN TRẠNG

== 1.1. Mục tiêu đề án
Hệ thống TechStore được xây dựng để quản lý bán hàng theo mô hình nhiều vai trò và nhiều kho theo khu vực. Hệ thống tập trung vào các tác vụ nghiệp vụ chính gồm tạo hóa đơn, điều phối chuyển kho hai bước, quản lý tồn kho, quản lý nhân sự theo phân cấp và tổng hợp báo cáo vận hành.

== 1.2. Bối cảnh nghiệp vụ
Dữ liệu vận hành được quản lý tập trung trên Supabase PostgreSQL với xác thực qua `auth.users` và hồ sơ nghiệp vụ qua `public.NHAN_VIEN`. Người dùng thao tác trên frontend React và thực hiện các nghiệp vụ thông qua API truy vấn bảng hoặc RPC có kiểm tra phân quyền.

== 1.3. Vai trò và phạm vi thao tác
#table(
  columns: (1.2fr, 2.1fr, 2.2fr),
  inset: 4pt,
  stroke: 0.5pt + luma(180),
  [#strong[Vai trò]], [#strong[Nghiệp vụ chính]], [#strong[Giới hạn]],
  [Admin], [Toàn quyền cấu hình, phân quyền site, điều phối nhân sự, báo cáo hệ thống], [Không giới hạn phạm vi dữ liệu theo khu vực.],
  [Supplier/Provider], [Điều phối chuyển kho từ kho nguồn và nhận chuyển kho theo quyền liên kết], [Không tạo hóa đơn bán lẻ.],
  [Retailer], [Vận hành kho bán lẻ, tạo hóa đơn, nhận hàng từ chuyển kho], [Không điều phối kho nguồn ngoài chính sách liên kết.],
  [Staff], [Tác nghiệp bán hàng trong phạm vi được cấp], [Không thao tác phân quyền và điều phối kho cấp cao.],
)

== 1.4. Quy trình nghiệp vụ cốt lõi

=== 1.4.1. Luồng tạo hóa đơn
Người dùng hợp lệ nhập danh sách sản phẩm, số lượng và kho thao tác. RPC `create_invoice` xác thực vai trò, trạng thái nhân sự, kiểm tra tồn kho, ghi dữ liệu vào `HOA_DON` và `CT_HOA_DON`, sau đó cập nhật `TON_KHO` trong cùng giao dịch.

=== 1.4.2. Luồng chuyển kho hai bước
Supplier gửi yêu cầu chuyển kho bằng RPC `initiate_transfer`. Người nhận xử lý tại danh sách pending bằng RPC `respond_to_transfer` với hành động xác nhận hoặc từ chối. Trường hợp xác nhận cập nhật tồn kho nguồn/đích và lưu snapshot trước-sau.

=== 1.4.3. Luồng điều phối nhân sự
Quyền quản lý nhân sự thực hiện theo mô hình thác nước. Cấp trên trực tiếp thao tác promote/demote hoặc cập nhật trạng thái cấp dưới qua RPC `hierarchy_control` và `manage_employee`. Cấp dưới gửi yêu cầu nghỉ việc qua trạng thái `PendingResign` và được duyệt trong mục pending.

== 1.5. Yêu cầu hệ thống

=== 1.5.1. Yêu cầu chức năng
- Quản lý danh mục sản phẩm.
- Tạo và tra cứu hóa đơn theo vai trò.
- Chuyển kho và xác nhận pending chuyển kho.
- Quản lý tồn kho theo quyền vai trò.
- Quản lý nhân sự và phân quyền theo phân cấp.
- Báo cáo doanh thu, tồn kho, sản phẩm bán chạy, lợi nhuận và lịch sử hóa đơn.

=== 1.5.2. Yêu cầu phi chức năng
- Kiểm soát truy cập theo RBAC kết hợp RLS.
- Giao diện vận hành trên desktop và thiết bị di động.
- Đồng bộ dữ liệu theo migration và policy thống nhất.
- Bảo toàn giao dịch cập nhật tồn kho và hóa đơn.
]
