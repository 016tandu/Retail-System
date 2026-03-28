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

## Phase 6: Identity & Management Hierarchy (New)

-   [ ] **Feature: My Profile Management**
    -   **User Perspective:** "I want to view and update my personal information (Full Name, Date of Birth)."
    -   **Developer Perspective:** Create `MyProfilePage.tsx` using `update_my_profile` RPC.
-   [ ] **Feature: Waterfall Management Model**
    -   **Workflow:** 
        - **Admin:** Manages `Provider` and `Retailer`. Cannot directly edit `Staff`.
        - **Retailer:** Manages `Staff` within their own warehouse.
    -   **Developer Perspective:** Implement `manage_employee` RPC with hierarchy checks. Create `EmployeeManagementPage.tsx`.
-   [ ] **Feature: Warehouse Administration (Provider)**
    -   **User Perspective:** "As a Provider, I want to edit warehouse details like names and locations."
    -   **Developer Perspective:** Create `WarehouseSettingsPage.tsx` using `update_warehouse_info` RPC.





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




## UI 

- Password input: nên có nút show/hide (icon con mắc và con mắt bị gạch chéo)
- Navigation bar: 
    - Đối với report có dropdown cho từng loại report, mỗi lần vào report thì chỉ hiển thị loại report đó, hơn nữa: thêm nút export to pdf/xlsl, sử dụng thư viện bên ngoài nếu cần thiết, cần có nút preview và một số config nữa 
    - đối với các cấp lớn hơn staff: cần có full CRUD cho các trang quản lý tồn kho, sản phẩm, hóa đơn 
    - đối với trang admin quản lý manager: cần có nút giáng cấp, còn đối với manager: có thể thăng cấp nhân viên (thêm confirmation modal cho từng thao tác quan trọng như thế này)
    -  navigation bar nên được chuyển qua bên phải dưới dạng có thể xổ ra hoặc đóng lại, nếu ở thiết bị nhỏ, thì nên thu nhỏ thành burger menu. 
    - dark và light mode hiện tại không hoạt động được do chưa có preset color được định nghĩa sẵn sẵn bên trong index.css/main.css (tùy cách bạn viết css)