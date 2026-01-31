# TechStore Project: Coding Conventions and Plan

This document outlines the development plan, coding standards, and architectural decisions for rebuilding the TechStore project on a modern stack using PostgreSQL, Supabase, Node.js, and React.

## 1. Project Goal

The primary goal is to migrate the existing distributed MySQL-based system to a new, centralized architecture using a PostgreSQL database hosted on Supabase. This involves creating a full-stack application from the ground up, including a backend API and a frontend user interface, based on the business requirements detailed in the `DDB-CuoiKy (1).pdf` document.

## 2. Architectural Decisions

-   **Database:** We will use a single, centralized PostgreSQL database provided by Supabase. The original project's distributed "sites" (HCMC, Hanoi, Da Nang) will be consolidated. The `KhuVuc` (Region) field in the `KHO` (Warehouse) table will be used to logically partition data where necessary.
-   **Backend:** A RESTful API will be built using Node.js and the Express.js framework. This backend will handle all business logic, database interactions, and report generation. It will be designed to be stateless and scalable.
-   **Frontend:** A modern, single-page application (SPA) will be developed using React and styled with Tailwind CSS. The frontend will interact with the backend via the REST API.
-   **Database Management:** All database schema changes will be managed through Supabase's migration tooling. We will use `npx supabase migration new` to create new migration files and `npx supabase db push` to apply them to the production database.

## 3. Development Plan

The project will be developed in the following phases:

1.  **Phase 1: Database Migration (In Progress)**
    -   Analyze the MySQL schema from the project PDF.
    -   Translate the schema to PostgreSQL-compatible DDL.
    -   Create a new Supabase migration file with the complete schema.
    -   Apply the migration to the remote Supabase database.

2.  **Phase 2: Backend Development**
    -   Set up a Node.js project with Express.js.
    -   Establish a connection to the Supabase PostgreSQL database.
    -   Implement REST API endpoints for all CRUD operations (e.g., `/san-pham`, `/nha-cung-cap`, `/hoa-don`).
    -   Re-implement business logic for generating reports (e.g., revenue by region, top-selling products).

3.  **Phase 3: Frontend Development**
    -   Set up a React project (using Vite) with Tailwind CSS.
    -   Build reusable UI components for displaying data (tables, forms, etc.).
    -   Implement views for each major feature (Products, Invoices, Inventory, etc.).
    -   Connect the UI to the backend API to provide a fully interactive experience.

## 4. Coding & Project Conventions

-   **Version Control:** All changes will be committed to Git. Commit messages should be clear and descriptive, following a conventional format (e.g., `feat(backend): add user authentication`). Major milestones will be marked by commits.
-   **File Naming:** File names should be in `kebab-case.js` or `PascalCase.jsx` for React components.
-   **Database Schema:** Table and column names will follow the existing project's convention (`Pascal_Case_With_Underscores`) to maintain consistency with the business domain language (e.g., `SAN_PHAM`, `MaSP`, `NhaCungCap`).
-   **API Endpoints:** API routes will be RESTful and use `kebab-case` (e.g., `/api/san-pham/:maSP`).
-   **Environment:** Development will be done in a Windows PowerShell environment. All `supabase` commands will be run directly against the linked production project.
-   **Documentation:** All significant code, database changes, and business logic will be documented in the appropriate subdirectory within the `/Documents` folder.
