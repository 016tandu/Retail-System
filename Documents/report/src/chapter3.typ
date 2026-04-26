#import "helpers.typ": *

#let chapter-3() = [
= CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

== 3.1. Biểu đồ phân rã chức năng
Hệ thống được phân rã thành sáu nhóm nghiệp vụ gồm phân quyền thác nước, tạo hóa đơn, CRUD tồn kho, quản lý tài khoản, xem và tạo báo cáo, chuyển kho và xác nhận pending.

== 3.2. Tác nhân và vai trò trong hệ thống
#table(
  columns: (1.2fr, 2.2fr, 2.2fr),
  inset: 4pt,
  stroke: 0.5pt + luma(180),
  [#strong[Tác nhân]], [#strong[Thao tác chính]], [#strong[Phạm vi giới hạn]],
  [Admin], [Quản trị cấu hình hệ thống, điều phối nhân sự, chỉnh tồn kho theo kho khu vực và truy cập báo cáo toàn cục.], [Không giới hạn theo khu vực dữ liệu.],
  [Supplier/Provider], [Điều phối chuyển kho từ kho nguồn, quản lý tồn kho tại kho phụ trách, theo dõi báo cáo tồn kho.], [Không thực hiện nghiệp vụ hóa đơn bán lẻ.],
  [Retailer], [Tạo hóa đơn tại kho bán lẻ, tiếp nhận chuyển kho, theo dõi báo cáo trong khu vực.], [Không chỉnh trực tiếp số lượng tồn kho.],
  [Staff], [Tạo hóa đơn trong phạm vi được phân công, theo dõi dữ liệu giao dịch cá nhân.], [Không điều phối nhân sự, không chỉnh tồn kho, không cấu hình liên kết kho.],
)

== 3.3. Sơ đồ Use Case

=== 3.3.1. Phân quyền thác nước
#report-image("../img/diagrams/use_case_diagram_01_phan_quyen_thac_nuoc.png", [Sơ đồ Use Case cho phân quyền thác nước theo vai trò.])

=== 3.3.2. Tạo hóa đơn
#report-image("../img/diagrams/use_case_diagram_02_tao_hoa_don.png", [Sơ đồ Use Case cho chức năng tạo hóa đơn.])

=== 3.3.3. CRUD tồn kho
#report-image("../img/diagrams/use_case_diagram_03_crud_ton_kho.png", [Sơ đồ Use Case cho CRUD tồn kho theo vai trò.])

=== 3.3.4. Quản lý tài khoản
#report-image("../img/diagrams/use_case_diagram_04_quan_ly_tai_khoan.png", [Sơ đồ Use Case cho quản lý tài khoản và trạng thái nhân sự.])

=== 3.3.5. Xem và tạo báo cáo
#report-image("../img/diagrams/use_case_diagram_05_xem_tao_bao_cao.png", [Sơ đồ Use Case cho khối báo cáo nghiệp vụ.])

=== 3.3.6. Chuyển kho và xác nhận
#report-image("../img/diagrams/use_case_diagram_06_chuyen_kho_va_confirmation.png", [Sơ đồ Use Case cho luồng chuyển kho và duyệt pending.])

== 3.4. Sơ đồ tuần tự (Sequence Diagram)

=== 3.4.1. Phân quyền thác nước
#report-image("../img/diagrams/sequence_diagram_01_phan_quyen_thac_nuoc.png", [Sơ đồ tuần tự cho phân quyền thác nước.])

=== 3.4.2. Tạo hóa đơn
#report-image("../img/diagrams/sequence_diagram_02_tao_hoa_don.png", [Sơ đồ tuần tự cho tạo hóa đơn và cập nhật tồn kho.])

=== 3.4.3. CRUD tồn kho
#report-image("../img/diagrams/sequence_diagram_03_crud_ton_kho.png", [Sơ đồ tuần tự cho CRUD tồn kho.])

=== 3.4.4. Quản lý tài khoản
#report-image("../img/diagrams/sequence_diagram_04_quan_ly_tai_khoan.png", [Sơ đồ tuần tự cho quản lý tài khoản và trạng thái nhân sự.])

=== 3.4.5. Xem và tạo báo cáo
#report-image("../img/diagrams/sequence_diagram_05_xem_tao_bao_cao.png", [Sơ đồ tuần tự cho nghiệp vụ báo cáo.])

=== 3.4.6. Chuyển kho và xác nhận
#report-image("../img/diagrams/sequence_diagram_06_chuyen_kho_va_confirmation.png", [Sơ đồ tuần tự cho luồng chuyển kho hai bước.])

== 3.5. Sơ đồ hoạt động (Activity Diagram)

=== 3.5.1. Phân quyền thác nước
#report-image("../img/diagrams/activity_diagram_01_phan_quyen_thac_nuoc.png", [Sơ đồ hoạt động cho phân quyền thác nước.])

=== 3.5.2. Tạo hóa đơn
#report-image("../img/diagrams/activity_diagram_02_tao_hoa_don.png", [Sơ đồ hoạt động cho tạo hóa đơn.])

=== 3.5.3. CRUD tồn kho
#report-image("../img/diagrams/activity_diagram_03_crud_ton_kho.png", [Sơ đồ hoạt động cho CRUD tồn kho.])

=== 3.5.4. Quản lý tài khoản
#report-image("../img/diagrams/activity_diagram_04_quan_ly_tai_khoan.png", [Sơ đồ hoạt động cho quản lý tài khoản.])

=== 3.5.5. Xem và tạo báo cáo
#report-image("../img/diagrams/activity_diagram_05_xem_tao_bao_cao.png", [Sơ đồ hoạt động cho luồng báo cáo.])

=== 3.5.6. Chuyển kho và xác nhận
#report-image("../img/diagrams/activity_diagram_06_chuyen_kho_va_confirmation.png", [Sơ đồ hoạt động cho chuyển kho và xác nhận.])

== 3.6. Thiết kế cơ sở dữ liệu

=== 3.6.1. Bảng dữ liệu trọng tâm
#table(
  columns: (2.2fr, 1.1fr, 2.1fr),
  inset: 4pt,
  stroke: 0.5pt + luma(180),
  [#strong[Bảng]], [#strong[Nhóm]], [#strong[Mô tả]],
  [`auth.users`], [Identity], [Thông tin định danh đăng nhập, metadata vai trò và trạng thái phiên.],
  [`NHAN_VIEN`], [Nhân sự], [Hồ sơ nghiệp vụ, vai trò, mã kho làm việc, trạng thái hoạt động.],
  [`KHO`], [Kho], [Danh mục kho theo khu vực và loại kho (`stock_warehouse`, `retail_warehouse`).],
  [`TON_KHO`], [Tồn kho], [Số lượng tồn theo từng cặp `MaKho` và `MaSP` cùng thời điểm cập nhật.],
  [`SAN_PHAM`], [Danh mục], [Thông tin sản phẩm dùng cho bán hàng và điều phối kho.],
  [`HOA_DON`], [Giao dịch], [Thông tin hóa đơn phát sinh theo nhân sự và kho.],
  [`CT_HOA_DON`], [Giao dịch], [Chi tiết dòng sản phẩm, số lượng và giá trị từng hóa đơn.],
  [`PHIEU_NHAP`], [Giao dịch], [Phiếu nhập hàng theo kho và nhà cung cấp, phục vụ nghiệp vụ giá vốn.],
  [`CT_PHIEU_NHAP`], [Giao dịch], [Chi tiết sản phẩm nhập kho, đơn giá nhập và thành tiền.],
  [`STOCK_TRANSFER`], [Điều phối], [Yêu cầu chuyển kho, trạng thái và snapshot tồn kho trước-sau.],
  [`RETAILER_SUPPLIER_LINK`], [Phân quyền site], [Liên kết retailer với supplier theo chính sách nghiệp vụ.],
  [`PROVIDER_WAREHOUSE_LINK`], [Phân quyền kho], [Danh sách kho mà provider được phép quản lý trực tiếp.],
)

=== 3.6.2. Hàm và trigger nghiệp vụ chính
Hệ thống sử dụng nhóm function và trigger trọng yếu gồm `create_invoice`, `initiate_transfer`, `respond_to_transfer`, `hierarchy_control`, `manage_employee`, `handle_new_user`. Nhóm này chịu trách nhiệm xác thực vai trò, kiểm tra điều kiện nghiệp vụ, cập nhật dữ liệu theo transaction và đồng bộ hồ sơ người dùng khi phát sinh tài khoản mới.

== 3.7. Giải thích chi tiết ERD cho schema hiện tại

=== 3.7.1. ERD schema public
#report-image("../img/erd/erd_public_schema.png", [ERD schema `public` cho các bảng nghiệp vụ bán hàng, tồn kho và điều phối kho.], h: 145mm)

ERD schema `public` thể hiện rõ ba cụm dữ liệu trung tâm. Cụm danh mục gồm `SAN_PHAM`, `KHO`, `KHU_VUC`, `NHA_CUNG_CAP` định nghĩa đối tượng nền tảng để hệ thống vận hành. Cụm giao dịch gồm `HOA_DON`, `CT_HOA_DON`, `PHIEU_NHAP`, `CT_PHIEU_NHAP`, `TON_KHO`, `STOCK_TRANSFER` thể hiện cách dòng nghiệp vụ tác động trực tiếp lên tồn kho và giá vốn. Cụm phân quyền liên kết gồm `NHAN_VIEN`, `RETAILER_SUPPLIER_LINK`, `PROVIDER_WAREHOUSE_LINK` biểu diễn quyền vận hành theo vai trò và theo kho phụ trách. Cấu trúc khóa ngoại bảo đảm mọi giao dịch đều gắn với thực thể hợp lệ, đồng thời hỗ trợ truy vết đầy đủ người thao tác, kho nguồn và kho đích.

=== 3.7.2. ERD schema auth
#report-image("../img/erd/erd_auth_schema.png", [ERD schema `auth` và mối liên hệ với bảng hồ sơ nghiệp vụ.], h: 135mm)

ERD schema `auth` mô tả vòng đời xác thực người dùng. `AUTH_USERS` là thực thể gốc liên kết đến `AUTH_SESSIONS`, `AUTH_REFRESH_TOKENS`, `AUTH_IDENTITIES`, `AUTH_MFA_FACTORS` để quản lý định danh, phiên và cơ chế bảo mật bổ sung. Liên kết `AUTH_USERS` tới `PUBLIC_NHAN_VIEN` là cầu nối giữa định danh đăng nhập và hồ sơ nghiệp vụ vận hành. Cầu nối này giúp hệ thống áp dụng đồng nhất kiểm soát vai trò từ đăng nhập cho tới truy vấn dữ liệu nghiệp vụ.

=== 3.7.3. Luồng đồng bộ auth và public
Luồng đồng bộ bắt đầu từ việc tạo tài khoản trong `auth.users`. Trigger nghiệp vụ tạo hoặc cập nhật hồ sơ `NHAN_VIEN` tương ứng để gắn role, mã kho và trạng thái. Từ thời điểm đó, mọi nghiệp vụ như lập hóa đơn, chuyển kho, chỉnh tồn kho, điều phối nhân sự đều dựa trên hồ sơ nghiệp vụ trong schema `public` nhưng vẫn giữ liên kết chặt chẽ với định danh ở schema `auth`.
]
