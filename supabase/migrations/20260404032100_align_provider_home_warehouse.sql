-- Align Provider home warehouse to stock_warehouse in the same region.
-- This makes Provider actor flows (receive/approve pending) consistent with
-- transfer rules that require Provider-managed destination to be stock_warehouse.

WITH provider_candidates AS (
    SELECT
        nv.user_id,
        nv."MaKho" AS current_kho,
        k_current."KhuVuc" AS current_region,
        (
            SELECT k_stock."MaKho"
            FROM public."KHO" k_stock
            WHERE k_stock."KhuVuc" = k_current."KhuVuc"
              AND k_stock."WarehouseType" = 'stock_warehouse'
            ORDER BY
                CASE WHEN k_stock."MaKho" LIKE 'KHO_%' THEN 0 ELSE 1 END,
                k_stock."MaKho"
            LIMIT 1
        ) AS target_stock_kho
    FROM public."NHAN_VIEN" nv
    JOIN public."KHO" k_current ON k_current."MaKho" = nv."MaKho"
    WHERE nv.role = 'Provider'
      AND nv.user_id IS NOT NULL
)
UPDATE public."NHAN_VIEN" nv
SET "MaKho" = pc.target_stock_kho
FROM provider_candidates pc
WHERE nv.user_id = pc.user_id
  AND pc.target_stock_kho IS NOT NULL
  AND nv."MaKho" IS DISTINCT FROM pc.target_stock_kho;

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT nv.user_id
        FROM public."NHAN_VIEN" nv
        WHERE nv.role = 'Provider'
          AND nv.user_id IS NOT NULL
    LOOP
        PERFORM public.sync_provider_warehouse_links_for_provider(r.user_id);
    END LOOP;
END $$;
