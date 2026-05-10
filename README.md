# quarto-fmup

The Faculty of Medicine of the University of Porto (FMUP) visual identity
for Quarto — yellow `#FFCD00` + black + Atkinson Hyperlegible Next, ready
for **websites**, **books**, and **reveal.js presentations**.

## Install

From the root of any Quarto project:

```sh
quarto add tiagojct/quarto-fmup
```

When prompted, type `y` to trust the extension. That's it. The
fonts (Atkinson Hyperlegible Next + Geist Mono) are loaded from Google
Fonts automatically — no system install needed.

## Use

Three formats are contributed. Pick the one(s) you need.

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
