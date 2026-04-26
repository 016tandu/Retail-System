#import "bibliography.typ": bib

#let chapter-2() = [
= CHƯƠNG 2: CÔNG NGHỆ, KHÁI NIỆM VÀ KIẾN TRÚC TRIỂN KHAI

== 2.1. Công nghệ sử dụng trong đồ án
#table(
  columns: (1.4fr, 1.7fr, 2.9fr),
  inset: 4pt,
  stroke: 0.5pt + luma(180),
  [#strong[Thành phần]], [#strong[Công nghệ]], [#strong[Vai trò trong hệ thống]],
  [Frontend], [React + TypeScript + Vite], [Cung cấp giao diện vận hành và tương tác API theo thời gian thực cho nghiệp vụ bán hàng và tồn kho.],
  [Nền tảng Backend], [Supabase PostgREST + RPC], [Đóng gói truy vấn dữ liệu và hàm nghiệp vụ để đảm bảo tính toàn vẹn giao dịch.],
  [Cơ sở dữ liệu], [PostgreSQL], [Lưu trữ dữ liệu nghiệp vụ, thực thi constraint, function, trigger và policy phân quyền.],
  [Xác thực], [Supabase Auth], [Quản lý định danh tài khoản, phiên đăng nhập và metadata vai trò nghiệp vụ.],
  [Tự động hóa], [pg_cron], [Thực thi tác vụ định kỳ cho luồng tạo dữ liệu vận hành tự động.],
  [Triển khai], [Netlify], [Build, deploy và phân phối frontend ở môi trường production.],
)

== 2.2. Kiến trúc tổng thể
Hệ thống được triển khai theo mô hình frontend SPA kết nối trực tiếp tới Supabase qua giao thức HTTPS. Các thao tác truy vấn thông thường thực hiện bằng API bảng, trong khi những nghiệp vụ cần kiểm tra điều kiện nhiều bước và cập nhật nhiều bảng trong một transaction được triển khai bằng RPC phía PostgreSQL. Cách tổ chức này giúp frontend giữ được tốc độ phát triển nhanh, đồng thời vẫn bảo toàn tính nhất quán của dữ liệu ở lớp database.

Mô hình phân lớp vận hành bao gồm lớp giao diện, lớp nghiệp vụ và lớp dữ liệu. Lớp giao diện quản lý điều hướng và phân quyền hiển thị theo vai trò. Lớp nghiệp vụ nằm ở các hàm SQL có kiểm soát role và trạng thái người dùng. Lớp dữ liệu tổ chức theo schema `auth` và `public`, trong đó `auth` quản lý định danh còn `public` quản lý dữ liệu nghiệp vụ bán hàng, tồn kho, nhân sự và điều phối kho.

== 2.3. Các khái niệm nền tảng của đề án

=== 2.3.1. Netlify trong vai trò deploy frontend
Netlify là nền tảng triển khai frontend theo quy trình CI/CD, hỗ trợ tự động build từ repository và publish artifact sau mỗi lần push mã nguồn. Trong đồ án, frontend React được build từ thư mục `frontend` và publish thư mục `frontend/dist`. Việc chuẩn hóa build command và publish directory trên Netlify giúp nhóm đồng bộ cách triển khai giữa các thành viên, đồng thời rút ngắn vòng phản hồi khi kiểm thử tính năng trên môi trường live. Tài liệu chính thức Netlify mô tả đầy đủ cơ chế deploy từ Git và quản lý build settings tại #link(bib.netlify_docs.url)[Netlify Documentation] và #link(bib.netlify_build.url)[Build Configuration].

=== 2.3.2. Supabase trong vai trò backend platform
Supabase cung cấp nền tảng PostgreSQL tích hợp Auth, API và công cụ migration. Đề án sử dụng Supabase để lưu trữ dữ liệu nghiệp vụ, quản lý phiên đăng nhập và thực thi policy truy cập theo role. Các function nghiệp vụ như `create_invoice`, `initiate_transfer`, `respond_to_transfer` được gọi từ frontend qua RPC. Cách tiếp cận này bảo đảm nghiệp vụ nhạy cảm như cập nhật tồn kho, xác nhận chuyển kho và kiểm tra phân quyền luôn được xử lý tập trung tại database thay vì phân tán ở client. Các hướng dẫn nền tảng được tham chiếu tại #link(bib.supabase_docs.url)[Supabase Documentation] và #link(bib.supabase_migrations.url)[Database Migrations].

=== 2.3.3. TypeScript trong kiểm soát mô hình dữ liệu UI
TypeScript được sử dụng để định nghĩa type cho cấu trúc dữ liệu từ API và RPC trả về. Khi mở rộng chức năng tồn kho theo sản phẩm, TypeScript giúp ràng buộc dữ liệu về vai trò, phạm vi kho và cấu trúc dòng tồn kho ngay từ compile-time. Mức độ an toàn kiểu dữ liệu này giảm nguy cơ lỗi runtime do sai key hoặc sai kiểu số lượng tồn kho, đặc biệt ở các màn hình có logic phân quyền theo vai trò. Tài liệu tham khảo tại #link(bib.typescript_docs.url)[TypeScript Documentation].

=== 2.3.4. PostgreSQL trong quản trị transaction và ràng buộc
PostgreSQL là lõi dữ liệu của đề án, chịu trách nhiệm quản lý giao dịch, khóa bản ghi, constraint khóa ngoại và trigger đồng bộ profile. Các thao tác trừ tồn kho khi lập hóa đơn hoặc chuyển kho đều cần tính nguyên tử (atomicity), vì vậy được đặt trong transaction tại function SQL. PostgreSQL cung cấp đầy đủ cơ chế để bảo đảm dữ liệu không rơi vào trạng thái lệch khi có thao tác đồng thời. Tài liệu tham khảo tại #link(bib.postgresql_docs.url)[PostgreSQL Documentation].

=== 2.3.5. Cơ chế phân quyền thác nước trong ứng dụng tồn kho
Cơ chế thác nước được xây dựng theo quan hệ vai trò và quan hệ cấp trên trực tiếp. Admin điều phối toàn cục; Supplier/Provider điều phối kho nguồn và quản lý tồn kho kho phụ trách; Retailer quản lý nghiệp vụ tại kho bán lẻ; Staff thao tác ở phạm vi cá nhân được cấp. Quyền thực thi được kiểm tra đồng thời ở lớp giao diện và lớp database. Cơ chế kép này bảo đảm người dùng không nhìn thấy hoặc không thao tác được dữ liệu vượt quyền, đồng thời ngăn cập nhật trái phép qua API trực tiếp.

== 2.4. Khảo sát ý tưởng từ các hệ thống quản lý tồn kho lớn
Nghiên cứu hệ thống Odoo cho thấy cách tổ chức tồn kho theo cấu trúc kho và vị trí lưu trữ (warehouse/location) phù hợp với bài toán nhiều khu vực và nhiều điểm chứa hàng. Tài liệu Inventory của Odoo mô tả khả năng cấu hình route, lead time và replenishment để tự động hóa chuỗi cung ứng, đồng thời nhấn mạnh tách bạch giữa tổ chức kho ở cấp vĩ mô và vị trí lưu trữ ở cấp chi tiết. Cách tiếp cận này có giá trị tham chiếu trực tiếp khi mở rộng TechStore từ mô hình một kho mỗi khu vực sang mô hình nhiều kho trong cùng khu vực. Nội dung tham khảo tại #link(bib.odoo_inventory.url)[Odoo Inventory] và #link(bib.odoo_inventory_management.url)[Odoo Inventory Management].

Ở phạm vi thị trường Việt Nam, KiotViet thể hiện rõ trọng tâm vận hành chuỗi cửa hàng bán lẻ với nghiệp vụ nhập, xuất, kiểm kho và quản lý tồn kho tại chi nhánh. Các tài liệu hướng dẫn nghiệp vụ kho của KiotViet nhấn mạnh thao tác kiểm soát tồn theo chi nhánh, cập nhật hàng hóa theo trạng thái bán hàng và hỗ trợ vận hành từ giao diện quản trị tập trung. Hướng tiếp cận này gần với bối cảnh người dùng thực tế của đề án, nơi dữ liệu bán hàng và tồn kho phải bám sát thao tác vận hành hàng ngày của cửa hàng. Nội dung tham khảo tại #link(bib.kiotviet_main.url)[KiotViet] và #link(bib.kiotviet_inventory_guide.url)[Hướng dẫn kho hàng KiotViet].

Từ hai hướng tham chiếu nói trên, đồ án xác định lộ trình phát triển theo nguyên tắc: giữ mô hình dữ liệu rõ ràng như hệ thống ERP, đồng thời tối ưu thao tác thực tế theo thói quen vận hành của bán lẻ trong nước. Kết quả là hệ thống tập trung vào các flow trọng yếu gồm tạo hóa đơn, chuyển kho hai bước, chỉnh tồn kho có xác nhận và báo cáo theo quyền vai trò.

== 2.5. Chuẩn hóa vận hành migration và đồng bộ môi trường
Mọi thay đổi schema được quản lý bằng migration SQL có version trong `supabase/migrations`. Quy trình áp dụng migration theo thứ tự thời gian giúp các máy phát triển giữ cùng cấu trúc bảng, function và policy. Trên môi trường production, thao tác cập nhật schema thực hiện theo nguyên tắc migration-first để đảm bảo tiến trình phát hành có thể kiểm tra, truy vết và rollback khi cần.
]
