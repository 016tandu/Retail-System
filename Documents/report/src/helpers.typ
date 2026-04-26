#let ui-placeholder(file-name, caption-text, h: 65mm) = figure(
  kind: image,
  placement: none,
  rect(
    width: 100%,
    height: h,
    stroke: 0.8pt + luma(150),
    fill: luma(245),
    inset: 8pt,
  )[
    #align(center + horizon, [
      #strong[Ảnh giao diện cần chèn]
      #linebreak()
      Tên file đề xuất: #file-name
    ])
  ],
  caption: caption-text,
)

#let alg(caption-text, body) = figure(
  kind: "algorithm",
  supplement: [Giải thuật],
  placement: none,
  rect(
    width: 100%,
    stroke: 0.8pt + luma(140),
    fill: luma(248),
    inset: 8pt,
  )[#body],
  caption: caption-text,
)

#let report-image(path, caption-text, w: 100%, h: 120mm) = figure(
  kind: image,
  placement: none,
  image(path, width: w, height: h, fit: "contain"),
  caption: caption-text,
)
