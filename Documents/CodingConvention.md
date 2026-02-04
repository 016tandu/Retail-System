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

To ensure a structured and clear development process, the following workflow will be followed after each task:

1.  **Task Completion:** Complete the user's requested task (e.g., implementing a feature, fixing a bug).
2.  **Update Roadmap:** Open `Documents/TODO.md` and mark the just-completed task as done (e.g., change `[ ]` to `[x]`).
3.  **Propose Next Step:** Suggest the next logical feature to implement from the `TODO.md` list.
4.  **Await Approval:** Wait for the user's explicit approval before beginning work on the next task.
