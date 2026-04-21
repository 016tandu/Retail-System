# TechStore Project: TODO & Feature Roadmap

This document outlines the roadmap for the TechStore application.

---

## Phase 1: Core Functionality (Completed)
-   [x] Database Setup & Migration
-   [x] Frontend Foundation (React + Tailwind)
-   [x] Product & Supplier Viewing
-   [x] Basic Reporting (RPC based)

---

## Phase 2: User Management & Authentication (Completed)
-   [x] Feature: User Login, Logout, and Roles
-   [x] Implementation: Supabase Auth + RLS Policies

---

## Phase 3: Transactional Operations (Completed)
-   [x] Feature: Create Invoices and Goods Receipts
-   [x] Implementation: `create_invoice` RPC + Dynamic Invoice UI

---

## Phase 4: Advanced Features & QoL (Completed)
-   [x] Feature: Advanced Profitability Report (PDF/Excel Export)
-   [x] Feature: Internationalization (i18n) - VI/EN
-   [x] Feature: Homepage Dashboard (Live Metrics)

---

## Phase 5: RBAC & Advanced Inventory Workflows (Completed)
-   [x] Feature: Multi-Role Authentication UI (Dropdown selection)
-   [x] Feature: Two-Step Inventory Transfer (Initiate -> Confirm/Decline)
-   [x] Feature: Role-Based Access Control (Strict Site-based visibility)

---

## Phase 6: Identity & Management Hierarchy (Completed)
-   [x] Feature: My Profile Management (Update Info + Age 18+ Validation)
-   [x] Feature: Waterfall Management Model (Hierarchy Promotion/Demotion)
-   [x] Feature: Warehouse Administration (Provider settings)

---

## Extra Tasks & UI Enhancements (Completed)
-   [x] **Smart Automation:** Automated business flow via `pg_cron` (Every 20 mins).
-   [x] **Audit Logging:** `GhiChu` column for automated tracking of actors and dates.
-   [x] **High-End UI:** Right-side collapsible sidebar + Mobile burger menu.
-   [x] **Theme Policy:** Light theme is default in deployment; dark-mode toggle is disabled.
-   [x] **Accessibility:** Info Icons (i) for business logic explanation + Password Toggle.
-   [x] **Security:** Robust Auth Triggers with search_path safety.
-   [x] **Identity:** Nearest Superior display in Profile (Staff -> Retailer -> Admin).

---

## Legacy Improvements Cross-check (from HEAD~1)
- [x] Admin can view invoice history by region, Retailer can view all invoices in own region, Staff can view invoices created by self (new page + report mode with advanced filters).
- [x] Superior can fire direct subordinate; subordinates request deactivate via `Pending / Yeu cau tu cap duoi` section for superior review.
