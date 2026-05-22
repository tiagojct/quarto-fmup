// FMUP institutional styling for Typst output.
//
// Mirrors the visual identity of fmup.scss / fmup-revealjs.scss for the
// PDF/Typst format: yellow accent on H1, dark links with yellow
// underline, surface-tinted code blocks, yellow-bordered blockquotes.
//
// Loaded via `include-in-header: [fmup-typst.typ]` in the typst format
// contribution of _extension.yml. Tokens are inlined (Typst has no
// upstream design-token import; keep these in sync with
// _extensions/fmup/fmup-variables.scss).

#let fmup-yellow        = rgb("#FFCD00")
#let fmup-yellow-dark   = rgb("#E6B800")
#let fmup-text          = rgb("#1A1A1A")
#let fmup-text-muted    = rgb("#5B6470")
#let fmup-bg            = rgb("#FFFFFF")
#let fmup-surface       = rgb("#F7F7F7")
#let fmup-surface-strong = rgb("#F0F0F0")
#let fmup-border        = rgb("#E0E0E0")
#let fmup-danger        = rgb("#B91C1C")

// ---- Body ----
#set par(justify: true, leading: 0.7em)
#set text(fill: fmup-text)

// ---- Headings ----
#show heading.where(level: 1): set block(below: 0.8em, above: 1.4em)
#show heading.where(level: 1): set text(size: 1.6em, weight: 800)
#show heading.where(level: 1): it => block[
  #it
  #v(-0.45em)
  #line(length: 100%, stroke: 3pt + fmup-yellow)
]

#show heading.where(level: 2): set text(weight: 800)
#show heading.where(level: 3): set text(weight: 700, fill: fmup-text-muted)

// ---- Links ----
// Dark link colour + yellow underline mirrors the HTML/reveal theme.
#show link: set text(fill: fmup-text)
#show link: it => underline(stroke: 1pt + fmup-yellow, offset: 2pt, it)

// ---- Inline code ----
#show raw.where(block: false): box.with(
  fill: fmup-surface-strong,
  inset: (x: 3pt, y: 0pt),
  outset: (y: 3pt),
  radius: 2pt,
)

// ---- Code blocks ----
#show raw.where(block: true): block.with(
  fill: fmup-surface-strong,
  stroke: 1pt + fmup-border,
  inset: 10pt,
  radius: 4pt,
  width: 100%,
)

// ---- Block quote ----
#show quote.where(block: true): it => block(
  fill: fmup-surface,
  stroke: (left: 4pt + fmup-yellow),
  inset: (left: 12pt, rest: 10pt),
  radius: (right: 4pt),
  width: 100%,
  it.body,
)

// ---- Tables ----
// Header row inverts to dark + yellow, mirroring the HTML table style.
#show table.cell.where(y: 0): set text(fill: fmup-yellow, weight: 700)
#show table.cell.where(y: 0): set table.cell(fill: fmup-text)
