-- Clean up any potential legacy 'SanPham' table if it exists.
-- This ensures we only use 'SAN_PHAM' as per conventions.

DROP TABLE IF EXISTS "public"."SanPham";
