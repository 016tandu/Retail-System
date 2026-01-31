CREATE OR REPLACE FUNCTION doanh_thu_vung(
    start_date date,
    end_date date,
    region_code character varying
)
RETURNS TABLE(khu_vuc character varying, so_don_hang bigint, doanh_thu numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        k."KhuVuc" as khu_vuc,
        COUNT(hd."MaHD") as so_don_hang,
        COALESCE(SUM(hd."TongTien"), 0) as doanh_thu
    FROM
        "public"."HOA_DON" hd
    JOIN
        "public"."KHO" k ON hd."MaKho" = k."MaKho"
    WHERE
        hd."NgayLap" >= start_date AND
        hd."NgayLap" < (end_date + INTERVAL '1 day') AND
        (region_code = 'ALL' OR k."KhuVuc" = region_code)
    GROUP BY
        k."KhuVuc";
END;
$$;
