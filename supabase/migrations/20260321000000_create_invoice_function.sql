CREATE OR REPLACE FUNCTION create_invoice(
    p_ma_nv character varying,
    p_ma_kho character varying,
    p_items jsonb
) RETURNS character varying AS $$
DECLARE
    v_ma_hd character varying;
    v_item jsonb;
    v_tong_tien numeric(15, 2) := 0;
    v_thanh_tien numeric(15, 2);
    v_ma_sp character varying;
    v_so_luong integer;
    v_don_gia numeric(15, 2);
BEGIN
    -- Generate a unique MaHD (e.g., HD-YYYYMMDD-XXXX)
    v_ma_hd := 'HD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    -- Calculate total price and validate stock first
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;
        
        v_thanh_tien := v_so_luong * v_don_gia;
        v_tong_tien := v_tong_tien + v_thanh_tien;

        -- Check stock
        IF NOT EXISTS (
            SELECT 1 FROM "public"."TON_KHO" 
            WHERE "MaKho" = p_ma_kho AND "MaSP" = v_ma_sp AND "SoLuongTon" >= v_so_luong
        ) THEN
            RAISE EXCEPTION 'Sản phẩm % không đủ tồn kho tại kho %', v_ma_sp, p_ma_kho;
        END IF;
    END LOOP;

    -- Insert into HOA_DON
    INSERT INTO "public"."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien")
    VALUES (v_ma_hd, now(), p_ma_nv, p_ma_kho, v_tong_tien);

    -- Insert into CT_HOA_DON and update TON_KHO
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;
        v_thanh_tien := v_so_luong * v_don_gia;

        -- Insert detail
        INSERT INTO "public"."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, v_so_luong, v_don_gia, v_thanh_tien);

        -- Update stock
        UPDATE "public"."TON_KHO"
        SET "SoLuongTon" = "SoLuongTon" - v_so_luong,
            "LastUpdated" = now()
        WHERE "MaKho" = p_ma_kho AND "MaSP" = v_ma_sp;
    END LOOP;

    RETURN v_ma_hd;
END;
$$ LANGUAGE plpgsql;
