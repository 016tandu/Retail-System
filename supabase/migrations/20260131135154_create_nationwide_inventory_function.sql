CREATE OR REPLACE FUNCTION ton_kho_toan_quoc(
    p_masp character varying
)
RETURNS TABLE(ma_kho character varying, ten_kho character varying, khu_vuc character varying, so_luong_ton integer)
LANGUAGE plpgsql
AS $$
BEGIN
    -- First, ensure there's a record for the product in every warehouse, defaulting to 0 if it doesn't exist.
    -- This is important for showing a complete picture of inventory.
    INSERT INTO "public"."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
    SELECT
        k."MaKho",
        p_masp,
        0,
        NOW()
    FROM "public"."KHO" k
    WHERE NOT EXISTS (
        SELECT 1
        FROM "public"."TON_KHO" tk
        WHERE tk."MaKho" = k."MaKho" AND tk."MaSP" = p_masp
    );

    -- Return the inventory details
    RETURN QUERY
    SELECT
        tk."MaKho" as ma_kho,
        k."TenKho" as ten_kho,
        k."KhuVuc" as khu_vuc,
        tk."SoLuongTon" as so_luong_ton
    FROM
        "public"."TON_KHO" tk
    JOIN
        "public"."KHO" k ON tk."MaKho" = k."MaKho"
    WHERE
        tk."MaSP" = p_masp;
END;
$$;
