#let appendix-section() = [
= PHỤ LỤC

== Phụ lục A. Danh sách migration tiêu biểu
```text
supabase/migrations/
  20260321000000_create_invoice_function.sql
  20260404020000_fix_report_and_invoice_rls.sql
  20260404032000_transfer_topology_and_actor_flow.sql
  20260404010000_db_improvements_hierarchy_links_cron.sql
  20260421162000_update_auto_invoice_note_format.sql
```

== Phụ lục B. Tệp sơ đồ đã sử dụng trong báo cáo
```text
Documents/report/img/diagrams/
  use_case_diagram_01_...png -> use_case_diagram_06_...png
  sequence_diagram_01_...png -> sequence_diagram_06_...png
  activity_diagram_01_...png -> activity_diagram_06_...png
Documents/report/img/erd/
  erd_public_schema.png
  erd_auth_schema.png
```

== Phụ lục C. Danh sách ảnh giao diện đề xuất chụp
#table(
  columns: (3.4fr, 2.6fr),
  inset: 4pt,
  stroke: 0.5pt + luma(180),
  align: (left, left),
  [#strong[Tên file đề xuất]], [#strong[Mục đích]],
  [img/ui_login_page.png], [Màn hình đăng nhập.],
  [img/ui_dashboard_admin.png], [Dashboard tổng quan cho Admin.],
  [img/ui_products_page.png], [Danh mục sản phẩm.],
  [img/ui_product_inventory_page.png], [Tồn kho theo sản phẩm.],
  [img/ui_product_inventory_confirm_modal.png], [Modal xác nhận sửa tồn kho.],
  [img/ui_create_invoice_page.png], [Tạo hóa đơn.],
  [img/ui_inventory_transfer_page.png], [Khởi tạo chuyển kho.],
  [img/ui_inventory_transfer_pending.png], [Duyệt pending chuyển kho.],
  [img/ui_reports_page.png], [Trang báo cáo tổng hợp.],
  [img/ui_invoice_history_workspace.png], [Lịch sử hóa đơn.],
  [img/ui_management_page.png], [Điều phối nhân sự.],
  [img/ui_management_pending_resign.png], [Duyệt yêu cầu nghỉ việc.],
  [img/ui_site_permissions_page.png], [Phân quyền site và liên kết kho.],
  [img/deploy_netlify_project_config.png], [Màn hình cấu hình Build & Deploy trên Netlify.],
  [img/deploy_netlify_publish_success.png], [Màn hình deploy thành công trên Netlify.],
  [img/deploy_supabase_migration_apply.png], [Màn hình thực thi migration trên Supabase.],
  [img/deploy_supabase_sql_verification.png], [Màn hình kiểm tra schema sau deploy trên Supabase.],
)
]
