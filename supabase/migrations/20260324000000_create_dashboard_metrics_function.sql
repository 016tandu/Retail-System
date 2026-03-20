CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS jsonb AS $$
DECLARE
    v_total_sales numeric;
    v_order_count bigint;
    v_total_stock bigint;
    v_top_products jsonb;
    v_pending_transfers bigint;
    v_result jsonb;
BEGIN
    -- Today's Total Sales
    SELECT COALESCE(SUM("TongTien"), 0) INTO v_total_sales
    FROM "public"."HOA_DON"
    WHERE "NgayLap"::date = now()::date;

    -- Number of Orders Today
    SELECT COUNT(*) INTO v_order_count
    FROM "public"."HOA_DON"
    WHERE "NgayLap"::date = now()::date;

    -- Total Stock Items
    SELECT COALESCE(SUM("SoLuongTon"), 0) INTO v_total_stock
    FROM "public"."TON_KHO";

    -- Top 3 Selling Products Today
    SELECT jsonb_agg(t) INTO v_top_products
    FROM (
        SELECT sp."TenSP", SUM(chd."SoLuong") as total_qty
        FROM "public"."CT_HOA_DON" chd
        JOIN "public"."HOA_DON" hd ON chd."MaHD" = hd."MaHD"
        JOIN "public"."SAN_PHAM" sp ON chd."MaSP" = sp."MaSP"
        WHERE hd."NgayLap"::date = now()::date
        GROUP BY sp."TenSP"
        ORDER BY total_qty DESC
        LIMIT 3
    ) t;

    -- Pending Transfers for the current user
    SELECT COUNT(*) INTO v_pending_transfers
    FROM "public"."STOCK_TRANSFER"
    WHERE "status" = 'PENDING' AND ("sender_id" = auth.uid() OR "receiver_id" = auth.uid());

    v_result := jsonb_build_object(
        'total_sales', v_total_sales,
        'order_count', v_order_count,
        'total_stock', v_total_stock,
        'top_products', COALESCE(v_top_products, '[]'::jsonb),
        'pending_transfers', v_pending_transfers
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
