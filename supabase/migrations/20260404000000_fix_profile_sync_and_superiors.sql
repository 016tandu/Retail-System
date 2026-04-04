-- Fix profile consistency between auth.users and public.NHAN_VIEN
-- and fix ambiguous role reference in get_nearest_superiors.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT user_id
            FROM public."NHAN_VIEN"
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            HAVING COUNT(*) > 1
        ) duplicates
    ) THEN
        RAISE EXCEPTION 'Duplicate NHAN_VIEN.user_id detected. Resolve duplicates before this migration.';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "NHAN_VIEN_user_id_key"
ON public."NHAN_VIEN" (user_id);

CREATE OR REPLACE FUNCTION public.generate_unique_manv()
RETURNS character varying
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_ma_nv character varying(10);
BEGIN
    LOOP
        v_ma_nv := 'NV-' || upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
        EXIT WHEN NOT EXISTS (
            SELECT 1
            FROM public."NHAN_VIEN" nv
            WHERE nv."MaNV" = v_ma_nv
        );
    END LOOP;

    RETURN v_ma_nv;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_valid_kho(p_requested_kho character varying)
RETURNS character varying
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_ma_kho character varying(10);
BEGIN
    SELECT k."MaKho"
    INTO v_ma_kho
    FROM public."KHO" k
    WHERE k."MaKho" = p_requested_kho
    LIMIT 1;

    IF v_ma_kho IS NULL THEN
        SELECT k."MaKho"
        INTO v_ma_kho
        FROM public."KHO" k
        WHERE k."MaKho" = 'KHO_HCM'
        LIMIT 1;
    END IF;

    IF v_ma_kho IS NULL THEN
        SELECT k."MaKho"
        INTO v_ma_kho
        FROM public."KHO" k
        ORDER BY k."MaKho"
        LIMIT 1;
    END IF;

    RETURN v_ma_kho;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_ma_nv character varying(10);
    v_ma_kho character varying(10);
BEGIN
    v_ma_kho := public.resolve_valid_kho(new.raw_user_meta_data->>'ma_kho');

    IF v_ma_kho IS NULL THEN
        RAISE EXCEPTION 'Cannot create NHAN_VIEN profile for user %: no warehouse found in public.KHO', new.id;
    END IF;

    v_ma_nv := public.generate_unique_manv();

    INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
    VALUES (
        v_ma_nv,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        new.id,
        COALESCE(new.raw_user_meta_data->>'role', 'Staff'),
        v_ma_kho,
        'Active'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        "HoTen" = EXCLUDED."HoTen",
        "role" = EXCLUDED."role",
        "MaKho" = EXCLUDED."MaKho";

    RETURN new;
END;
$$;

INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho", "TrangThai")
SELECT
    public.generate_unique_manv(),
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'Backfilled User'),
    au.id,
    COALESCE(au.raw_user_meta_data->>'role', 'Staff'),
    COALESCE(
        valid_kho."MaKho",
        public.resolve_valid_kho(NULL)
    ),
    'Active'
FROM auth.users au
LEFT JOIN public."NHAN_VIEN" nv
    ON nv.user_id = au.id
LEFT JOIN public."KHO" valid_kho
    ON valid_kho."MaKho" = (au.raw_user_meta_data->>'ma_kho')
WHERE nv.user_id IS NULL;

CREATE OR REPLACE FUNCTION public.get_nearest_superiors(p_user_id uuid)
RETURNS TABLE (ho_ten text, role character varying)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_my_role character varying;
    v_my_kho character varying;
BEGIN
    SELECT nv."role", nv."MaKho"
    INTO v_my_role, v_my_kho
    FROM public."NHAN_VIEN" nv
    WHERE nv.user_id = p_user_id
    LIMIT 1;

    IF v_my_role = 'Staff' THEN
        RETURN QUERY
        SELECT nv."HoTen"::text, nv."role"
        FROM public."NHAN_VIEN" nv
        WHERE nv."role" = 'Retailer'
          AND nv."MaKho" = v_my_kho
          AND nv."TrangThai" = 'Active';
    ELSIF v_my_role IN ('Retailer', 'Provider') THEN
        RETURN QUERY
        SELECT nv."HoTen"::text, nv."role"
        FROM public."NHAN_VIEN" nv
        WHERE nv."role" = 'Admin'
          AND nv."TrangThai" = 'Active';
    END IF;
END;
$$;
