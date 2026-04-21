# TechStore - Business Analyst Guide

Tài liệu này mô tả nghiệp vụ đang chạy trên live deployment, đối chiếu trực tiếp với source code frontend + migration SQL hiện có.

## 1) Vai trò và phạm vi truy cập (RBAC)

| Vai trò | Quyền chính | Giới hạn chính |
|---|---|---|
| Admin | Toàn quyền cấu hình, phân quyền site, điều phối nhân sự, xem báo cáo/toàn hệ thống | Không giới hạn phạm vi dữ liệu |
| Provider (Supplier user) | Điều phối chuyển kho từ kho nguồn (stock warehouse), nhận/chấp nhận chuyển kho theo quyền link | Không tạo hóa đơn bán lẻ |
| Retailer | Vận hành kho bán lẻ, tạo hóa đơn, nhận hàng từ luồng chuyển kho | Không điều phối kho nguồn ngoài rule link |
| Staff | Tác nghiệp bán hàng trong phạm vi được cấp, xem dữ liệu theo RLS | Không điều phối nhân sự, không điều phối kho cấp cao |

Ghi chú:
- `NHA_CUNG_CAP` là supplier master (danh mục đối tác).
- `Provider` là user role vận hành trong `NHAN_VIEN` (không đồng nhất với record master trong `NHA_CUNG_CAP`).

## 2) Mô hình dữ liệu nghiệp vụ cốt lõi

### 2.1 Identity và hồ sơ người dùng
- `auth.users` là nguồn identity đăng nhập.
- `public.NHAN_VIEN` là profile nghiệp vụ (mã nhân sự, role, kho, trạng thái).
- Trigger/profile-sync tạo hoặc đồng bộ profile từ metadata đăng ký.

### 2.2 Khu vực và kho
- Hiện tại **không có bảng `KHU_VUC` riêng**; khu vực được thể hiện qua `KHO.KhuVuc` (ví dụ: `MB`, `MT`, `MN`).
- `KHO.WarehouseType` có 2 loại:
  - `stock_warehouse`: kho nguồn/trung tâm điều phối.
  - `retail_warehouse`: kho bán lẻ/điểm nhận hàng của retailer.
- Một khu vực có thể có nhiều kho; mỗi kho thuộc đúng 1 khu vực.

### 2.3 Bảng link nghiệp vụ
- `RETAILER_SUPPLIER_LINK`: liên kết retailer <-> supplier master (mặc định cùng khu vực, có thể mở rộng cross-site).
- `PROVIDER_WAREHOUSE_LINK`: kho mà provider được phép quản lý/chuyển đi (auto-sync theo khu vực, có thể thêm manual link).

## 3) Quy trình chuyển kho (2-phase, actor-aware)

### 3.1 Tạo yêu cầu (Initiate)
- Người gửi: `Provider` (hoặc `Admin` trong một số luồng quản trị).
- Chọn:
  1. Sản phẩm.
  2. Kho nguồn (`stock_warehouse`) mà provider có quyền quản lý.
  3. Actor nhận (`Provider` hoặc `Retailer`).
- Hệ thống tự xác định kho đích theo actor nhận và validate:
  - Kho nguồn khác kho đích.
  - Actor nhận hợp lệ với loại kho đích.
  - Cùng khu vực hoặc có link cross-site hợp lệ.
- Tạo record `STOCK_TRANSFER` trạng thái `PENDING`.

### 3.2 Xử lý yêu cầu (Accept/Decline)
- Actor nhận vào màn hình pending để `CONFIRMED` hoặc `DECLINED`.
- Nếu `CONFIRMED`:
  - Trừ tồn kho nguồn, cộng tồn kho đích trong cùng transaction.
  - Lưu snapshot tồn kho: `from_qty_before`, `to_qty_before`, `from_qty_after`, `to_qty_after`.
- Nếu `DECLINED`:
  - Ghi reason/reason_detail.
  - Không đổi tồn kho.

## 4) Quy trình hóa đơn

### 4.1 Hóa đơn thủ công
- Dùng RPC `create_invoice`.
- Có kiểm tra role/trạng thái nhân sự và quyền theo RLS.
- Ghi dữ liệu vào `HOA_DON` + `CT_HOA_DON`, đồng thời trừ tồn kho.

### 4.2 Hóa đơn tự động (pg_cron)
- Job chính: `techstore-main-flow` (chu kỳ `*/20 * * * *`).
- Function: `public.run_automated_business_flow()`.
- Logic hiện tại:
  - Chọn ngẫu nhiên khu vực có actor active.
  - Sinh transfer attempts cân bằng với tỉ lệ confirm/decline mô phỏng 80/20.
  - Xử lý pending transfer.
  - Tạo 1 hóa đơn auto mỗi lượt chạy.
- Format note hóa đơn auto chuẩn mới:
  - `Hóa đơn [DD/MM HH24:MI] bởi <HoTen> (<MaNV>)`
  - Ví dụ: `Hóa đơn [21/04 02:00] bởi CuocDoi TrongGai (NV-B00307)`.

## 5) Báo cáo và lịch sử hóa đơn

### 5.1 Report module
- Reports chuẩn: doanh thu, tồn kho, top bán chạy, lợi nhuận.
- Có export PDF/Excel.
- Provider bị giới hạn chỉ xem report tồn kho.

### 5.2 Invoice History Workspace (trang riêng + report mode)
- Vai trò truy cập: `Admin`, `Retailer`, `Staff`.
- Rule dữ liệu:
  - Admin: xem toàn hệ thống.
  - Retailer: xem tất cả hóa đơn trong khu vực của retailer.
  - Staff: chỉ xem hóa đơn do chính staff tạo.
- Bộ lọc nâng cao: ngày, khu vực, kho, người tạo, keyword, min/max tổng tiền, sort, chỉ hóa đơn auto, export CSV.

## 6) Điều phối nhân sự

### 6.1 Quản lý cấp dưới trực tiếp
- Admin: quản lý Provider/Retailer/Staff theo phân cấp.
- Retailer: quản lý Staff cùng kho.
- Chức năng chính:
  - Promote/Demote (qua `hierarchy_control`).
  - Sa thải/Kích hoạt lại cấp dưới trực tiếp (qua `manage_employee`).

### 6.2 Deactivate theo cơ chế notice
- Nhân sự cấp dưới không tự nghỉ việc ngay.
- Họ gửi notice bằng trạng thái `PendingResign`.
- Cấp trên xử lý ở section `Pending / Yêu cầu từ cấp dưới`:
  - Duyệt -> `Resigned`.
  - Từ chối -> trả về `Active`.

## 7) Cross-check TODO (mục Improvements)

Đối chiếu với code/migration hiện tại:
- Smart automation (`pg_cron`) đã triển khai.
- Audit note cho hóa đơn/chuyển kho đã triển khai; note auto invoice đã chuẩn hóa format business-friendly.
- Invoice history theo vai trò + report mode nâng cao đã triển khai.
- Luồng cấp trên sa thải cấp dưới trực tiếp + cấp dưới gửi notice deactivate đã triển khai.
- Mô hình kho `stock_warehouse`/`retail_warehouse` + link cùng khu vực/cross-site đã triển khai.
- Theme: hệ thống đang chạy mặc định light, nút dark mode đã tắt theo quyết định vận hành.

## 8) Mức độ đủ cho agent dựng diagram

Tài liệu này (kèm migration trong `supabase/migrations`) đã đủ để agent khác dựng:
- Use-case diagram (RBAC theo vai trò).
- Sequence diagram cho 4 luồng chính: tạo hóa đơn, chuyển kho 2-phase, duyệt pending chuyển kho, quy trình notice nghỉ việc.
- ERD logic (identity-profile, warehouse topology, transfer/invoice flows, permission links).

Khuyến nghị cho diagram chi tiết kỹ thuật:
- Dùng thêm function signatures trong migration để thể hiện rõ pre-condition/validation ở mức SQL.
