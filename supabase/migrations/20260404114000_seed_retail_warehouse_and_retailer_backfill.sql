-- Seed more products and ensure retail warehouses have complete inventory rows.
-- Also backfill retailer profile fields/warehouse mapping when empty or invalid.

-- ---------------------------------------------------------------------------
-- 1) Extend product catalog
-- ---------------------------------------------------------------------------

INSERT INTO public."SAN_PHAM" ("MaSP", "TenSP", "DonViTinh", "GiaNiemYet")
VALUES
    ('SP007', 'Chuot Logitech MX Master 3S', 'Cai', 2790000),
    ('SP008', 'Ban phim co Keychron K8 Pro', 'Cai', 3190000),
    ('SP009', 'Man hinh LG UltraFine 27 inch', 'Cai', 6990000),
    ('SP010', 'SSD Samsung 990 Pro 1TB', 'Cai', 3290000),
    ('SP011', 'RAM DDR5 Kingston Fury 32GB', 'Cai', 2590000),
    ('SP012', 'Router WiFi 6 TP-Link AX73', 'Cai', 2490000),
    ('SP013', 'Loa Bluetooth JBL Charge 5', 'Cai', 3590000),
    ('SP014', 'Apple Watch Series 9 GPS', 'Cai', 10990000),
    ('SP015', 'May in Brother HL-L2366DW', 'Cai', 4690000),
    ('SP016', 'Webcam Logitech C920 HD Pro', 'Cai', 1790000),
    ('SP017', 'CPU Intel Core i7-14700K', 'Cai', 10990000),
    ('SP018', 'Mainboard ASUS TUF B760M', 'Cai', 4290000),
    ('SP019', 'Nguon Corsair RM750e', 'Cai', 2890000),
    ('SP020', 'PC Gaming RTX 4070 Super', 'Bo', 38990000)
ON CONFLICT ("MaSP") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Ensure every retail warehouse has inventory rows for all products
-- ---------------------------------------------------------------------------

INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
SELECT
    k."MaKho",
    sp."MaSP",
    (mod(abs(hashtext(k."MaKho" || '|' || sp."MaSP"))::bigint, 46) + 15)::integer AS seeded_qty,
    now()
FROM public."KHO" k
CROSS JOIN public."SAN_PHAM" sp
LEFT JOIN public."TON_KHO" tk
    ON tk."MaKho" = k."MaKho"
   AND tk."MaSP" = sp."MaSP"
WHERE k."WarehouseType" = 'retail_warehouse'
  AND tk."MaSP" IS NULL;

-- If a retail warehouse row exists but quantity is null/<=0, normalize to a sane seeded quantity.
UPDATE public."TON_KHO" tk
SET
    "SoLuongTon" = seeded.seeded_qty,
    "LastUpdated" = now()
FROM (
    SELECT
        k."MaKho",
        sp."MaSP",
        (mod(abs(hashtext(k."MaKho" || '|' || sp."MaSP"))::bigint, 46) + 15)::integer AS seeded_qty
    FROM public."KHO" k
    CROSS JOIN public."SAN_PHAM" sp
    WHERE k."WarehouseType" = 'retail_warehouse'
) seeded
JOIN public."KHO" rk
    ON rk."MaKho" = seeded."MaKho"
WHERE tk."MaKho" = seeded."MaKho"
  AND tk."MaSP" = seeded."MaSP"
  AND rk."WarehouseType" = 'retail_warehouse'
  AND COALESCE(tk."SoLuongTon", 0) <= 0;

-- ---------------------------------------------------------------------------
-- 3) Retailer profile/kho backfill
-- ---------------------------------------------------------------------------

-- Backfill missing retailer names.
UPDATE public."NHAN_VIEN"
SET "HoTen" = CONCAT('Retailer ', "MaNV")
WHERE role = 'Retailer'
  AND ("HoTen" IS NULL OR btrim("HoTen") = '');

-- Backfill missing/invalid retailer warehouse from metadata -> fallback first retail warehouse.
WITH missing_or_invalid AS (
    SELECT
        nv."MaNV",
        COALESCE(
            (
                SELECT k_meta."MaKho"
                FROM auth.users au
                JOIN public."KHO" k_meta
                  ON k_meta."MaKho" = au.raw_user_meta_data->>'ma_kho'
                WHERE au.id = nv.user_id
                  AND k_meta."WarehouseType" = 'retail_warehouse'
                LIMIT 1
            ),
            (
                SELECT k_default."MaKho"
                FROM public."KHO" k_default
                WHERE k_default."WarehouseType" = 'retail_warehouse'
                ORDER BY k_default."KhuVuc", k_default."MaKho"
                LIMIT 1
            )
        ) AS target_kho
    FROM public."NHAN_VIEN" nv
    LEFT JOIN public."KHO" k
      ON k."MaKho" = nv."MaKho"
    WHERE nv.role = 'Retailer'
      AND (nv."MaKho" IS NULL OR k."MaKho" IS NULL)
)
UPDATE public."NHAN_VIEN" nv
SET "MaKho" = src.target_kho
FROM missing_or_invalid src
WHERE nv."MaNV" = src."MaNV"
  AND src.target_kho IS NOT NULL
  AND nv."MaKho" IS DISTINCT FROM src.target_kho;

-- If retailer is mapped to stock warehouse, move to retail warehouse in same region.
WITH wrong_type AS (
    SELECT
        nv."MaNV",
        COALESCE(
            (
                SELECT k_retail_same."MaKho"
                FROM public."KHO" k_retail_same
                WHERE k_retail_same."KhuVuc" = k_current."KhuVuc"
                  AND k_retail_same."WarehouseType" = 'retail_warehouse'
                ORDER BY k_retail_same."MaKho"
                LIMIT 1
            ),
            (
                SELECT k_retail_any."MaKho"
                FROM public."KHO" k_retail_any
                WHERE k_retail_any."WarehouseType" = 'retail_warehouse'
                ORDER BY k_retail_any."KhuVuc", k_retail_any."MaKho"
                LIMIT 1
            )
        ) AS target_kho
    FROM public."NHAN_VIEN" nv
    JOIN public."KHO" k_current
      ON k_current."MaKho" = nv."MaKho"
    WHERE nv.role = 'Retailer'
      AND k_current."WarehouseType" <> 'retail_warehouse'
)
UPDATE public."NHAN_VIEN" nv
SET "MaKho" = src.target_kho
FROM wrong_type src
WHERE nv."MaNV" = src."MaNV"
  AND src.target_kho IS NOT NULL
  AND nv."MaKho" IS DISTINCT FROM src.target_kho;

-- Try to backfill missing retailer user_id from auth.users metadata when possible.
WITH candidate_by_name AS (
    SELECT
        nv."MaNV",
        au.id AS user_id,
        row_number() OVER (PARTITION BY nv."MaNV" ORDER BY au.created_at DESC) AS rn
    FROM public."NHAN_VIEN" nv
    JOIN auth.users au
      ON lower(COALESCE(au.raw_user_meta_data->>'full_name', '')) = lower(COALESCE(nv."HoTen", ''))
    LEFT JOIN public."NHAN_VIEN" used
      ON used.user_id = au.id
    WHERE nv.role = 'Retailer'
      AND nv.user_id IS NULL
      AND used.user_id IS NULL
      AND COALESCE(au.raw_user_meta_data->>'role', '') IN ('Retailer', 'Admin')
),
candidate_by_site AS (
    SELECT
        nv."MaNV",
        au.id AS user_id,
        row_number() OVER (PARTITION BY nv."MaNV" ORDER BY au.created_at DESC) AS rn
    FROM public."NHAN_VIEN" nv
    JOIN auth.users au
      ON COALESCE(au.raw_user_meta_data->>'ma_kho', '') = COALESCE(nv."MaKho", '')
    LEFT JOIN public."NHAN_VIEN" used
      ON used.user_id = au.id
    WHERE nv.role = 'Retailer'
      AND nv.user_id IS NULL
      AND used.user_id IS NULL
      AND COALESCE(au.raw_user_meta_data->>'role', '') IN ('Retailer', 'Admin')
),
resolved AS (
    SELECT "MaNV", user_id
    FROM candidate_by_name
    WHERE rn = 1
    UNION
    SELECT c2."MaNV", c2.user_id
    FROM candidate_by_site c2
    WHERE c2.rn = 1
      AND NOT EXISTS (
          SELECT 1
          FROM candidate_by_name c1
          WHERE c1."MaNV" = c2."MaNV"
            AND c1.rn = 1
      )
)
UPDATE public."NHAN_VIEN" nv
SET user_id = resolved.user_id
FROM resolved
WHERE nv."MaNV" = resolved."MaNV"
  AND nv.user_id IS NULL;
