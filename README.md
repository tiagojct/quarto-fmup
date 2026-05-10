# quarto-fmup

A Quarto extension that ships the **Faculty of Medicine of the University
of Porto (FMUP)** institutional theme — yellow `#FFCD00` + black + Atkinson
Hyperlegible Next typography — for HTML sites, books, reveal.js
presentations, and Typst PDFs.

The theme is licensed under the **MIT License** (permissive). The FMUP
institutional identity (the yellow square mark, the FMUP wordmark) is the
property of the Faculty and should only be used in materials produced
by, for, or in collaboration with the Faculty.

## Install

```sh
quarto add tiagojct/quarto-fmup
```

This places the extension under `_extensions/fmup/` in the current Quarto
project. Commit the directory to version control.

To install a specific version, append `@v1.0.0`:

```sh
quarto add tiagojct/quarto-fmup@v1.0.0
```

## Use

The extension contributes three formats: `fmup-html`, `fmup-revealjs`, and
`fmup-typst`. Reference them in `_quarto.yml` (for sites and books) or in
the YAML front matter of a single `.qmd` (for presentations).

### Website

```yaml
# _quarto.yml
project:
  type: website

website:
  title: "Site"
  navbar:
    left:
      - href: index.qmd
        text: Home

format:
  fmup-html: default
```

### Book

```yaml
# _quarto.yml
project:
  type: book

book:
  title: "Livro"
  author: "Autor"
  chapters:
    - index.qmd
    - intro.qmd

format:
  fmup-html: default
  fmup-typst: default
```

### Reveal.js presentation

```yaml
---
title: "Slides"
subtitle: "FMUP"
author: "Autor"
date: today
format:
  fmup-revealjs:
    slide-number: c/t
---
```

### Mixing in an existing project

If you already have a custom theme, you can layer the FMUP SCSS without
adopting the format wholesale:

```yaml
format:
  html:
    theme:
      - cosmo
      - _extensions/fmup/fmup.scss
```

## Fonts

The theme loads **Atkinson Hyperlegible Next** (Braille Institute,
high-legibility) and **Geist Mono** (Vercel) from Google Fonts via an
`@import` in the SCSS. No build step required.

For Typst output, install the fonts system-wide if you want them in the
PDF; otherwise Typst falls back to its default serif.

## What's included

- `fmup.scss` — Bootstrap-based HTML theme (websites, books).
- `fmup-revealjs.scss` — reveal.js slide theme.
- Typst format defaults (A4, 11pt, Atkinson Hyperlegible Next, yellow
  underlines on links).

The HTML theme covers: navbar, sidebar, page TOC, callouts, code, tables,
buttons, blockquotes, and footer. The reveal theme covers: title slide,
section headings (with the yellow tile mark before each H2), code blocks,
tables, blockquotes, footnotes, progress bar, and a `.center` class for
chapter-divider slides.

The custom landing components from the original `fmup-ia` project (the
hero block, the three-card grid) are **not** included — those are
project-specific. If you need them, copy them from
`tiagojct/fmup-ia/theme.scss`.

## Examples

The `example/` directory holds three minimal reference projects:

- `example/site/` — Quarto website with two pages.
- `example/book/` — Quarto book with three chapters.
- `example/slides/` — reveal.js presentation with twelve slides covering
  the visual primitives (title, agenda, headings, code, table, image,
  blockquote, two-column, callout, divider, references, end).

To preview any of them:

```sh
cd example/site   # or book / slides
quarto preview
```

## Versioning

The extension uses semver:

- **Major** — incompatible changes to the format names, the SCSS public
  variables, or the Bootstrap variable mappings.
- **Minor** — new format contributions, new SCSS variables exposed for
  override, additive style rules.
- **Patch** — palette tweaks, typography fixes, bug fixes that don't
  change the visual baseline meaningfully.

## Credits

Theme by **Tiago Jacinto**, Faculdade de Medicina da Universidade do Porto.

Atkinson Hyperlegible Next © Braille Institute of America. Geist Mono ©
Vercel. Both fonts are open-source and free to redistribute via Google
Fonts.

## Related

- [`tiagojct/fmup-ia`](https://github.com/tiagojct/fmup-ia) — the
  institutional GenAI framework book that this theme was originally
  authored for.
