# TechStore Project: TODO & Feature Roadmap

This document outlines the roadmap for the TechStore application.

---

## Phase 1: Core Functionality (Completed)

-   [x] **Database Setup & Migration:** Migrate schema to Supabase/Postgres.
-   [x] **Frontend Foundation:** Build a React SPA with Tailwind CSS.
-   [x] **Product & Supplier Viewing:** Implement pages to display data from the `SAN_PHAM` and `NHA_CUNG_CAP` tables.
-   [x] **Basic Reporting:** Implement RPC-based reports for Revenue, Inventory, and Top Sellers.

---

## Phase 2: User Management & Authentication (Completed)

-   [x] **Feature: User Login, Logout, and Roles**
    -   **User Perspective:** "As a user, I want to be able to log in with a username and password. Depending on my role (e.g., Admin, Warehouse Manager), I should only see the data and features relevant to me."
    -   **Business Analyst Perspective:** "We need to secure the application and ensure data integrity. Implementing Role-Based Access Control (RBAC) will prevent unauthorized users from accessing or modifying sensitive information."
    -   **Developer Perspective:** "Implement Supabase Auth. Create Row Level Security (RLS) policies on tables like `HOA_DON` and `TON_KHO` to restrict access based on the logged-in user's role or ID. Update the frontend to include login pages and manage user sessions."
-   [x] **Implementation Details:**
    -   Added `LoginPage` and integrated into `App.tsx`.
    -   Enabled RLS on all tables via migration `20260320000000_enable_rls_and_policies.sql`.
    -   Added `user_id` and `role` columns to `NHAN_VIEN` table.

---

## Phase 3: Transactional Operations (Completed)

-   [x] **Feature: Create Invoices and Goods Receipts**
    -   **User Perspective:** "As a salesperson, I need a form to create a new sales invoice (`HOA_DON`). I want to be able to add multiple products (`CT_HOA_DON`) to the invoice and have the total calculated automatically."
    -   **Business Analyst Perspective:** "We need to streamline the data entry process for sales and purchasing to reduce errors and improve efficiency. This feature is critical for accurate financial and inventory tracking."
    -   **Developer Perspective:** "Build new pages/components in React for creating/editing invoices and receipts. Since this involves writing to multiple tables (`HOA_DON` and `CT_HOA_DON`) simultaneously, create a PostgreSQL function (RPC) to handle the entire transaction atomically, ensuring data consistency."
-   [x] **Implementation Details:**
    -   Created `create_invoice(p_ma_nv, p_ma_kho, p_items)` RPC in migration `20260321000000_create_invoice_function.sql`.
    -   Implemented `CreateInvoicePage.tsx` with dynamic line items and validation.
    -   Integrated new page into `App.tsx` routing and navigation.

---

## Phase 4: Advanced Features & QoL (Completed)

-   [x] **Feature: Advanced Profitability Report**
-   [x] **Feature: Internationalization (i18n)** - Added VI/EN support and language switcher.
-   [x] **Feature: Homepage Dashboard**
    -   **Implementation Details:** Created `get_dashboard_metrics()` RPC and `Dashboard.tsx` with high-level metrics overview.

---

## Phase 5: RBAC & Advanced Inventory Workflows (Completed)

-   [x] **Feature: Multi-Role Authentication UI**
-   [x] **Feature: Two-Step Inventory Transfer**
-   [x] **Feature: Role-Based Access Control (RBAC)**

---

____

## Extra Tasks (Completed)

-   [x] **Database & Seeding Cleanup:**
    -   Dropped duplicate `SanPham` table.
    -   Ensured `KHO`, `NHA_CUNG_CAP`, `NHAN_VIEN`, and `SAN_PHAM` are fully seeded with correct data.
    -   Added `TrangThai` (Active/Resigned) to `NHAN_VIEN`.
-   [x] **Advanced Logic:**
    -   Implemented `generate_random_invoice()` for smart data simulation.
    -   Updated `create_invoice` to block resigned employees.
-   [x] **UI/UX Improvements:**
    -   Added hover info icons explaining roles in Registration.
    -   Added "RESIGNED" visual indicator and functional blocks in `App.tsx`.
-   [x] **Documentation:**
    -   Created `BusinessAnalystGuide.md`.
    -   Updated `Architecture.md` with new flows.




## Improvements  

- Password input: nên có nút show/hide (icon con mắc và con mắt bị gạch chéo)
- Navigation bar: 
    - Đối với report có dropdown cho từng loại report, mỗi lần vào report thì chỉ hiển thị loại report đó, hơn nữa: thêm nút export to pdf/xlsl, sử dụng thư viện bên ngoài nếu cần thiết, cần có nút preview và một số config nữa, hiện tại vẫn chưa fetch tất cả sản phẩm khả dĩ để hiển thị dropdown và smart search (hiển thị vừa có mã sản phẩm, vừa có tên tương ứng để fuzzy search)
    - đối với các cấp lớn hơn staff: cần có full CRUD cho các trang quản lý tồn kho, sản phẩm, hóa đơn 
    - đối với trang admin quản lý manager: cần có nút giáng cấp, còn đối với manager: có thể thăng cấp nhân viên (thêm confirmation modal cho từng thao tác quan trọng như thế này)
    -  navigation bar nên được chuyển qua bên phải dưới dạng có thể xổ ra hoặc đóng lại, nếu ở thiết bị nhỏ, thì nên thu nhỏ thành burger menu. 
    - UI chỉ hiển thị những chức năng mà role hiện tại có thể nhìn thấy, ví dụ retailer vốn đã không thấy được trang tạo hóa đơn, thì UI không nên hiển thị trang tạo hóa đơn
    - [x] đối với mối quan hệ giữa retailer và supplier, không ai là superior của ai cả, họ là ngang cấp, vậy nên khi thăng chức và giáng chức, từ staff thì có thể lên supplier hoặc retailer, giáng chức từ supplier/retailer sẽ nhảy thẳng xuống staff. thăng chức từ supplier/staff sẽ nhảy thẳng lên admin. (DB done)
    - [x] mối quan hệ đặc biệt của supplier và retailer trong cùng một miền, nếu chưa có sự điều chỉnh thủ công của admin, thì khi vừa mới tạo retailer, họ sẽ tự động được liên kết với (các) supplier cùng khu vực. hiện tại mối quan hệ giữa supplier và retailer chỉ là 1-1, tuy nhiên ta muốn nó là nhiều-nhiều, cần chỉnh sửa frontend tương ứng. VD: mới tạo retailer miền bắc Manager_MB thì tự động ở trang Supplier/Nhà cung cấp, họ sẽ thấy thông tin của các supplier miền bắc. Đương nhiên, admin có thể cắt thủ công hoặc thêm thủ công mối quan hệ với các supplier cùng/khác miền. Điều tương tự cũng xảy ra với Supplier và Retailer (vice versa). (DB done)
    - [x] trang giáng cấp hiện tại không hoạt động, giáng retailer vẫn không xuống staff. khi giáng và thăng cấp mà có liên quan tới cấp supplier/retailer thì phải có modal xác nhận rằng role nào cần thăng/giáng. cần check admin có thể thăng chức staff, nhưng retailer thì không thể. supplier thì không trực thuộc bất kỳ staff nào. (DB + UI done)
    - [ ] cấp trên có thể sa thải cấp dưới trực tiếp của họ. nhưng cấp dưới nếu muốn deactivate thì cần phải gửi notice tới cấp trên gần nhất ở một sub section trong trang điều phối nhân sự tên là Pending/Yêu cầu từ cấp dưới.
    - dark và light mode hiện tại không hoạt động được do chưa có preset color được định nghĩa sẵn sẵn bên trong index.css/main.css (tùy cách bạn viết css), và kể cả khi đã xử lý được preset color rồi, thì màu sắc hắc ám chỉ được sửa ở phần bên ngoài giao diện, mà giao diện của các component bên trong vẫn chưa được thay đổi. 
    - [x] hiện tại ở danh sách các function có sẵn trong supabase đã có function để thường xuyên tự động tạo smart invoice và phiếu vận chuyển, tuy nhiên function vẫn khong thể thường xuyên chạy (thậm chí vẫn chưa check tính khả dụng của function thông qua script check). cần tạo cron job trên supabase để script chạy thường xuyên, mỗi ngày cần có ít nhất 5 hóa đơn mỗi chi nhánh retailer từ những nhân viên đang active, mỗi info (DB cron done)
    - [x] tất cả các report và CRUD actions đều có lỗi RLS policy. riêng một vấn đề quan sát được ở role admin, trang report, các chức năng đều trả về lỗi ở UI là new row violates RLS security policy for table TON_KHIO, ở network log thì hiển thị message no api found in request, hint: no ai key request header or url param was found, 403 error. (DB RPC/RLS done)
    - [x] đối với provider, chỉ giới hạn quyền hạn xem các report ở tồn kho. đối với chuyển kho, dropdown cho phần người nhận chỉ hiển thị những người nhận họ có linked tới (ở phần dropdown, nên có một text ở phía bên phải chỉ cho user biết người đó ở khu vực nào luôn). ở trang admin phân quyền site, ở phần thêm kho liên kết cho retailer, nên có dropdown option cho tất cả các kho thay vì chỉ là một site.
    - [x] ở chức vụ staff, trang profile phải hiển thị DANH SÁCH của các retailer trong cùng khu vực mà quản lý trực tiếp người dùng đó.
    - [] đối với admin: xem được lịch sử hóa đơn của các khu vực. đối vơi retailer: xem được tất cả các hóa đơn được tạo trong khu vực đó. đối với nhân viên: xem được tất cả hóa đơn mà bản thân họ tạo. thiết kế UI vào một trang mới. tạo report riêng cho chức năng này bên trong report (với các chức năng lọc nâng cao hơn mà bạn có thể nghĩ)