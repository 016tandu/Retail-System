-- Enable RLS on all tables
ALTER TABLE "public"."SAN_PHAM" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NHA_CUNG_CAP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."KHO" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."NHAN_VIEN" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."HOA_DON" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CT_HOA_DON" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PHIEU_NHAP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CT_PHIEU_NHAP" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TON_KHO" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to READ all data
CREATE POLICY "Allow authenticated users to read SAN_PHAM" ON "public"."SAN_PHAM" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read NHA_CUNG_CAP" ON "public"."NHA_CUNG_CAP" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read KHO" ON "public"."KHO" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read NHAN_VIEN" ON "public"."NHAN_VIEN" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read HOA_DON" ON "public"."HOA_DON" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read CT_HOA_DON" ON "public"."CT_HOA_DON" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read PHIEU_NHAP" ON "public"."PHIEU_NHAP" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read CT_PHIEU_NHAP" ON "public"."CT_PHIEU_NHAP" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read TON_KHO" ON "public"."TON_KHO" FOR SELECT TO authenticated USING (true);

-- Add user_id column to NHAN_VIEN to link with Supabase Auth
ALTER TABLE "public"."NHAN_VIEN" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES auth.users(id);

-- Add Role column to NHAN_VIEN
ALTER TABLE "public"."NHAN_VIEN" ADD COLUMN IF NOT EXISTS "role" character varying(20) DEFAULT 'Staff';

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."NHAN_VIEN" ("MaNV", "HoTen", "user_id", "role", "MaKho")
  VALUES (
    'NV-' || upper(substring(md5(new.id::text) from 1 for 6)), -- Auto-generate a MaNV
    coalesce(new.raw_user_meta_data->>'full_name', 'Chưa đặt tên'),
    new.id,
    'Staff',
    'K01' -- Default warehouse, adjust as needed
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
