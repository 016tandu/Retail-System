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
    -   **Implementation Details:** Updated `LoginPage.tsx` with Role and Warehouse dropdowns.
-   [x] **Feature: Two-Step Inventory Transfer**
    -   **Implementation Details:** Created `STOCK_TRANSFER` system with `initiate_transfer` and `respond_to_transfer` RPCs. Added `InventoryTransferPage.tsx`.
-   [x] **Feature: Role-Based Access Control (RBAC)**
    -   **Implementation Details:** Implemented navigation visibility and database policies based on `Admin`, `Provider`, and `Retailer` roles.





____

extra task: 


 i just installed database image on docker and now you can run the npx supabase db to check the database itself (list the tables on
   the public schema, then check the empty data, make sure that in the business sense as well as the data constraint sense they all
   line up), then, add the data seeding, if there are any manual check or manual command run, let me know after fnishing the task.
   finally, if everything is properly done (after manual check), write a document for business analyst to understand the role and
   their feature, as well as updating the database/architecture specs files. then, check where we are at @TODO file. make sure to
   follow @Documents/CodingConvention.md and supabasecli common practice as well. so far these tables are still not seeded with actual rows on production: KHO, NHA_CUNG_CAP, NHAN_VIEN, SanPham, SAN_PHAM (not sure why we have 2 san pham tables,  can you check that as well)


finally we want cron jobs on supabase with sql scripts to regularly create random but smart invoices, employee shift (old and new employees, should brainstorm on how one invoice that has actors that used to be on the company but has resigned, decide how they should be handled, maybe show on UI that this is a resigned employee) and reports from different roles.

UI should also have a hoverable rounded text box with opaque background z position at top to explain what the input does (maybe on an (i) info icon with miuted color to hover, or the hover text should show on the role itself to explain the role of the role)
