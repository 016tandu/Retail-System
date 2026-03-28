-- 1. Cập nhật hàm tạo hóa đơn để kiểm tra trạng thái nhân viên
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
    v_trang_thai character varying;
BEGIN
    -- Kiểm tra xem nhân viên có còn làm việc không
    SELECT "TrangThai" INTO v_trang_thai FROM "public"."NHAN_VIEN" WHERE "MaNV" = p_ma_nv;
    IF v_trang_thai = 'Resigned' THEN
        RAISE EXCEPTION 'Nhân viên % đã nghỉ việc, không thể tạo hóa đơn.', p_ma_nv;
    END IF;

    -- (Phần còn lại của logic tạo hóa đơn giữ nguyên như trước)
    v_ma_hd := 'HD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(md5(random()::text) from 1 for 4));

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;
        v_thanh_tien := v_so_luong * v_don_gia;
        v_tong_tien := v_tong_tien + v_thanh_tien;

        IF NOT EXISTS (
            SELECT 1 FROM "public"."TON_KHO" 
            WHERE "MaKho" = p_ma_kho AND "MaSP" = v_ma_sp AND "SoLuongTon" >= v_so_luong
        ) THEN
            RAISE EXCEPTION 'Sản phẩm % không đủ tồn kho tại kho %', v_ma_sp, p_ma_kho;
        END IF;
    END LOOP;

    INSERT INTO "public"."HOA_DON" ("MaHD", "NgayLap", "MaNV", "MaKho", "TongTien")
    VALUES (v_ma_hd, now(), p_ma_nv, p_ma_kho, v_tong_tien);

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_ma_sp := v_item->>'MaSP';
        v_so_luong := (v_item->>'SoLuong')::integer;
        v_don_gia := (v_item->>'DonGia')::numeric;
        v_thanh_tien := v_so_luong * v_don_gia;

        INSERT INTO "public"."CT_HOA_DON" ("MaHD", "MaSP", "SoLuong", "DonGia", "ThanhTien")
        VALUES (v_ma_hd, v_ma_sp, v_so_luong, v_don_gia, v_thanh_tien);

        UPDATE "public"."TON_KHO"
        SET "SoLuongTon" = "SoLuongTon" - v_so_luong, "LastUpdated" = now()
        WHERE "MaKho" = p_ma_kho AND "MaSP" = v_ma_sp;
    END LOOP;

    RETURN v_ma_hd;
END;
$$ LANGUAGE plpgsql;

-- 2. Hàm sinh dữ liệu hóa đơn ngẫu nhiên (Smart Random Invoices)
CREATE OR REPLACE FUNCTION generate_random_invoice()
RETURNS void AS $$
DECLARE
    v_ma_nv character varying;
    v_ma_kho character varying;
    v_ma_sp character varying;
    v_gia_niemyet numeric;
    v_items jsonb;
BEGIN
    -- Chọn ngẫu nhiên 1 nhân viên đang làm việc
    SELECT "MaNV", "MaKho" INTO v_ma_nv, v_ma_kho 
    FROM "public"."NHAN_VIEN" 
    WHERE "TrangThai" = 'Active' 
    ORDER BY random() LIMIT 1;

    -- Chọn ngẫu nhiên 1 sản phẩm còn tồn kho tại kho đó
    SELECT tk."MaSP", sp."GiaNiemYet" INTO v_ma_sp, v_gia_niemyet
    FROM "public"."TON_KHO" tk
    JOIN "public"."SAN_PHAM" sp ON tk."MaSP" = sp."MaSP"
    WHERE tk."MaKho" = v_ma_kho AND tk."SoLuongTon" > 0
    ORDER BY random() LIMIT 1;

    IF v_ma_sp IS NOT NULL THEN
        -- Tạo JSONB items (mua 1 sản phẩm)
        v_items := jsonb_build_array(
            jsonb_build_object('MaSP', v_ma_sp, 'SoLuong', 1, 'DonGia', v_gia_niemyet)
        );
        -- Gọi hàm tạo hóa đơn
        PERFORM create_invoice(v_ma_nv, v_ma_kho, v_items);
    END IF;
END;
$$ LANGUAGE plpgsql;
