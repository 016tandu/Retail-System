# TechStore: Hướng dẫn dành cho Business Analyst (BA)

Tài liệu này giải thích các vai trò, quy trình nghiệp vụ và các thực thể dữ liệu trong hệ thống Quản lý Kho TechStore.

## 1. Vai trò và Quyền hạn (RBAC)

Hệ thống được thiết kế với 4 vai trò chính, mỗi vai trò có phạm vi truy cập dữ liệu và chức năng khác nhau:

| Vai trò | Chức năng chính | Hạn chế |
| :--- | :--- | :--- |
| **Admin** | Toàn quyền quản trị hệ thống, cấu hình kho và nhân viên. | Không có. |
| **Provider** | Nhập hàng từ NCC ngoại tỉnh, điều phối chuyển kho cho chi nhánh. | Không được phép tạo hóa đơn bán lẻ trực tiếp. |
| **Retailer** | Quản lý chi nhánh, tạo hóa đơn bán lẻ, nhận hàng từ kho tổng. | Không được phép nhập hàng trực tiếp từ NCC bên ngoài. |
| **Staff** | Xem danh mục sản phẩm, báo cáo cơ bản và tồn kho. | Không có quyền thực hiện các giao dịch làm thay đổi số lượng kho. |

## 1.1 Phân biệt thực thể nghiệp vụ

- **Khu vực (`KHU_VUC`)**: Miền logic (ví dụ `MB`, `MN`, `MT`). Mỗi khu vực có thể có **nhiều kho**.
- **Kho (`KHO`)**: Điểm chứa/luân chuyển hàng vật lý và tồn kho.
- **Loại kho (`WarehouseType`)**:
  - `stock_warehouse`: Kho chứa/trung tâm điều phối.
  - `retail_warehouse`: Kho bán lẻ/chi nhánh.
- **Supplier master (`NHA_CUNG_CAP`)**: Danh mục đối tác NCC theo khu vực, dùng cho chính sách link và nhập hàng.
- **Supplier user (`NHAN_VIEN.role = Provider`)**: Người dùng nội bộ vận hành kho nguồn.
- **Retailer user (`NHAN_VIEN.role = Retailer`)**: Người dùng nội bộ vận hành kho bán lẻ.

## 2. Mô hình Quản lý Thác nước (Waterfall Management)

Để đảm bảo tính kỷ luật và phân cấp, hệ thống áp dụng mô hình quản lý gián tiếp:
- **Cấp Admin:** Chỉ quản lý và điều chỉnh chức vụ cho các vai trò trung cấp (`Provider`, `Retailer`). Admin thiết lập cấu hình hệ thống nhưng không can thiệp vào công việc chi tiết của nhân viên cấp thấp nhất.
- **Cấp Chi Nhánh (Retailer):** Trực tiếp quản lý và chịu trách nhiệm về đội ngũ nhân viên (`Staff`) tại kho của mình. Retailer có quyền thay đổi trạng thái hoạt động (cho nghỉ việc) của nhân viên cấp dưới.
- **Tính năng Tự phục vụ:** Mọi nhân viên đều có quyền tự cập nhật thông tin cá nhân (Họ tên, Ngày sinh) trong trang Hồ sơ cá nhân.

## 3. Quy trình Chuyển kho (Inventory Transfer)

Đây là quy trình 2 bước, actor-aware:
1. **Giai đoạn Gửi (Initiate):**
   - `Provider` (hoặc `Admin`) chọn:
     - Sản phẩm.
     - **Kho nguồn** mà supplier đang quản lý (bắt buộc là `stock_warehouse`).
     - **Actor nhận** (`Provider` hoặc `Retailer`).
   - **Kho đích** tự động lấy theo kho mà actor nhận đang quản lý.
   - Hệ thống tự kiểm tra:
     - Kho nguồn khác kho đích.
     - Actor nhận có đúng vai trò và đúng kho đích.
     - Rule cùng khu vực hoặc cross-site được link bởi admin.
   - Tồn kho chưa thay đổi ở trạng thái `PENDING`.
2. **Giai đoạn Nhận (Accept/Decline):**
   - Actor nhận (có thể là `Provider` hoặc `Retailer`) xử lý pending.
   - Nếu **Accept**:
     - Tồn kho nguồn giảm, tồn kho đích tăng trong cùng transaction.
     - Lưu snapshot lịch sử: tồn trước, số lượng chuyển, tồn sau.
   - Nếu **Decline**:
     - Yêu cầu đóng với lý do từ chối.
     - Tồn kho không đổi.

### 3.1 Quy tắc link theo khu vực và cross-site

- Mặc định, link `Retailer-Supplier` được thiết lập trong cùng khu vực.
- `Admin` có thể mở rộng link cross-site cho nhu cầu liên vùng.
- `Provider` mặc định quản lý các kho trong khu vực của mình; có thể mở rộng thủ công (manual link) để phục vụ liên vùng.

## 4. Quản lý Nhân sự & Trạng thái Nghỉ việc

- **Liên kết tài khoản:** Khi người dùng đăng ký trên UI, hệ thống tự động tạo một profile tương ứng trong bảng `NHAN_VIEN` thông qua Database Trigger.
- **Nhân viên nghỉ việc (Resigned):** 
    - Khi một nhân viên được đánh dấu là `Resigned` trong DB, họ vẫn có thể đăng nhập để xem lịch sử nhưng **bị chặn** thực hiện mọi hành động tạo dữ liệu mới (Hóa đơn, Chuyển kho).
    - UI sẽ hiển thị nhãn đỏ để thông báo trạng thái này.

## 5. Báo cáo & Dashboard

- **Dashboard:** Cung cấp số liệu thời gian thực về Doanh thu ngày, Đơn hàng mới, Tổng tồn kho toàn hệ thống và Top 3 sản phẩm bán chạy.
- **Profitability Report:** Báo cáo thông minh tính toán lợi nhuận bằng cách đối soát giá bán trên Hóa đơn với giá nhập trung bình từ các Phiếu nhập hàng.
