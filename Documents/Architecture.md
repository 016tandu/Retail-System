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
    SystemDb(PostgreSQL, "PostgreSQL Database", "Stores all business data. Exposes complex query functions (e.g., reports) via RPC.")

    Rel(PostgREST, PostgreSQL, "Reads from/Writes to", "SQL")
  }

  Rel(admin, WebApp, "Uses", "HTTPS")
  Rel(WebApp, PostgREST, "Makes API calls to", "HTTPS/JSON")
  Rel(WebApp, PostgreSQL, "Makes RPC calls to", "HTTPS/JSON")

  UpdateElementStyle(admin, $bgColor="grey", $fontColor="white")
  UpdateLayoutConfig($c4ShapeInRow="2")

```
