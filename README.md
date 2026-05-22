# quarto-fmup

The Faculty of Medicine of the University of Porto (FMUP) visual identity
for Quarto — yellow `#FFCD00` + black + Atkinson Hyperlegible Next, ready
for **websites**, **books**, and **reveal.js presentations**.

<!-- screenshots: add after the next render -->
<!--
| Website | Book | Slides |
|---|---|---|
| ![](docs/screenshots/site.png) | ![](docs/screenshots/book.png) | ![](docs/screenshots/slides.png) |
-->

> **Screenshots** of the three example projects live under
> `docs/screenshots/` once generated. See `CONTRIBUTING.md` for the
> capture workflow.

## Install

From the root of any Quarto project:

```sh
quarto add tiagojct/quarto-fmup
```

When prompted, type `y` to trust the extension. That's it. The
fonts (Atkinson Hyperlegible Next + Geist Mono) ship embedded
inside the extension — no Google Fonts request, no system install
needed.

## Use

Three formats are contributed. Each has a `fmup-` prefix and **you
must use the prefixed name** — bare `format: html` / `format: typst`
will NOT pick up the extension's defaults (theme, fonts, callout
styling, Lua filter, OG meta).

### Website or book

```yaml
# _quarto.yml
format:
  fmup-html: default
```

### Reveal.js slides

```yaml
---
title: "Slides"
author: "Autor"
format:
  fmup-revealjs:
    footer: "FMUP · Faculdade de Medicina da Universidade do Porto"
---
```

### Typst PDF

```yaml
format:
  fmup-typst: default
```

> The Typst format uses Typst's BibLaTeX parser, which is stricter
> than Pandoc's citeproc. Duplicate `.bib` entries that Pandoc
> tolerated will be a fatal render error here — deduplicate the
> bibliography before switching from `html` to `fmup-typst`.

## Examples

Three minimal reference projects live in `example/`:

| Folder              | What                                             |
|---------------------|--------------------------------------------------|
| `example/site/`     | Quarto website (two pages, navbar, sidebar TOC)  |
| `example/book/`     | Quarto book (three chapters, HTML + Typst PDF)   |
| `example/slides/`   | Reveal.js deck (15 slides covering all primitives)|

Preview any of them with `quarto preview` from inside the folder.

## Update

```sh
quarto update tiagojct/quarto-fmup
```

## Known issues

### Single-file render of a nested `.qmd` may fail to resolve the extension

If you install via `quarto add tiagojct/quarto-fmup`, the extension
lands at `_extensions/tiagojct/fmup/` (Quarto's canonical
`<org>/<name>` layout). When rendering a single nested file:

```sh
quarto render subdir/chapter.qmd   # → ERROR: Unable to read the extension 'fmup'
```

This is a Quarto extension-resolver bug (the resolver does not walk
up to the project root when given a single nested file). It does
**not** affect:

- `quarto render` (project-wide) — works.
- `quarto render chapter.qmd` at the project root — works.
- `quarto preview` of the project — works.

Workarounds:

1. Render project-wide (`quarto render`) instead of single-file.
2. Flatten the extension path: `mv _extensions/tiagojct/fmup _extensions/fmup`
   (note: breaks `quarto update`, which expects the org-prefixed path).

## Override

The theme is a thin layer of SCSS. To tweak it for your project, layer
your own `.scss` after the extension's in `_quarto.yml`:

```yaml
format:
  fmup-html:
    theme:
      - default
      - _extensions/fmup/fmup.scss   # the FMUP base
      - mytheme.scss                 # your overrides
```

## License

[MIT](LICENSE) for the SCSS, the Typst config, and the example projects.
The FMUP institutional identity (yellow tile mark, FMUP wordmark, the
Faculty's name) belongs to the Faculty and is not licensed to third
parties through this repository. Use the visuals for materials produced
by, for, or in collaboration with the Faculty; for unrelated work,
change the palette.

## Credits

Theme by **Tiago Jacinto**, Faculdade de Medicina da Universidade do
Porto. Extracted from
[`tiagojct/fmup-ia`](https://github.com/tiagojct/fmup-ia).

- [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont)
  © Braille Institute (SIL Open Font License).
- [Geist Mono](https://vercel.com/font) © Vercel (SIL Open Font License).
