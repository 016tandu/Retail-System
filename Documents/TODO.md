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

## Phase 3: Transactional Operations

-   [ ] **Feature: Create Invoices and Goods Receipts**
    -   **User Perspective:** "As a salesperson, I need a form to create a new sales invoice (`HOA_DON`). I want to be able to add multiple products (`CT_HOA_DON`) to the invoice and have the total calculated automatically."
    -   **Business Analyst Perspective:** "We need to streamline the data entry process for sales and purchasing to reduce errors and improve efficiency. This feature is critical for accurate financial and inventory tracking."
    -   **Developer Perspective:** "Build new pages/components in React for creating/editing invoices and receipts. Since this involves writing to multiple tables (`HOA_DON` and `CT_HOA_DON`) simultaneously, create a PostgreSQL function (RPC) to handle the entire transaction atomically, ensuring data consistency."
-   [x] **Implementation Details:**
    -   Created `create_invoice(p_ma_nv, p_ma_kho, p_items)` RPC in migration `20260321000000_create_invoice_function.sql`.

---

## Phase 4: Advanced Features & QoL

-   [ ] **Feature: Advanced Profitability Report**
    -   **User Perspective:** "I want a report that shows me the profit margin for each product sold within a specific date range."
    -   **Business Analyst Perspective:** "We need deeper insights into our sales performance beyond just revenue. This report will help us identify our most and least profitable products, allowing for better strategic decisions."
    -   **Developer Perspective:** "Create a new RPC function that joins `CT_HOA_DON` and `CT_PHIEU_NHAP` to calculate the profit for each item. Update the Reports page with a new UI to call this function and display the results."

-   [ ] **Feature: Inventory Transfer**
    -   **User Perspective:** "As a warehouse manager, I need a simple way to record the transfer of stock from one warehouse to another."
    -   **Business Analyst Perspective:** "To maintain accurate inventory counts across all locations, we need a formal process for tracking inter-warehouse stock movements."
    -   **Developer Perspective:** "Create a new RPC function, `transfer_stock(product_id, from_kho_id, to_kho_id, quantity)`, that handles the transfer atomically (decrementing stock from one warehouse and incrementing it in another). Build a simple UI on a new 'Inventory Management' page to call this function."

-   [ ] **Feature: Homepage Dashboard**
    -   **User Perspective:** "When I first open the app, I want to see a dashboard with a quick overview of today's key metrics, like total sales, number of orders, and top-selling items."
    -   **Business Analyst Perspective:** "A high-level dashboard provides an at-a-glance view of the business's daily performance, enabling quick reactions and informed decisions."
    -   **Developer Perspective:** "Create several new, highly-optimized RPC functions to calculate the dashboard metrics. Create a new `Dashboard.tsx` page, set it as the default home route, and have it call these RPCs to display the data in summary cards."
