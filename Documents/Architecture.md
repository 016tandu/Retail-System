# TechStore: C4 System Context Diagram

This document contains a C4 System Context diagram that describes the high-level architecture of the TechStore application as it currently exists.

## MermaidJS Diagram

```mermaid
C4Context
  title System Context Diagram for TechStore Application

  Person(admin, "System Administrator", "A warehouse manager, salesperson, or other internal user responsible for managing inventory and sales.")

  System_Boundary(b1, "TechStore Web App") {
    System(WebApp, "SPA Frontend", "The React single-page application that runs in the user's web browser. Provides all user-facing functionality.")
  }

  Enterprise_Boundary(b2, "Supabase Platform") {
    System(PostgREST, "Auto-Generated REST API", "Exposes database tables (Products, Suppliers, etc.) as a standard RESTful API.")
    SystemDb(PostgreSQL, "PostgreSQL Database", "Stores all business data. Handles complex workflows (Stock Transfer) via RPC and Triggers.")
    System(Auth, "Supabase Auth", "Manages user registration, login, and Role-Based Access Control (RBAC) via JWT metadata.")

    Rel(PostgREST, PostgreSQL, "Reads from/Writes to", "SQL")
    Rel(WebApp, Auth, "Authenticates with", "HTTPS/JSON")
  }

  Rel(admin, WebApp, "Uses (Admin/Provider/Retailer roles)", "HTTPS")
  Rel(WebApp, PostgREST, "Makes API calls to", "HTTPS/JSON")
  Rel(WebApp, PostgreSQL, "Makes RPC calls (Create Invoice, Transfer)", "HTTPS/JSON")

  UpdateElementStyle(admin, $bgColor="grey", $fontColor="white")
  UpdateLayoutConfig($c4ShapeInRow="2")

```

## Key Workflows

### 1. Multi-Role Authentication
- **Registration:** Users select their role (Admin, Provider, Retailer) and Warehouse.
- **Auto-Profile:** A database trigger (`handle_new_user`) automatically creates a record in `NHAN_VIEN` linking the Auth UID to the business profile.

### 2. Two-Step Inventory Transfer
- **Initiation:** A `Provider` selects products and a target warehouse to send stock.
- **Notification:** The `Retailer` manager of the target warehouse sees the pending transfer.
- **Action:** The `Retailer` can either **Confirm** (moving stock atomically) or **Decline** (providing a reason).

### 3. Employee Resignation
- Employees marked as `Resigned` in the database are visually flagged in the UI and restricted from performing transactional operations (Invoicing, Transfers).
