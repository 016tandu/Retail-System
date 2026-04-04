-- Keep auth.users metadata consistent with public.NHAN_VIEN profile changes.

CREATE OR REPLACE FUNCTION public.sync_auth_metadata_from_nhanvien()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    UPDATE auth.users au
    SET raw_user_meta_data =
        COALESCE(au.raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object(
            'full_name', COALESCE(NEW."HoTen", ''),
            'role', COALESCE(NEW.role, 'Staff'),
            'ma_kho', COALESCE(NEW."MaKho", '')
        )
    WHERE au.id = NEW.user_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_metadata_from_nhanvien ON public."NHAN_VIEN";
CREATE TRIGGER trg_sync_auth_metadata_from_nhanvien
AFTER INSERT OR UPDATE OF "HoTen", role, "MaKho"
ON public."NHAN_VIEN"
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_metadata_from_nhanvien();

-- Backfill existing metadata mismatches.
UPDATE auth.users au
SET raw_user_meta_data =
    COALESCE(au.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
        'full_name', COALESCE(nv."HoTen", ''),
        'role', COALESCE(nv.role, 'Staff'),
        'ma_kho', COALESCE(nv."MaKho", '')
    )
FROM public."NHAN_VIEN" nv
WHERE nv.user_id = au.id
  AND (
      COALESCE(au.raw_user_meta_data->>'full_name', '') IS DISTINCT FROM COALESCE(nv."HoTen", '')
      OR COALESCE(au.raw_user_meta_data->>'role', '') IS DISTINCT FROM COALESCE(nv.role, '')
      OR COALESCE(au.raw_user_meta_data->>'ma_kho', '') IS DISTINCT FROM COALESCE(nv."MaKho", '')
  );
