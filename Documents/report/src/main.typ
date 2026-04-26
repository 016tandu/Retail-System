#import "helpers.typ": *
#import "cover.typ": cover-page
#import "preface.typ": section-loi-cam-on, section-loi-cam-doan, section-nhan-xet, section-tu-viet-tat
#import "chapter1.typ": chapter-1
#import "chapter2.typ": chapter-2
#import "chapter3.typ": chapter-3
#import "chapter4.typ": chapter-4
#import "conclusion.typ": conclusion-section
#import "references.typ": references-section
#import "appendix.typ": appendix-section

#set page(
  paper: "a4",
  margin: (
    top: 2.5cm,
    bottom: 2.5cm,
    left: 3cm,
    right: 2cm,
  ),
  footer: context {
    let p = counter(page).get().first()
    if p > 1 [#align(center, text(11pt)[#p])]
  },
)

#set text(font: "Times New Roman", size: 13pt, lang: "vi")
#set par(
  justify: true,
  first-line-indent: 0.5in,
  leading: 0.5em,
  spacing: 2pt,
)
#set heading(numbering: none)
#show table.cell: set text(12pt)
#show heading.where(level: 1): it => [#pagebreak(weak: true) #it]

#cover-page()

#pagebreak()
#section-loi-cam-on()

#pagebreak()
#section-loi-cam-doan()

#pagebreak()
#section-nhan-xet()

#pagebreak()
= MỤC LỤC
#outline()

#pagebreak()
= DANH MỤC HÌNH ẢNH
#outline(target: figure.where(kind: image))

#pagebreak()
= DANH MỤC GIẢI THUẬT
#outline(target: figure.where(kind: "algorithm"))

#pagebreak()
#section-tu-viet-tat()

#pagebreak()
= MỞ ĐẦU
Đồ án tập trung xây dựng và chuẩn hóa hệ thống quản lý bán hàng TechStore theo định hướng ứng dụng thực tiễn trong môi trường nhiều vai trò và nhiều kho. Báo cáo trình bày đầy đủ phần khảo sát hiện trạng, phân tích thiết kế nghiệp vụ, thiết kế cơ sở dữ liệu, mô tả giao diện và phương án triển khai.

Nội dung báo cáo bám sát trạng thái mã nguồn hiện tại và bộ migration đang áp dụng trong dự án. Các sơ đồ sử dụng trong chương phân tích thiết kế được sinh bằng MermaidJS và render PNG để phục vụ minh họa tài liệu.

#pagebreak()
#chapter-1()

#pagebreak()
#chapter-2()

#pagebreak()
#chapter-3()

#pagebreak()
#chapter-4()

#pagebreak()
#conclusion-section()

#pagebreak()
#references-section()

#pagebreak()
#appendix-section()
