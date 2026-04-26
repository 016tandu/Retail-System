#let cover-page() = [
  #align(center)[
    #box(
      width: 100%,
      height: 245mm,
      stroke: 0.9pt + luma(130),
      inset: (x: 10mm, y: 8mm),
    )[
      #align(center)[
        BỘ GIÁO DỤC VÀ ĐÀO TẠO
        #linebreak()
        TRƯỜNG ĐẠI HỌC VĂN HIẾN
        #linebreak()
        #strong[KHOA CÔNG NGHỆ THÔNG TIN]
      ]

      #v(20mm)
      #align(center)[
        #image("../img/iconlogoDHVanHien.png", width: 35mm)
      ]

      #v(18mm)
      #align(center)[
        #strong(text(18pt)[ĐỒ ÁN MÔN HỌC])
      ]

      #v(10mm)
      #align(center)[
        #strong(text(18pt)[XÂY DỰNG WEBSITE BÁN HÀNG])
      ]

      #v(34mm)
      #align(center)[
        #grid(
          columns: (1fr, 2fr),
          gutter: 4pt,
          align: left,
          [#strong[GVHD:]], [TH.S NGUYỄN BẠCH THANH TÙNG],
          [#strong[NHÓM SVTH:]], [
            1.
            #linebreak()
            2.
            #linebreak()
            3.
          ],
        )
      ]

      #v(52mm)
      #align(center)[#strong[TP. HỒ CHÍ MINH - 2026]]
    ]
  ]
]
