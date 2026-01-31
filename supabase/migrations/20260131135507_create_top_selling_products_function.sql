CREATE OR REPLACE FUNCTION top_selling_products(
    p_limit integer
)
RETURNS TABLE(
    masp character varying,
    tensp character varying,
    total_sold bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct."MaSP" as masp,
        sp."TenSP" as tensp,
        SUM(ct."SoLuong") as total_sold
    FROM
        "public"."CT_HOA_DON" ct
    JOIN
        "public"."SAN_PHAM" sp ON ct."MaSP" = sp."MaSP"
    GROUP BY
        ct."MaSP", sp."TenSP"
    ORDER BY
        total_sold DESC
    LIMIT
        p_limit;
END;
$$;
