-- Transfer topology upgrade:
-- 1) Explicit region master + warehouse type (stock vs retail).
-- 2) Provider can manage multiple warehouses in a region by default.
-- 3) Transfer flow is actor-aware (Provider -> Provider/Retailer) with strict
--    source/destination validation and inventory snapshot columns.

-- ---------------------------------------------------------------------------
-- 1) Region + warehouse type model
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public."KHU_VUC" (
    "MaKhuVuc" character varying(10) PRIMARY KEY,
    "TenKhuVuc" character varying(100) NOT NULL
);

INSERT INTO public."KHU_VUC" ("MaKhuVuc", "TenKhuVuc")
SELECT DISTINCT
    k."KhuVuc",
    CASE k."KhuVuc"
        WHEN 'MB' THEN 'Mien Bac'
        WHEN 'MN' THEN 'Mien Nam'
        WHEN 'MT' THEN 'Mien Trung'
        ELSE k."KhuVuc"
    END
FROM public."KHO" k
WHERE k."KhuVuc" IS NOT NULL
ON CONFLICT ("MaKhuVuc") DO UPDATE
SET "TenKhuVuc" = EXCLUDED."TenKhuVuc";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'KHO_KhuVuc_fkey'
    ) THEN
        ALTER TABLE public."KHO"
        ADD CONSTRAINT "KHO_KhuVuc_fkey"
        FOREIGN KEY ("KhuVuc") REFERENCES public."KHU_VUC"("MaKhuVuc");
    END IF;
END $$;

DO $$ BEGIN
    CREATE TYPE public.warehouse_type AS ENUM ('stock_warehouse', 'retail_warehouse');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."KHO"
ADD COLUMN IF NOT EXISTS "WarehouseType" public.warehouse_type;

UPDATE public."KHO"
SET "WarehouseType" = CASE
    WHEN COALESCE("TenKho", '') ILIKE '%tong%' THEN 'stock_warehouse'::public.warehouse_type
    ELSE 'retail_warehouse'::public.warehouse_type
END
WHERE "WarehouseType" IS NULL;

ALTER TABLE public."KHO"
ALTER COLUMN "WarehouseType" SET DEFAULT 'retail_warehouse';

UPDATE public."KHO"
SET "WarehouseType" = 'retail_warehouse'::public.warehouse_type
WHERE "WarehouseType" IS NULL;

ALTER TABLE public."KHO"
ALTER COLUMN "WarehouseType" SET NOT NULL;

-- Ensure every region has at least one stock warehouse and one retail warehouse.
INSERT INTO public."KHO" ("MaKho", "TenKho", "KhuVuc", "WarehouseType")
SELECT
    ('ST_' || kv."MaKhuVuc")::character varying(10),
    ('Kho Trung Tam ' || kv."MaKhuVuc")::character varying(100),
    kv."MaKhuVuc",
    'stock_warehouse'::public.warehouse_type
FROM public."KHU_VUC" kv
WHERE NOT EXISTS (
    SELECT 1
    FROM public."KHO" k
    WHERE k."KhuVuc" = kv."MaKhuVuc"
      AND k."WarehouseType" = 'stock_warehouse'
)
ON CONFLICT ("MaKho") DO NOTHING;

INSERT INTO public."KHO" ("MaKho", "TenKho", "KhuVuc", "WarehouseType")
SELECT
    ('RT_' || kv."MaKhuVuc")::character varying(10),
    ('Kho Ban Le ' || kv."MaKhuVuc")::character varying(100),
    kv."MaKhuVuc",
    'retail_warehouse'::public.warehouse_type
FROM public."KHU_VUC" kv
WHERE NOT EXISTS (
    SELECT 1
    FROM public."KHO" k
    WHERE k."KhuVuc" = kv."MaKhuVuc"
      AND k."WarehouseType" = 'retail_warehouse'
)
ON CONFLICT ("MaKho") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Provider multi-warehouse management (default by region)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public."PROVIDER_WAREHOUSE_LINK" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "provider_user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "ma_kho" character varying(10) NOT NULL REFERENCES public."KHO"("MaKho") ON DELETE CASCADE,
    "is_manual" boolean NOT NULL DEFAULT false,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE ("provider_user_id", "ma_kho")
);

ALTER TABLE public."PROVIDER_WAREHOUSE_LINK" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Provider links admin manage" ON public."PROVIDER_WAREHOUSE_LINK";
CREATE POLICY "Provider links admin manage"
ON public."PROVIDER_WAREHOUSE_LINK"
FOR ALL TO authenticated
USING ((SELECT nv.role FROM public."NHAN_VIEN" nv WHERE nv.user_id = auth.uid()) = 'Admin')
WITH CHECK ((SELECT nv.role FROM public."NHAN_VIEN" nv WHERE nv.user_id = auth.uid()) = 'Admin');

DROP POLICY IF EXISTS "Provider links self read" ON public."PROVIDER_WAREHOUSE_LINK";
CREATE POLICY "Provider links self read"
ON public."PROVIDER_WAREHOUSE_LINK"
FOR SELECT TO authenticated
USING (provider_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.sync_provider_warehouse_links_for_provider(p_provider_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_region character varying(10);
BEGIN
    SELECT k."KhuVuc"
    INTO v_region
    FROM public."NHAN_VIEN" nv
    JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
    WHERE nv.user_id = p_provider_user_id
      AND nv.role = 'Provider'
    LIMIT 1;

    IF v_region IS NULL THEN
        DELETE FROM public."PROVIDER_WAREHOUSE_LINK"
        WHERE provider_user_id = p_provider_user_id
          AND is_manual = false;
        RETURN;
    END IF;

    INSERT INTO public."PROVIDER_WAREHOUSE_LINK" ("provider_user_id", "ma_kho", "is_manual")
    SELECT p_provider_user_id, k."MaKho", false
    FROM public."KHO" k
    WHERE k."KhuVuc" = v_region
    ON CONFLICT ("provider_user_id", "ma_kho") DO NOTHING;

    DELETE FROM public."PROVIDER_WAREHOUSE_LINK" l
    USING public."KHO" k
    WHERE l.provider_user_id = p_provider_user_id
      AND l.ma_kho = k."MaKho"
      AND l.is_manual = false
      AND k."KhuVuc" IS DISTINCT FROM v_region;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_sync_provider_links_on_employee_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.role = 'Provider'
       AND NEW.role IS DISTINCT FROM 'Provider' THEN
        DELETE FROM public."PROVIDER_WAREHOUSE_LINK"
        WHERE provider_user_id = NEW.user_id;
        RETURN NEW;
    END IF;

    IF NEW.role = 'Provider' THEN
        PERFORM public.sync_provider_warehouse_links_for_provider(NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_provider_links_on_employee_change ON public."NHAN_VIEN";
CREATE TRIGGER trg_sync_provider_links_on_employee_change
AFTER INSERT OR UPDATE OF role, "MaKho"
ON public."NHAN_VIEN"
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_provider_links_on_employee_change();

CREATE OR REPLACE FUNCTION public.trg_sync_provider_links_on_warehouse_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT nv.user_id
        FROM public."NHAN_VIEN" nv
        JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
        WHERE nv.role = 'Provider'
          AND nv.user_id IS NOT NULL
          AND (
              k."KhuVuc" = NEW."KhuVuc"
              OR (TG_OP = 'UPDATE' AND k."KhuVuc" = OLD."KhuVuc")
          )
    LOOP
        PERFORM public.sync_provider_warehouse_links_for_provider(r.user_id);
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_provider_links_on_warehouse_change ON public."KHO";
CREATE TRIGGER trg_sync_provider_links_on_warehouse_change
AFTER INSERT OR UPDATE OF "KhuVuc", "WarehouseType"
ON public."KHO"
FOR EACH ROW
EXECUTE FUNCTION public.trg_sync_provider_links_on_warehouse_change();

INSERT INTO public."PROVIDER_WAREHOUSE_LINK" ("provider_user_id", "ma_kho", "is_manual")
SELECT nv.user_id, k2."MaKho", false
FROM public."NHAN_VIEN" nv
JOIN public."KHO" k1 ON k1."MaKho" = nv."MaKho"
JOIN public."KHO" k2 ON k2."KhuVuc" = k1."KhuVuc"
WHERE nv.role = 'Provider'
  AND nv.user_id IS NOT NULL
ON CONFLICT ("provider_user_id", "ma_kho") DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Actor-aware transfer flow + inventory snapshots
-- ---------------------------------------------------------------------------

ALTER TABLE public."STOCK_TRANSFER"
ADD COLUMN IF NOT EXISTS "from_qty_before" integer,
ADD COLUMN IF NOT EXISTS "from_qty_after" integer,
ADD COLUMN IF NOT EXISTS "to_qty_before" integer,
ADD COLUMN IF NOT EXISTS "to_qty_after" integer,
ADD COLUMN IF NOT EXISTS "from_region" character varying(10),
ADD COLUMN IF NOT EXISTS "to_region" character varying(10),
ADD COLUMN IF NOT EXISTS "sender_role" character varying(20),
ADD COLUMN IF NOT EXISTS "receiver_role" character varying(20);

UPDATE public."STOCK_TRANSFER" st
SET
    "from_region" = COALESCE(st."from_region", kf."KhuVuc"),
    "to_region" = COALESCE(st."to_region", kt."KhuVuc")
FROM public."KHO" kf, public."KHO" kt
WHERE kf."MaKho" = st."from_kho"
  AND kt."MaKho" = st."to_kho";

UPDATE public."STOCK_TRANSFER" st
SET
    "sender_role" = COALESCE(st."sender_role", snd.role),
    "receiver_role" = COALESCE(st."receiver_role", rcv.role)
FROM public."NHAN_VIEN" snd, public."NHAN_VIEN" rcv
WHERE snd.user_id = st.sender_id
  AND rcv.user_id = st.receiver_id;

CREATE OR REPLACE FUNCTION public.get_my_source_warehouses()
RETURNS TABLE (
    ma_kho character varying,
    ten_kho character varying,
    khu_vuc character varying,
    warehouse_type public.warehouse_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role character varying;
BEGIN
    SELECT nv.role
    INTO v_role
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Caller profile not found.';
    END IF;

    IF v_role = 'Admin' THEN
        RETURN QUERY
        SELECT k."MaKho", k."TenKho", k."KhuVuc", k."WarehouseType"
        FROM public."KHO" k
        WHERE k."WarehouseType" = 'stock_warehouse'
        ORDER BY k."KhuVuc", k."MaKho";
        RETURN;
    END IF;

    IF v_role = 'Provider' THEN
        RETURN QUERY
        SELECT k."MaKho", k."TenKho", k."KhuVuc", k."WarehouseType"
        FROM public."PROVIDER_WAREHOUSE_LINK" l
        JOIN public."KHO" k ON k."MaKho" = l."ma_kho"
        WHERE l.provider_user_id = auth.uid()
          AND k."WarehouseType" = 'stock_warehouse'
        ORDER BY k."KhuVuc", k."MaKho";
        RETURN;
    END IF;

    RAISE EXCEPTION 'Only Provider/Admin can list source warehouses.';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_transfer_target_actors(
    p_from_kho character varying
)
RETURNS TABLE (
    receiver_user_id uuid,
    receiver_name text,
    receiver_role character varying,
    receiver_ma_kho character varying,
    receiver_region character varying,
    receiver_warehouse_type public.warehouse_type
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_role character varying;
    v_source_region character varying;
    v_source_type public.warehouse_type;
BEGIN
    SELECT nv.role
    INTO v_sender_role
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_sender_role NOT IN ('Provider', 'Admin') THEN
        RAISE EXCEPTION 'Only Provider/Admin can fetch transfer targets.';
    END IF;

    SELECT k."KhuVuc", k."WarehouseType"
    INTO v_source_region, v_source_type
    FROM public."KHO" k
    WHERE k."MaKho" = p_from_kho
    LIMIT 1;

    IF v_source_region IS NULL THEN
        RAISE EXCEPTION 'Source warehouse % not found.', p_from_kho;
    END IF;

    IF v_source_type <> 'stock_warehouse' THEN
        RAISE EXCEPTION 'Source warehouse must be stock_warehouse.';
    END IF;

    IF v_sender_role = 'Provider' AND NOT EXISTS (
        SELECT 1
        FROM public."PROVIDER_WAREHOUSE_LINK" l
        WHERE l.provider_user_id = auth.uid()
          AND l."ma_kho" = p_from_kho
    ) THEN
        RAISE EXCEPTION 'You do not manage source warehouse %.', p_from_kho;
    END IF;

    RETURN QUERY
    WITH candidates AS (
        SELECT
            nv.user_id,
            nv."HoTen"::text AS ho_ten,
            nv.role,
            nv."MaKho",
            k."KhuVuc",
            k."WarehouseType",
            CASE
                WHEN v_sender_role = 'Admin' THEN true

                WHEN nv.role = 'Retailer' THEN EXISTS (
                    SELECT 1
                    FROM public."RETAILER_SUPPLIER_LINK" rsl
                    JOIN public."NHA_CUNG_CAP" ncc ON ncc."MaNCC" = rsl.supplier_ma_ncc
                    WHERE rsl.retailer_user_id = nv.user_id
                      AND ncc."KhuVuc" = v_source_region
                )

                WHEN nv.role = 'Provider' THEN (
                    k."KhuVuc" = v_source_region
                    OR EXISTS (
                        SELECT 1
                        FROM public."PROVIDER_WAREHOUSE_LINK" l2
                        JOIN public."KHO" k2 ON k2."MaKho" = l2."ma_kho"
                        WHERE l2.provider_user_id = auth.uid()
                          AND l2.is_manual = true
                          AND k2."KhuVuc" = k."KhuVuc"
                    )
                )

                ELSE false
            END AS is_allowed
        FROM public."NHAN_VIEN" nv
        JOIN public."KHO" k ON k."MaKho" = nv."MaKho"
        WHERE nv.user_id IS NOT NULL
          AND nv."TrangThai" = 'Active'
          AND nv.role IN ('Provider', 'Retailer')
          AND nv.user_id <> auth.uid()
          AND (
            (nv.role = 'Provider' AND k."WarehouseType" = 'stock_warehouse')
            OR
            (nv.role = 'Retailer' AND k."WarehouseType" = 'retail_warehouse')
          )
          AND nv."MaKho" <> p_from_kho
    )
    SELECT
        c.user_id,
        c.ho_ten,
        c.role,
        c."MaKho",
        c."KhuVuc",
        c."WarehouseType"
    FROM candidates c
    WHERE c.is_allowed = true
    ORDER BY c.role, c.ho_ten;
END;
$$;

CREATE OR REPLACE FUNCTION public.initiate_transfer(
    p_ma_sp character varying,
    p_from_kho character varying,
    p_to_kho character varying,
    p_so_luong integer,
    p_receiver_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sender_role character varying;
    v_receiver_role character varying;
    v_receiver_kho character varying;
    v_source_region character varying;
    v_target_region character varying;
    v_source_type public.warehouse_type;
    v_target_type public.warehouse_type;
    v_qty_source integer;
    v_qty_target integer;
    v_transfer_id uuid;
    v_allowed boolean;
BEGIN
    IF p_so_luong IS NULL OR p_so_luong <= 0 THEN
        RAISE EXCEPTION 'Transfer quantity must be > 0.';
    END IF;

    IF p_from_kho = p_to_kho THEN
        RAISE EXCEPTION 'Source and destination warehouse must be different.';
    END IF;

    SELECT nv.role
    INTO v_sender_role
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
      AND nv."TrangThai" = 'Active'
    LIMIT 1;

    IF v_sender_role NOT IN ('Provider', 'Admin') THEN
        RAISE EXCEPTION 'Only Provider/Admin can initiate transfer.';
    END IF;

    SELECT k."KhuVuc", k."WarehouseType"
    INTO v_source_region, v_source_type
    FROM public."KHO" k
    WHERE k."MaKho" = p_from_kho
    LIMIT 1;

    IF v_source_region IS NULL THEN
        RAISE EXCEPTION 'Source warehouse % not found.', p_from_kho;
    END IF;

    IF v_source_type <> 'stock_warehouse' THEN
        RAISE EXCEPTION 'Source warehouse must be stock_warehouse.';
    END IF;

    IF v_sender_role = 'Provider' AND NOT EXISTS (
        SELECT 1
        FROM public."PROVIDER_WAREHOUSE_LINK" l
        WHERE l.provider_user_id = auth.uid()
          AND l."ma_kho" = p_from_kho
    ) THEN
        RAISE EXCEPTION 'You do not manage source warehouse %.', p_from_kho;
    END IF;

    SELECT nv.role, nv."MaKho"
    INTO v_receiver_role, v_receiver_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = p_receiver_id
      AND nv."TrangThai" = 'Active'
    LIMIT 1;

    IF v_receiver_role NOT IN ('Provider', 'Retailer') THEN
        RAISE EXCEPTION 'Receiver must be active Provider/Retailer.';
    END IF;

    IF v_receiver_kho IS DISTINCT FROM p_to_kho THEN
        RAISE EXCEPTION 'Receiver does not manage destination warehouse %.', p_to_kho;
    END IF;

    SELECT k."KhuVuc", k."WarehouseType"
    INTO v_target_region, v_target_type
    FROM public."KHO" k
    WHERE k."MaKho" = p_to_kho
    LIMIT 1;

    IF v_target_region IS NULL THEN
        RAISE EXCEPTION 'Destination warehouse % not found.', p_to_kho;
    END IF;

    IF v_receiver_role = 'Provider' AND v_target_type <> 'stock_warehouse' THEN
        RAISE EXCEPTION 'Provider receiver must use stock_warehouse destination.';
    END IF;

    IF v_receiver_role = 'Retailer' AND v_target_type <> 'retail_warehouse' THEN
        RAISE EXCEPTION 'Retailer receiver must use retail_warehouse destination.';
    END IF;

    IF v_sender_role = 'Admin' THEN
        v_allowed := true;
    ELSIF v_receiver_role = 'Retailer' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public."RETAILER_SUPPLIER_LINK" rsl
            JOIN public."NHA_CUNG_CAP" ncc ON ncc."MaNCC" = rsl.supplier_ma_ncc
            WHERE rsl.retailer_user_id = p_receiver_id
              AND ncc."KhuVuc" = v_source_region
        )
        INTO v_allowed;
    ELSE
        v_allowed := (
            v_source_region = v_target_region
            OR EXISTS (
                SELECT 1
                FROM public."PROVIDER_WAREHOUSE_LINK" l2
                JOIN public."KHO" k2 ON k2."MaKho" = l2."ma_kho"
                WHERE l2.provider_user_id = auth.uid()
                  AND l2.is_manual = true
                  AND k2."KhuVuc" = v_target_region
            )
        );
    END IF;

    IF NOT COALESCE(v_allowed, false) THEN
        RAISE EXCEPTION 'Cross-site transfer is not linked/allowed for this source-destination actor pair.';
    END IF;

    SELECT tk."SoLuongTon"
    INTO v_qty_source
    FROM public."TON_KHO" tk
    WHERE tk."MaKho" = p_from_kho
      AND tk."MaSP" = p_ma_sp
    LIMIT 1;

    IF v_qty_source IS NULL OR v_qty_source < p_so_luong THEN
        RAISE EXCEPTION 'Insufficient stock in source warehouse.';
    END IF;

    SELECT tk."SoLuongTon"
    INTO v_qty_target
    FROM public."TON_KHO" tk
    WHERE tk."MaKho" = p_to_kho
      AND tk."MaSP" = p_ma_sp
    LIMIT 1;

    INSERT INTO public."STOCK_TRANSFER" (
        "ma_sp",
        "from_kho",
        "to_kho",
        "so_luong",
        "sender_id",
        "receiver_id",
        "status",
        "from_qty_before",
        "to_qty_before",
        "from_region",
        "to_region",
        "sender_role",
        "receiver_role"
    )
    VALUES (
        p_ma_sp,
        p_from_kho,
        p_to_kho,
        p_so_luong,
        auth.uid(),
        p_receiver_id,
        'PENDING',
        v_qty_source,
        COALESCE(v_qty_target, 0),
        v_source_region,
        v_target_region,
        v_sender_role,
        v_receiver_role
    )
    RETURNING id INTO v_transfer_id;

    RETURN v_transfer_id;
END;
$$;

-- Backward-compatible wrapper (legacy callers without p_from_kho)
CREATE OR REPLACE FUNCTION public.initiate_transfer(
    p_ma_sp character varying,
    p_to_kho character varying,
    p_so_luong integer,
    p_receiver_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_from_kho character varying;
BEGIN
    SELECT nv."MaKho"
    INTO v_from_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
    LIMIT 1;

    IF v_from_kho IS NULL THEN
        RAISE EXCEPTION 'Caller warehouse not found.';
    END IF;

    RETURN public.initiate_transfer(p_ma_sp, v_from_kho, p_to_kho, p_so_luong, p_receiver_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_transfer(
    p_transfer_id uuid,
    p_action transfer_status,
    p_reason decline_reason DEFAULT NULL,
    p_detail text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer record;
    v_my_role character varying;
    v_my_kho character varying;
    v_from_before integer;
    v_to_before integer;
    v_from_after integer;
    v_to_after integer;
BEGIN
    SELECT nv.role, nv."MaKho"
    INTO v_my_role, v_my_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = auth.uid()
      AND nv."TrangThai" = 'Active'
    LIMIT 1;

    IF v_my_role NOT IN ('Provider', 'Retailer', 'Admin') THEN
        RAISE EXCEPTION 'Only active Provider/Retailer/Admin can respond.';
    END IF;

    SELECT *
    INTO v_transfer
    FROM public."STOCK_TRANSFER"
    WHERE id = p_transfer_id
    FOR UPDATE;

    IF v_transfer.id IS NULL THEN
        RAISE EXCEPTION 'Transfer % not found.', p_transfer_id;
    END IF;

    IF v_transfer.receiver_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized to respond to this transfer.';
    END IF;

    IF v_my_role <> 'Admin' AND v_my_kho IS DISTINCT FROM v_transfer.to_kho THEN
        RAISE EXCEPTION 'Receiver must manage destination warehouse %.', v_transfer.to_kho;
    END IF;

    IF v_transfer.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Transfer is no longer pending.';
    END IF;

    IF p_action = 'CONFIRMED' THEN
        SELECT tk."SoLuongTon"
        INTO v_from_before
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.from_kho
          AND tk."MaSP" = v_transfer.ma_sp
        FOR UPDATE;

        IF v_from_before IS NULL OR v_from_before < v_transfer.so_luong THEN
            RAISE EXCEPTION 'Insufficient stock at source at confirmation time.';
        END IF;

        SELECT tk."SoLuongTon"
        INTO v_to_before
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.to_kho
          AND tk."MaSP" = v_transfer.ma_sp
        FOR UPDATE;

        v_to_before := COALESCE(v_to_before, 0);

        UPDATE public."TON_KHO"
        SET "SoLuongTon" = "SoLuongTon" - v_transfer.so_luong,
            "LastUpdated" = now()
        WHERE "MaKho" = v_transfer.from_kho
          AND "MaSP" = v_transfer.ma_sp;

        INSERT INTO public."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
        VALUES (v_transfer.to_kho, v_transfer.ma_sp, v_transfer.so_luong, now())
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE
        SET "SoLuongTon" = public."TON_KHO"."SoLuongTon" + EXCLUDED."SoLuongTon",
            "LastUpdated" = now();

        SELECT tk."SoLuongTon"
        INTO v_from_after
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.from_kho
          AND tk."MaSP" = v_transfer.ma_sp
        LIMIT 1;

        SELECT tk."SoLuongTon"
        INTO v_to_after
        FROM public."TON_KHO" tk
        WHERE tk."MaKho" = v_transfer.to_kho
          AND tk."MaSP" = v_transfer.ma_sp
        LIMIT 1;

        UPDATE public."STOCK_TRANSFER"
        SET
            "status" = 'CONFIRMED',
            "updated_at" = now(),
            "from_qty_before" = COALESCE("from_qty_before", v_from_before),
            "to_qty_before" = COALESCE("to_qty_before", v_to_before),
            "from_qty_after" = v_from_after,
            "to_qty_after" = v_to_after,
            "reason" = NULL,
            "reason_detail" = NULL
        WHERE id = p_transfer_id;

        RETURN;
    END IF;

    IF p_action = 'DECLINED' THEN
        UPDATE public."STOCK_TRANSFER"
        SET
            "status" = 'DECLINED',
            "reason" = p_reason,
            "reason_detail" = p_detail,
            "updated_at" = now()
        WHERE id = p_transfer_id;
        RETURN;
    END IF;

    RAISE EXCEPTION 'Unsupported action: %', p_action;
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_source_warehouses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_transfer_target_actors(character varying) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.initiate_transfer(character varying, character varying, character varying, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.initiate_transfer(character varying, character varying, integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_transfer(uuid, transfer_status, decline_reason, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_source_warehouses() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_transfer_target_actors(character varying) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.initiate_transfer(character varying, character varying, character varying, integer, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.initiate_transfer(character varying, character varying, integer, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_transfer(uuid, transfer_status, decline_reason, text) TO authenticated, service_role;
