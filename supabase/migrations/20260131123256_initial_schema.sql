-- Create SAN_PHAM table
CREATE TABLE IF NOT EXISTS "public"."SAN_PHAM" (
    "MaSP" character varying(10) NOT NULL,
    "TenSP" character varying(100),
    "DonViTinh" character varying(20),
    "GiaNiemYet" numeric(15, 2),
    CONSTRAINT "SAN_PHAM_pkey" PRIMARY KEY ("MaSP")
);

-- Create NHA_CUNG_CAP table
CREATE TABLE IF NOT EXISTS "public"."NHA_CUNG_CAP" (
    "MaNCC" character varying(10) NOT NULL,
    "TenNCC" character varying(100) NOT NULL,
    "DiaChi" character varying(255),
    "SDT" character varying(15),
    CONSTRAINT "NHA_CUNG_CAP_pkey" PRIMARY KEY ("MaNCC")
);

-- Create KHO table
CREATE TABLE IF NOT EXISTS "public"."KHO" (
    "MaKho" character varying(10) NOT NULL,
    "TenKho" character varying(100),
    "KhuVuc" character varying(20),
    CONSTRAINT "KHO_pkey" PRIMARY KEY ("MaKho")
);

-- Create NHAN_VIEN table
CREATE TABLE IF NOT EXISTS "public"."NHAN_VIEN" (
    "MaNV" character varying(10) NOT NULL,
    "HoTen" character varying(100),
    "NgaySinh" date,
    "MaKho" character varying(10),
    CONSTRAINT "NHAN_VIEN_pkey" PRIMARY KEY ("MaNV"),
    CONSTRAINT "NHAN_VIEN_MaKho_fkey" FOREIGN KEY ("MaKho") REFERENCES "public"."KHO" ("MaKho")
);

-- Create HOA_DON table
CREATE TABLE IF NOT EXISTS "public"."HOA_DON" (
    "MaHD" character varying(20) NOT NULL,
    "NgayLap" timestamp with time zone,
    "MaNV" character varying(10),
    "MaKho" character varying(10),
    "TongTien" numeric(15, 2),
    CONSTRAINT "HOA_DON_pkey" PRIMARY KEY ("MaHD"),
    CONSTRAINT "HOA_DON_MaNV_fkey" FOREIGN KEY ("MaNV") REFERENCES "public"."NHAN_VIEN" ("MaNV"),
    CONSTRAINT "HOA_DON_MaKho_fkey" FOREIGN KEY ("MaKho") REFERENCES "public"."KHO" ("MaKho")
);

-- Create CT_HOA_DON table
CREATE TABLE IF NOT EXISTS "public"."CT_HOA_DON" (
    "MaHD" character varying(20) NOT NULL,
    "MaSP" character varying(10) NOT NULL,
    "SoLuong" integer,
    "DonGia" numeric(15, 2),
    "ThanhTien" numeric(15, 2),
    CONSTRAINT "CT_HOA_DON_pkey" PRIMARY KEY ("MaHD", "MaSP"),
    CONSTRAINT "CT_HOA_DON_MaHD_fkey" FOREIGN KEY ("MaHD") REFERENCES "public"."HOA_DON" ("MaHD"),
    CONSTRAINT "CT_HOA_DON_MaSP_fkey" FOREIGN KEY ("MaSP") REFERENCES "public"."SAN_PHAM" ("MaSP")
);

-- Create PHIEU_NHAP table
CREATE TABLE IF NOT EXISTS "public"."PHIEU_NHAP" (
    "MaPN" character varying(20) NOT NULL,
    "NgayNhap" timestamp with time zone,
    "MaNCC" character varying(10) NOT NULL,
    "MaKho" character varying(10) NOT NULL,
    "TongTienNhap" numeric(15, 2),
    CONSTRAINT "PHIEU_NHAP_pkey" PRIMARY KEY ("MaPN"),
    CONSTRAINT "PHIEU_NHAP_MaNCC_fkey" FOREIGN KEY ("MaNCC") REFERENCES "public"."NHA_CUNG_CAP" ("MaNCC"),
    CONSTRAINT "PHIEU_NHAP_MaKho_fkey" FOREIGN KEY ("MaKho") REFERENCES "public"."KHO" ("MaKho")
);

-- Create CT_PHIEU_NHAP table
CREATE TABLE IF NOT EXISTS "public"."CT_PHIEU_NHAP" (
    "MaPN" character varying(20) NOT NULL,
    "MaSP" character varying(10) NOT NULL,
    "SoLuong" integer NOT NULL,
    "DonGiaNhap" numeric(15, 2) NOT NULL,
    "ThanhTien" numeric(15, 2),
    CONSTRAINT "CT_PHIEU_NHAP_pkey" PRIMARY KEY ("MaPN", "MaSP"),
    CONSTRAINT "CT_PHIEU_NHAP_MaPN_fkey" FOREIGN KEY ("MaPN") REFERENCES "public"."PHIEU_NHAP" ("MaPN"),
    CONSTRAINT "CT_PHIEU_NHAP_MaSP_fkey" FOREIGN KEY ("MaSP") REFERENCES "public"."SAN_PHAM" ("MaSP")
);

-- Create TON_KHO table
CREATE TABLE IF NOT EXISTS "public"."TON_KHO" (
    "MaKho" character varying(10) NOT NULL,
    "MaSP" character varying(10) NOT NULL,
    "SoLuongTon" integer,
    "LastUpdated" timestamp with time zone,
    CONSTRAINT "TON_KHO_pkey" PRIMARY KEY ("MaKho", "MaSP"),
    CONSTRAINT "TON_KHO_MaKho_fkey" FOREIGN KEY ("MaKho") REFERENCES "public"."KHO" ("MaKho"),
    CONSTRAINT "TON_KHO_MaSP_fkey" FOREIGN KEY ("MaSP") REFERENCES "public"."SAN_PHAM" ("MaSP")
);
