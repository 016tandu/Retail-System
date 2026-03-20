CREATE OR REPLACE FUNCTION calculate_profitability(
    p_start_date timestamp with time zone,
    p_end_date timestamp with time zone
) RETURNS TABLE (
    ma_sp character varying,
    ten_sp character varying,
    so_luong_ban bigint,
    doanh_thu numeric,
    gia_von numeric,
    loi_nhuan numeric,
    ty_suat_loi_nhuan numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH product_costs AS (
        -- Calculate average purchase price for each product
        SELECT 
            cpn."MaSP", 
            AVG(cpn."DonGiaNhap") as avg_cost
        FROM "public"."CT_PHIEU_NHAP" cpn
        GROUP BY cpn."MaSP"
    ),
    sales_data AS (
        -- Aggregate sales within the date range
        SELECT 
            chd."MaSP",
            sp."TenSP",
            SUM(chd."SoLuong") as total_qty,
            SUM(chd."ThanhTien") as total_revenue
        FROM "public"."CT_HOA_DON" chd
        JOIN "public"."HOA_DON" hd ON chd."MaHD" = hd."MaHD"
        JOIN "public"."SAN_PHAM" sp ON chd."MaSP" = sp."MaSP"
        WHERE hd."NgayLap" >= p_start_date AND hd."NgayLap" <= p_end_date
        GROUP BY chd."MaSP", sp."TenSP"
    )
    SELECT 
        sd."MaSP",
        sd."TenSP",
        sd.total_qty,
        sd.total_revenue,
        (sd.total_qty * COALESCE(pc.avg_cost, 0))::numeric as total_cost,
        (sd.total_revenue - (sd.total_qty * COALESCE(pc.avg_cost, 0)))::numeric as profit,
        CASE 
            WHEN sd.total_revenue > 0 
            THEN ((sd.total_revenue - (sd.total_qty * COALESCE(pc.avg_cost, 0))) / sd.total_revenue * 100)::numeric
            ELSE 0 
        END as margin_percent
    FROM sales_data sd
    LEFT JOIN product_costs pc ON sd."MaSP" = pc."MaSP"
    ORDER BY profit DESC;
END;
$$ LANGUAGE plpgsql;
