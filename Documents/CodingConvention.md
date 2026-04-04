# TechStore Project: Conventions and Architecture

This document outlines the development plan, standards, and architecture for the TechStore project, which uses a PostgreSQL database on Supabase.

## 1. Project Goal

The project's goal is to build a full-stack retail management application using a Supabase-hosted PostgreSQL database. The application will be built based on the business requirements detailed in the original project PDF.

## 2. Architecture: Supabase Auto-Generated REST API

We will **not** use a custom backend server (e.g., Node.js/Express). Instead, we will use the powerful **auto-generated REST API provided by Supabase**.

-   **How it works:** Supabase automatically creates a full set of RESTful endpoints for every table in the database. The frontend application will interact directly with this secure and efficient API.
-   **Benefits:** This approach significantly simplifies development, reduces maintenance, and leverages the core strengths of the Supabase platform.

## 3. API Usage Guide

All API requests must be sent to your project's URL and must include your project's `anon` key for authorization.

-   **API URL:** `https://iuxapijvuydijgqvojkg.supabase.co/rest/v1/`
-   **Public Key (`anon` key):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGFwaWp2dXlkaWpncXZvamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDA5ODEsImV4cCI6MjA4NTQxNjk4MX0.KkfBtWcbMPhqUpaVauZW_fKBpYHIsuRDvR79wscGA-k`

You must include the `apikey` in the headers of every request.

### Example `curl` Request

Here is how you can fetch all records from the `SAN_PHAM` table using `curl`.

```bash
curl "https://iuxapijvuydijgqvojkg.supabase.co/rest/v1/SAN_PHAM?select=*" \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGFwaWp2dXlkaWpncXZvamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDA5ODEsImV4cCI6MjA4NTQxNjk4MX0.KkfBtWcbMPhqUpaVauZW_fKBpYHIsuRDvR79wscGA-k" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1eGFwaWp2dXlkaWpncXZvamtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NDA5ODEsImV4cCI6MjA4NTQxNjk4MX0.KkfBtWcbMPhqUpaVauZW_fKBpYHIsuRDvR79wscGA-k"
```

## 4. Database Migrations

All future changes to the database schema (e.g., creating tables, adding columns) **must** be done through Supabase migrations.

-   **Create a new migration:** Use `npx supabase migration new <migration_name>`.
-   **Apply the migration:** After writing your SQL in the migration file, apply it to the database using `npx supabase db push`.

This ensures all schema changes are version-controlled and repeatable.

## 5. Development Workflow

To ensure a structured, high-quality, and clear development process, the following workflow will be followed after each task:

1.  **Task Completion:** Complete the user's requested task (e.g., implementing a feature, fixing a bug).
2.  **Type Check & Build Verification:** Run `npm run build` in the `frontend` directory to ensure that there are no TypeScript errors and the project builds successfully.
3.  **Update Roadmap:** Open `Documents/TODO.md` and mark the just-completed task as done (e.g., change `[ ]` to `[x]`).
4.  **Propose Next Step:** Suggest the next logical feature to implement from the `TODO.md` list.
5.  **Await Approval:** Wait for the user's explicit approval before beginning work on the next task.

## 6. Coding Standards (Frontend)

-   **TypeScript:** Always use TypeScript for frontend components. Avoid `any` type; define proper interfaces for data structures (e.g., `Product`, `Supplier`).
-   **State Management:** Use React Hooks (`useState`, `useEffect`) for local state. Use the Supabase client for data fetching.
-   **Styling:** Use Tailwind CSS for a consistent and modern look. Maintain a clean, professional, and accessible UI.
-   **RBAC (Role-Based Access Control):** 
    - Always check `session.user.user_metadata.role` before rendering sensitive UI elements.
    - Implement a centralized `useRole` hook or context if complex permissions are needed.
-   **Workflows:** Multi-step processes (like Inventory Transfer) must use database triggers or RPCs to ensure atomicity and data integrity.

## 7. Team Sync Workflow (2 Machines + Shared Production DB)

This section is mandatory when 2 users work in parallel on the same codebase and the same production Supabase database.

### 7.1 Golden Rules

1. Do not change production schema directly in Supabase SQL Editor unless it is an emergency fix.
2. Every schema change must exist as a migration file in `supabase/migrations`.
3. For each feature, commit application code and migration files together in the same commit/PR.
4. Do not run `npx supabase db push` at the same time on 2 machines.
5. Before any new work, always pull latest source first.

### 7.2 Pull Flow (Before Starting Any Feature)

```bash
git checkout main
git pull origin main
npx supabase migration list
```

If you use local Supabase for development/testing, also run:

```bash
npx supabase db reset
```

This applies all migrations locally and keeps local schema consistent with repo history.

### 7.3 Push Flow (After Finishing One Feature/Commit)

1. If schema changed, create a migration:

```bash
npx supabase migration new <feature_name>
```

2. Implement SQL in that migration file.
3. Run build verification:

```bash
cd frontend
npm run build
cd ..
```

4. Commit and push source code + migrations together:

```bash
git add .
git commit -m "feat: <short_feature_name>"
git push origin <your_branch_or_main>
```

5. Sync again before pushing DB changes to production:

```bash
git checkout main
git pull origin main
npx supabase db push
```

6. Notify teammate to pull immediately after this step.

### 7.4 Pull Flow (After Teammate Pushed)

```bash
git checkout main
git pull origin main
npx supabase migration list
```

If local Supabase is being used:

```bash
npx supabase db reset
```

### 7.5 Recovery Cases

1. If `npx supabase db push` fails because of migration mismatch:
   - Stop current push.
   - Run `git pull origin main`.
   - Re-run `npx supabase db push`.
2. If production schema was changed manually (outside migrations):
   - Run `npx supabase db pull`.
   - Commit generated migration with message `chore: sync remote schema`.
   - Push so all machines can pull and stay consistent.
