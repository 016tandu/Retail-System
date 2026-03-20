-- Create ENUMs for Transfer Workflow
DO $$ BEGIN
    CREATE TYPE transfer_status AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE decline_reason AS ENUM ('DAMAGED', 'INCORRECT_QUANTITY', 'WRONG_PRODUCT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create STOCK_TRANSFER table
CREATE TABLE IF NOT EXISTS "public"."STOCK_TRANSFER" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "ma_sp" character varying(10) REFERENCES "public"."SAN_PHAM"("MaSP"),
    "from_kho" character varying(10) REFERENCES "public"."KHO"("MaKho"),
    "to_kho" character varying(10) REFERENCES "public"."KHO"("MaKho"),
    "so_luong" integer NOT NULL,
    "sender_id" uuid REFERENCES auth.users(id),
    "receiver_id" uuid REFERENCES auth.users(id),
    "status" transfer_status DEFAULT 'PENDING',
    "reason" decline_reason,
    "reason_detail" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."STOCK_TRANSFER" ENABLE ROW LEVEL SECURITY;

-- Policies for STOCK_TRANSFER
CREATE POLICY "Users can view transfers they are involved in" ON "public"."STOCK_TRANSFER"
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR (SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) = 'Admin');

CREATE POLICY "Providers can initiate transfers" ON "public"."STOCK_TRANSFER"
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT role FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid()) IN ('Provider', 'Admin'));

-- RPC to initiate transfer (Provider)
CREATE OR REPLACE FUNCTION initiate_transfer(
    p_ma_sp character varying,
    p_to_kho character varying,
    p_so_luong integer,
    p_receiver_id uuid
) RETURNS uuid AS $$
DECLARE
    v_from_kho character varying;
    v_transfer_id uuid;
BEGIN
    -- Get sender's warehouse
    SELECT "MaKho" INTO v_from_kho FROM "public"."NHAN_VIEN" WHERE user_id = auth.uid();
    
    -- Check stock at source
    IF NOT EXISTS (
        SELECT 1 FROM "public"."TON_KHO" 
        WHERE "MaKho" = v_from_kho AND "MaSP" = p_ma_sp AND "SoLuongTon" >= p_so_luong
    ) THEN
        RAISE EXCEPTION 'Insufficient stock in source warehouse.';
    END IF;

    -- Create transfer record
    INSERT INTO "public"."STOCK_TRANSFER" ("ma_sp", "from_kho", "to_kho", "so_luong", "sender_id", "receiver_id")
    VALUES (p_ma_sp, v_from_kho, p_to_kho, p_so_luong, auth.uid(), p_receiver_id)
    RETURNING id INTO v_transfer_id;

    RETURN v_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC to respond to transfer (Retailer)
CREATE OR REPLACE FUNCTION respond_to_transfer(
    p_transfer_id uuid,
    p_action transfer_status,
    p_reason decline_reason DEFAULT NULL,
    p_detail text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_transfer record;
BEGIN
    SELECT * INTO v_transfer FROM "public"."STOCK_TRANSFER" WHERE id = p_transfer_id;
    
    IF v_transfer.receiver_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized to respond to this transfer.';
    END IF;

    IF v_transfer.status != 'PENDING' THEN
        RAISE EXCEPTION 'Transfer is no longer pending.';
    END IF;

    IF p_action = 'CONFIRMED' THEN
        -- Atomically move stock
        -- Decrement from source
        UPDATE "public"."TON_KHO" 
        SET "SoLuongTon" = "SoLuongTon" - v_transfer.so_luong, "LastUpdated" = now()
        WHERE "MaKho" = v_transfer.from_kho AND "MaSP" = v_transfer.ma_sp;

        -- Increment at destination (Insert if not exists)
        INSERT INTO "public"."TON_KHO" ("MaKho", "MaSP", "SoLuongTon", "LastUpdated")
        VALUES (v_transfer.to_kho, v_transfer.ma_sp, v_transfer.so_luong, now())
        ON CONFLICT ("MaKho", "MaSP") DO UPDATE 
        SET "SoLuongTon" = "public"."TON_KHO"."SoLuongTon" + v_transfer.so_luong, "LastUpdated" = now();

        UPDATE "public"."STOCK_TRANSFER" SET "status" = 'CONFIRMED', "updated_at" = now() WHERE id = p_transfer_id;
    
    ELSIF p_action = 'DECLINED' THEN
        UPDATE "public"."STOCK_TRANSFER" 
        SET "status" = 'DECLINED', "reason" = p_reason, "reason_detail" = p_detail, "updated_at" = now() 
        WHERE id = p_transfer_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auto-handle-new-user function to respect metadata role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho")
  VALUES (
    'NV-' || upper(substring(md5(new.id::text) from 1 for 6)),
    coalesce(new.raw_user_meta_data->>'full_name', 'Chưa đặt tên'),
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'Staff'),
    coalesce(new.raw_user_meta_data->>'ma_kho', 'K01')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
