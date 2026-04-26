#import "helpers.typ": *

#let chapter-4() = [
= CHƯƠNG 4: THIẾT KẾ, TRIỂN KHAI GIAO DIỆN VÀ VẬN HÀNH DEPLOY

== 4.1. Nguyên tắc thiết kế giao diện
Giao diện vận hành được xây dựng theo tiêu chí dễ thao tác, phân vùng chức năng rõ ràng theo vai trò, hiển thị trực tiếp trạng thái nghiệp vụ trọng tâm và hỗ trợ kiểm soát thao tác nhạy cảm qua hộp thoại xác nhận. Các trang chính đều giữ cấu trúc điều hướng thống nhất để người dùng chuyển đổi nhanh giữa nghiệp vụ hóa đơn, tồn kho, chuyển kho, báo cáo và điều phối nhân sự.

== 4.2. Danh sách màn hình nghiệp vụ chính

=== 4.2.1. Đăng nhập hệ thống
/* PLACEHOLDER_IMAGE_FILE: img/ui_login_page.png */
#ui-placeholder("img/ui_login_page.png", [Màn hình đăng nhập hệ thống.])

=== 4.2.2. Dashboard vận hành
/* PLACEHOLDER_IMAGE_FILE: img/ui_dashboard_admin.png */
#ui-placeholder("img/ui_dashboard_admin.png", [Màn hình Dashboard tổng quan cho vai trò Admin.])

=== 4.2.3. Danh mục sản phẩm
/* PLACEHOLDER_IMAGE_FILE: img/ui_products_page.png */
#ui-placeholder("img/ui_products_page.png", [Màn hình quản lý danh mục sản phẩm.])

=== 4.2.4. Tồn kho theo sản phẩm
/* PLACEHOLDER_IMAGE_FILE: img/ui_product_inventory_page.png */
#ui-placeholder("img/ui_product_inventory_page.png", [Màn hình tồn kho theo sản phẩm và phạm vi vai trò.])

/* PLACEHOLDER_IMAGE_FILE: img/ui_product_inventory_confirm_modal.png */
#ui-placeholder("img/ui_product_inventory_confirm_modal.png", [Hộp thoại xác nhận thay đổi tồn kho kèm lý do nghiệp vụ.])

=== 4.2.5. Tạo hóa đơn
/* PLACEHOLDER_IMAGE_FILE: img/ui_create_invoice_page.png */
#ui-placeholder("img/ui_create_invoice_page.png", [Màn hình tạo hóa đơn bán hàng.])

=== 4.2.6. Chuyển kho và pending confirmation
/* PLACEHOLDER_IMAGE_FILE: img/ui_inventory_transfer_page.png */
#ui-placeholder("img/ui_inventory_transfer_page.png", [Màn hình khởi tạo và theo dõi yêu cầu chuyển kho.])

/* PLACEHOLDER_IMAGE_FILE: img/ui_inventory_transfer_pending.png */
#ui-placeholder("img/ui_inventory_transfer_pending.png", [Màn hình xử lý pending chuyển kho cho actor nhận hàng.])

=== 4.2.7. Báo cáo và lịch sử hóa đơn
/* PLACEHOLDER_IMAGE_FILE: img/ui_reports_page.png */
#ui-placeholder("img/ui_reports_page.png", [Màn hình báo cáo tổng hợp theo vai trò.])

/* PLACEHOLDER_IMAGE_FILE: img/ui_invoice_history_workspace.png */
#ui-placeholder("img/ui_invoice_history_workspace.png", [Màn hình lịch sử hóa đơn với bộ lọc nâng cao.])

=== 4.2.8. Điều phối nhân sự và phân quyền site
/* PLACEHOLDER_IMAGE_FILE: img/ui_management_page.png */
#ui-placeholder("img/ui_management_page.png", [Màn hình điều phối nhân sự theo mô hình thác nước.])

/* PLACEHOLDER_IMAGE_FILE: img/ui_management_pending_resign.png */
#ui-placeholder("img/ui_management_pending_resign.png", [Màn hình xử lý yêu cầu nghỉ việc từ cấp dưới.])

/* PLACEHOLDER_IMAGE_FILE: img/ui_site_permissions_page.png */
#ui-placeholder("img/ui_site_permissions_page.png", [Màn hình quản lý liên kết cross-site và quyền kho của provider.])

== 4.3. Giải thuật nghiệp vụ triển khai

#alg([Giải thuật tạo hóa đơn có kiểm tra tồn kho], [
```text
Input: ma_nv, ma_kho, danh sách sản phẩm {ma_sp, so_luong}
1. Kiểm tra vai trò và trạng thái nhân sự.
2. Kiểm tra phạm vi kho theo vai trò.
3. Với mỗi sản phẩm: kiểm tra số lượng tồn hiện tại.
4. Tạo bản ghi HOA_DON.
5. Ghi từng dòng CT_HOA_DON.
6. Trừ tồn kho trong TON_KHO.
7. Commit transaction và trả mã hóa đơn.
```
])

#alg([Giải thuật xử lý yêu cầu chuyển kho], [
```text
Input: transfer_id, action, reason
1. Đọc bản ghi STOCK_TRANSFER theo transfer_id.
2. Kiểm tra actor nhận hàng có quyền xử lý.
3. Nếu action = CONFIRMED:
   3.1 Kiểm tra tồn kho nguồn tại thời điểm duyệt.
   3.2 Ghi nhận số lượng trước khi cập nhật.
   3.3 Trừ tồn kho nguồn, cộng tồn kho đích.
   3.4 Ghi snapshot trước/sau và cập nhật trạng thái CONFIRMED.
4. Nếu action = DECLINED:
   4.1 Ghi reason, reason_detail và trạng thái DECLINED.
5. Trả kết quả xử lý cho frontend.
```
])

#alg([Giải thuật cập nhật tồn kho theo sản phẩm trong frontend], [
```text
Input: danh sách tồn kho theo kho cho một sản phẩm
1. Tải profile người dùng hiện tại.
2. Xác định phạm vi xem/chỉnh theo role.
3. Người dùng chỉnh số lượng mới trên từng kho được phép.
4. Mở modal xác nhận và yêu cầu nhập lý do.
5. Upsert TON_KHO theo khóa (MaKho, MaSP).
6. Làm mới dữ liệu và hiển thị kết quả cập nhật.
```
])

== 4.4. Tổ chức mã nguồn frontend
```text
frontend/src/
  App.tsx
  i18n.ts
  pages/
    Dashboard.tsx
    ProductsPage.tsx
    ProductInventoryPage.tsx
    CreateInvoicePage.tsx
    InventoryTransferPage.tsx
    ReportsPage.tsx
    InvoiceHistoryPage.tsx
    ManagementPage.tsx
    SitePermissionsPage.tsx
    WarehouseSettingsPage.tsx
```

== 4.5. Quy trình deploy hệ thống

=== 4.5.1. Deploy frontend lên Netlify
Bước 1 thực hiện kết nối repository với Netlify và xác định đúng branch production. Bước 2 cấu hình thông số build gồm base directory, build command và publish directory phù hợp với cấu trúc `frontend/dist`. Bước 3 khai báo biến môi trường dành cho frontend và xác nhận quyền truy cập domain triển khai. Bước 4 kích hoạt deploy và theo dõi build log đến khi trạng thái publish hoàn tất.

/* PLACEHOLDER_IMAGE_FILE: img/deploy_netlify_project_config.png */
#ui-placeholder("img/deploy_netlify_project_config.png", [Màn hình cấu hình Build & Deploy trên Netlify.], h: 58mm)

/* PLACEHOLDER_IMAGE_FILE: img/deploy_netlify_publish_success.png */
#ui-placeholder("img/deploy_netlify_publish_success.png", [Màn hình deploy frontend thành công trên Netlify.], h: 58mm)

=== 4.5.2. Deploy migration và kiểm tra schema trên Supabase
Bước 1 chuẩn bị migration SQL theo thứ tự version trong thư mục `supabase/migrations`. Bước 2 áp dụng migration lên môi trường mục tiêu bằng Supabase CLI hoặc SQL Editor theo quy trình phát hành của nhóm. Bước 3 chạy truy vấn kiểm tra bảng, function, policy và các ràng buộc khóa ngoại để xác nhận schema đồng bộ. Bước 4 đối chiếu nghiệp vụ trực tiếp từ frontend nhằm xác nhận flow tạo hóa đơn, chuyển kho, báo cáo và phân quyền vận hành đúng với phiên bản vừa phát hành.

/* PLACEHOLDER_IMAGE_FILE: img/deploy_supabase_migration_apply.png */
#ui-placeholder("img/deploy_supabase_migration_apply.png", [Màn hình áp dụng migration trên Supabase.], h: 58mm)

/* PLACEHOLDER_IMAGE_FILE: img/deploy_supabase_sql_verification.png */
#ui-placeholder("img/deploy_supabase_sql_verification.png", [Màn hình kiểm tra schema sau khi deploy migration.], h: 58mm)
]
