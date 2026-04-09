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
- **Initiation:** A `Provider` selects a product, a source `stock_warehouse` they manage, and a target actor (`Provider` or `Retailer`).
- **Destination Binding:** Destination warehouse is resolved from the selected target actor's managed warehouse.
- **Policy Check:** Transfer is allowed by same-region defaults or admin-configured cross-site links.
- **Notification:** The target actor sees the pending transfer.
- **Action:** The target actor can either **Confirm** (moving stock atomically) or **Decline** (providing a reason).
- **Audit Snapshot:** Each transfer records stock before/after values for source and destination warehouses.

### 3. Employee Resignation
- Employees marked as `Resigned` in the database are visually flagged in the UI and restricted from performing transactional operations (Invoicing, Transfers).


### 

Bạn có thể thêm một **section dành riêng cho coding agents** trong `Architecture.md` để đảm bảo mọi agent (AI hoặc developer automation) đều **xác nhận môi trường trước khi chạy workflow**. Ý tưởng là:

* xác nhận **Docker container Supabase đang chạy**
* xác nhận **Supabase CLI hoạt động**
* xác nhận **Postgres port connect được**
* xác nhận **schema query được**

Tôi đề xuất thêm mục này vào cuối `Architecture.md`.

---

# Markdown Section đề xuất thêm

````markdown
---

## 4. Development Environment Verification (For Coding Agents)

This section defines the required environment checks that any coding agent (AI or automation scripts) must perform before executing database-related tasks.

The goal is to ensure that the Supabase local development environment is fully operational.

### Required CLI Tools

The following tools must be available in the system PATH:

| Tool | Purpose |
|-----|------|
| `docker` | Run Supabase containers |
| `supabase` CLI | Manage migrations and Supabase services |
| `psql` | Direct PostgreSQL query execution |

Verify installation:

```bash
docker --version
supabase --version
psql --version
````

---

## Environment Health Check Script

Agents should run the following script before executing any database operations.

### verify_env.sh

```bash
#!/usr/bin/env bash

set -e

echo "Checking Docker..."

docker info > /dev/null || {
  echo "Docker is not running"
  exit 1
}

echo "Checking Supabase CLI..."

supabase --version > /dev/null || {
  echo "Supabase CLI not installed"
  exit 1
}

echo "Checking Postgres connection..."

psql postgres://postgres:postgres@localhost:54322/postgres -c "SELECT 1;" > /dev/null || {
  echo "Postgres connection failed"
  exit 1
}

echo "Checking Supabase containers..."

docker ps | grep supabase-db > /dev/null || {
  echo "Supabase database container not running"
  exit 1
}

echo "Environment OK"
```

---

## Expected Local Ports

Supabase local development uses the following ports:

| Service     | Port  |
| ----------- | ----- |
| Postgres    | 54322 |
| API Gateway | 54321 |
| Studio      | 54323 |

Agents should assume the PostgreSQL connection string:

```
postgresql://postgres:postgres@localhost:54322/postgres
```

---

## Agent Database Workflow

Coding agents should follow this workflow when modifying the database.

### Schema Changes

Use Supabase migrations.

```
supabase migration new <migration_name>
supabase db push
```

### Query / Debug

Use direct PostgreSQL queries.

```
psql postgres://postgres:postgres@localhost:54322/postgres
```

### Reset Database (Development Only)

```
supabase db reset
```

---

## Agent Safety Rules

Coding agents must follow these rules:

1. Never modify schema directly without a migration file.
2. Always verify the environment before executing queries.
3. Prefer direct Postgres queries (`psql`) for fast iteration.
4. Use `supabase db push` only for schema synchronization.

---

## Quick Environment Check (One-liner)

Agents can run this quick check before starting tasks:

```bash
docker ps | grep supabase-db && \
psql postgres://postgres:postgres@localhost:54322/postgres -c "SELECT 1;"
```

If both commands succeed, the environment is ready.

```

```
Agent
↓
verify_env.sh
↓
supabase migration
↓
psql query
↓
continue coding

```

local engine connection:
admin password: 123
port: 5432
locale: default

