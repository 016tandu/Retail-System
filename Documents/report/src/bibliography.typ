#let bib = (
  netlify_docs: (
    title: [Netlify Documentation],
    url: "https://docs.netlify.com/",
    note: [Truy cập ngày 26/04/2026],
  ),
  netlify_deploy: (
    title: [Netlify Docs - Create Deploys],
    url: "https://docs.netlify.com/site-deploys/create-deploys/",
    note: [Truy cập ngày 26/04/2026],
  ),
  netlify_build: (
    title: [Netlify Docs - Build Configuration],
    url: "https://docs.netlify.com/configure-builds/get-started/",
    note: [Truy cập ngày 26/04/2026],
  ),
  supabase_docs: (
    title: [Supabase Documentation],
    url: "https://supabase.com/docs/",
    note: [Truy cập ngày 26/04/2026],
  ),
  supabase_migrations: (
    title: [Supabase Docs - Database Migrations],
    url: "https://supabase.com/docs/guides/deployment/database-migrations",
    note: [Truy cập ngày 26/04/2026],
  ),
  typescript_docs: (
    title: [TypeScript Documentation],
    url: "https://www.typescriptlang.org/docs/",
    note: [Truy cập ngày 26/04/2026],
  ),
  postgresql_docs: (
    title: [PostgreSQL Documentation],
    url: "https://www.postgresql.org/docs/",
    note: [Truy cập ngày 26/04/2026],
  ),
  odoo_inventory: (
    title: [Odoo Documentation - Inventory],
    url: "https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory.html",
    note: [Truy cập ngày 26/04/2026],
  ),
  odoo_inventory_management: (
    title: [Odoo Documentation - Inventory Management],
    url: "https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/inventory_management.html",
    note: [Truy cập ngày 26/04/2026],
  ),
  kiotviet_main: (
    title: [KiotViet - Trang chủ],
    url: "https://www.kiotviet.net/",
    note: [Truy cập ngày 26/04/2026],
  ),
  kiotviet_inventory_guide: (
    title: [KiotViet - Hướng dẫn quản lý hàng hóa trong kho hàng],
    url: "https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/fnb-hang-hoa/quan-ly-hang-hoa-trong-kho-hang/",
    note: [Truy cập ngày 26/04/2026],
  ),
)

#let reference-list() = [
  1. #link(bib.netlify_docs.url)[#bib.netlify_docs.title]. #linebreak() #bib.netlify_docs.url. #linebreak() #bib.netlify_docs.note
  2. #link(bib.netlify_deploy.url)[#bib.netlify_deploy.title]. #linebreak() #bib.netlify_deploy.url. #linebreak() #bib.netlify_deploy.note
  3. #link(bib.netlify_build.url)[#bib.netlify_build.title]. #linebreak() #bib.netlify_build.url. #linebreak() #bib.netlify_build.note
  4. #link(bib.supabase_docs.url)[#bib.supabase_docs.title]. #linebreak() #bib.supabase_docs.url. #linebreak() #bib.supabase_docs.note
  5. #link(bib.supabase_migrations.url)[#bib.supabase_migrations.title]. #linebreak() #bib.supabase_migrations.url. #linebreak() #bib.supabase_migrations.note
  6. #link(bib.typescript_docs.url)[#bib.typescript_docs.title]. #linebreak() #bib.typescript_docs.url. #linebreak() #bib.typescript_docs.note
  7. #link(bib.postgresql_docs.url)[#bib.postgresql_docs.title]. #linebreak() #bib.postgresql_docs.url. #linebreak() #bib.postgresql_docs.note
  8. #link(bib.odoo_inventory.url)[#bib.odoo_inventory.title]. #linebreak() #bib.odoo_inventory.url. #linebreak() #bib.odoo_inventory.note
  9. #link(bib.odoo_inventory_management.url)[#bib.odoo_inventory_management.title]. #linebreak() #bib.odoo_inventory_management.url. #linebreak() #bib.odoo_inventory_management.note
  10. #link(bib.kiotviet_main.url)[#bib.kiotviet_main.title]. #linebreak() #bib.kiotviet_main.url. #linebreak() #bib.kiotviet_main.note
  11. #link(bib.kiotviet_inventory_guide.url)[#bib.kiotviet_inventory_guide.title]. #linebreak() #bib.kiotviet_inventory_guide.url. #linebreak() #bib.kiotviet_inventory_guide.note
  12. Repository dự án Retail-System. #linebreak() C:\\Users\\Admin\\Documents\\GitHub\\Retail-System
]
