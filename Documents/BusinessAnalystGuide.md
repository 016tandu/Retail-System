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

## 2. Mô hình Quản lý Thác nước (Waterfall Management)

Để đảm bảo tính kỷ luật và phân cấp, hệ thống áp dụng mô hình quản lý gián tiếp:
- **Cấp Admin:** Chỉ quản lý và điều chỉnh chức vụ cho các vai trò trung cấp (`Provider`, `Retailer`). Admin thiết lập cấu hình hệ thống nhưng không can thiệp vào công việc chi tiết của nhân viên cấp thấp nhất.
- **Cấp Chi Nhánh (Retailer):** Trực tiếp quản lý và chịu trách nhiệm về đội ngũ nhân viên (`Staff`) tại kho của mình. Retailer có quyền thay đổi trạng thái hoạt động (cho nghỉ việc) của nhân viên cấp dưới.
- **Tính năng Tự phục vụ:** Mọi nhân viên đều có quyền tự cập nhật thông tin cá nhân (Họ tên, Ngày sinh) trong trang Hồ sơ cá nhân.

## 3. Quy trình Chuyển kho (Inventory Transfer)

Đây là quy trình 2 bước để đảm bảo tính chính xác và trách nhiệm:
1.  **Giai đoạn Gửi (Initiate):** Người dùng `Provider` hoặc `Admin` tạo yêu cầu chuyển sản phẩm X từ kho A sang kho B. Số lượng tồn kho lúc này chưa thay đổi.
2.  **Giai đoạn Nhận (Confirm/Decline):** Quản lý chi nhánh (`Retailer`) tại kho B sẽ thấy yêu cầu. 
    - Nếu **Confirm**: Tồn kho tại kho A giảm, tồn kho tại kho B tăng (tự động xử lý trong 1 transaction).
    - Nếu **Decline**: Yêu cầu bị đóng lại với lý do cụ thể (Hư hỏng, Sai số lượng, v.v.), tồn kho không đổi.

## 4. Quản lý Nhân sự & Trạng thái Nghỉ việc

- **Liên kết tài khoản:** Khi người dùng đăng ký trên UI, hệ thống tự động tạo một profile tương ứng trong bảng `NHAN_VIEN` thông qua Database Trigger.
- **Nhân viên nghỉ việc (Resigned):** 
    - Khi một nhân viên được đánh dấu là `Resigned` trong DB, họ vẫn có thể đăng nhập để xem lịch sử nhưng **bị chặn** thực hiện mọi hành động tạo dữ liệu mới (Hóa đơn, Chuyển kho).
    - UI sẽ hiển thị nhãn đỏ để thông báo trạng thái này.

## 5. Báo cáo & Dashboard

- **Dashboard:** Cung cấp số liệu thời gian thực về Doanh thu ngày, Đơn hàng mới, Tổng tồn kho toàn hệ thống và Top 3 sản phẩm bán chạy.
- **Profitability Report:** Báo cáo thông minh tính toán lợi nhuận bằng cách đối soát giá bán trên Hóa đơn với giá nhập trung bình từ các Phiếu nhập hàng.
