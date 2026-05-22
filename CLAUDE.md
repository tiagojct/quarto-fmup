# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Quarto extension shipping the Faculty of Medicine of the University of Porto (FMUP) visual identity. Contributes three formats - `fmup-html`, `fmup-revealjs`, `fmup-typst` - installable via `quarto add tiagojct/quarto-fmup`. The extension is the source files in `_extensions/fmup/`; there is no separate build artefact for the theme itself.

## Repo layout

```
_extensions/fmup/
  _extension.yml                  Format contributions (html with light/dark, revealjs, typst)
  fmup.scss                       HTML format manifest. Bootstrap defaults + scss:rules.
  fmup-revealjs.scss              Reveal.js manifest. Reveal SCSS vars + scss:rules.
  fmup-variables.scss             Light palette + font + radius tokens (single source of truth)
  fmup-variables-dark.scss        Dark palette overrides + $enable-dark-mode flag
  fmup-fonts.css                  Self-hosted woff2 (base64 data URIs). Loaded via `css:` NOT `theme:`.
  fmup-typst.typ                  Typst styling (H1 rule, code blocks, links, tables)
  fmup-highlight.theme            Pandoc syntax-highlighting JSON theme
  fmup.lua                        Logo forwarding + Open Graph / Twitter meta injection
  partials/_callouts.scss         HTML callouts (heavy !important)
  partials/_callouts-revealjs.scss Reveal callouts mirror
  fonts/                          Raw woff2 (provenance for the inlined base64)

docs/                             Dogfooded documentation site (renders with fmup-html)
example/{site,book,slides}/       Reference projects + manual test bed
tests/visual/                     Playwright visual-regression scaffold
.github/workflows/                render-examples, visual-regression, publish-docs
CHANGELOG.md  CONTRIBUTING.md  README.md
```

## Develop / preview

No test/lint/build script. Render an example or the docs site:

```sh
cd example/slides && quarto preview slides.qmd
cd example/site   && quarto preview
cd example/book   && quarto preview                  # HTML + Typst PDF
cd docs           && quarto preview                  # dogfooded docs
```

Each example has a `_extensions` symlink pointing at the repo root, so edits to the theme are picked up live by `quarto preview`.

Visual-regression suite (Playwright):

```sh
cd tests/visual
npm install
npx playwright install chromium
npx playwright test                       # check against committed baselines
npx playwright test --update-snapshots    # accept new baselines
```

CI workflow `render-examples` matrix-renders all three examples on push / PR; `visual-regression` runs the Playwright suite; `publish-docs` deploys `docs/_site` to `gh-pages` when files under `docs/` or `_extensions/` change.

## Theme stack layering

Quarto compiles `scss:defaults` in REVERSE list order. The theme key declares files so the token files come LAST in the list and therefore FIRST in compile order. Light example:

```yaml
theme:
  light:
    - default                  # Bootstrap
    - fmup.scss                # uses $fmup-* tokens
    - fmup-variables.scss      # defines $fmup-* with !default (compiled first)
  dark:
    - default
    - fmup.scss
    - fmup-variables-dark.scss
```

If a downstream consumer wants to override a token, they list THEIR file LAST so their non-`!default` assignment lands earliest in compiled output and wins the `!default` race elsewhere.

## Self-hosted fonts: why `css:` not `theme:`

The base64-inlined woff2 payload trips a Quarto post-process css-vars analyser bug ("Expecting punctuation ')'") when fonts are loaded via the `theme:` SCSS pipeline. Loading as a plain CSS file via `css:` bypasses that analyser. The compiled CSS still caches once per site (browsers fetch one file, ~210 KB). See design scar #7.

## Release flow

1. Bump `version:` in `_extensions/fmup/_extension.yml`.
2. Move `## [Unreleased]` content in `CHANGELOG.md` to a new `## [X.Y.Z] - YYYY-MM-DD` section; reseed empty `[Unreleased]`.
3. Commit. Subject convention from `git log`: `vX.Y.Z: <short imperative summary>` (no Conventional Commits prefix).
4. Tag `vX.Y.Z` and push tag - `quarto add / update` resolves to git tags.

Versioning: PATCH = visual fixes / doc / refactor, MINOR = new tokens / partials / YAML keys, MAJOR = rename / remove tokens, restructure `_extension.yml` keys, change partial folder layout.

## Design rules baked into the SCSS (load-bearing)

These are not preferences - they are scars from prior breakage. Full register in `docs/design-scars.qmd` and `CONTRIBUTING.md`. Short version, in order of "how often you will trip on it":

1. **Reveal owns slide layout; the theme only paints.** Never override `display`, `position`, `height`, or visibility on `#title-slide` or `section.center` in `fmup-revealjs.scss`. Past attempts broke every other slide. Centring uses reveal's own `center: true` (already on at deck level) or per-slide `{.center}`.
2. **Callout overrides need `!important`.** Quarto core CSS loads after theme SCSS. No other reliable hook exists. Both `partials/_callouts.scss` files lean on this.
2b. **`.callout-header` AND `.callout-title` both need the background override.** Quarto paints the wrapping `.callout-header` bar; missing it lets Bootstrap defaults (blue note, green tip) bleed through in dark mode.
2c. **Table thead is pinned to literal `#1A1A1A` / `#FFCD00`.** Using `$fmup-text` flips to near-white in dark mode and yellow-on-near-white is 1.4:1 (WCAG fail). Institutional dark-band header stays identity-preserving across modes.
3. **Reveal footer requires `text-align: center !important` on both `.footer` AND its inner `<p>`.** Quarto's `support.js` inline-styles `display: block` at deck-ready time, defeating any flex centring.
4. **Slide-number baseline alignment.** `.reveal .slide-number` must share font-size, padding, and `bottom` offset with `.reveal .footer` text, or baselines drift.
5. **Sidebar widening lives on `.page-columns` grid-template-columns**, not on `.sidebar` alone (causes column overlap).
6. **Prose link styling is scoped to `main / .content / article / .quarto-document-content`** and excludes `.citation`, `.no-underline`, anchor / footnote refs.
7. **Self-hosted fonts ship via `css:` (HTML) and `include-in-header` (reveal), never `theme:`.** See "Self-hosted fonts" section above. Reveal's `css:` adds a `<link>` but does NOT copy the file; an inlined `<style>` via `include-in-header` is the only reliable path for shareable single-file slide decks.
7b. **`.css` files only accept `/* */` comments.** A `//` header in a renamed-from-SCSS file makes the browser parser bail and silently discard every subsequent `@font-face`. Convert all comments when renaming `.scss` to `.css`.
8. **Attribute selector values must not contain `//`.** The css-vars analyser treats `//` as a comment start even inside strings. Use `[href*="localhost"]`, not `[href*="//localhost"]`.
9. **`include-in-header` does NOT interpolate Pandoc template variables.** Use `fmup.lua` + `quarto.doc.include_text('in-header', ...)` for templated meta tags. The Open Graph + Twitter Card tags use this path.
10. **Typst variable fonts** emit warnings and may fall back. Document, do not silence.
11. **Syntax highlighting needs separate light + dark `.theme` files.** Pandoc `.theme` is static JSON; ship `fmup-highlight.theme` + `fmup-highlight-dark.theme` and declare `highlight-style: { light, dark }`.

## Palette (single source of truth)

All tokens in `_extensions/fmup/fmup-variables.scss` (light) and `fmup-variables-dark.scss` (dark). Both files use `!default` so downstream themes can override.

Light palette:

- `#FFCD00` yellow (accent only, never body bg, never link text colour on white)
- `#1A1A1A` near-black text, `#5B6470` muted, `#FFFFFF` bg, `#F7F7F7` surface, `#F0F0F0` surface-strong (code blocks), `#E0E0E0` border, `#B3BBC4` border-strong
- `#B91C1C` `$fmup-danger`: reserved for callout-important + error states only

Dark palette: text `#F2F2F2`, bg `#0E0E0E`, surface `#1A1A1A`, surface-strong `#242424`, borders `#303030` / `#4A4A4A`. Yellow stays `#FFCD00` (passes AAA on near-black). Red lightens to `#F87171`.

Data-viz palette `$fmup-chart-1..6` (Okabe-Ito derived, deuteranopia-safe, no green). Exported on `:root` as `--fmup-chart-1..6` for runtime use from JS / R / Python.

## Lua filter (`fmup.lua`)

Two responsibilities, both gated on user opt-in:

- **Logo forwarding**: `fmup.logo: path/to/wordmark.svg` propagates to `logo` (revealjs), `website.navbar.logo`, `book.navbar.logo`. Never overwrites user-set values.
- **Open Graph + Twitter Card meta**: emits OG / Twitter tags from frontmatter (`title`, `description`, `lang`, `author`) for HTML and revealjs only. Uses `quarto.doc.include_text` because `include-in-header` partials with Pandoc template syntax are not interpolated.

## Fonts

Atkinson Hyperlegible Next (Braille Institute, SIL OFL 1.1) and Geist Mono (Vercel, SIL OFL 1.1). Both shipped as base64 woff2 inside `fmup-fonts.css`. Variable axes; latin + latin-ext subsets; cyrillic / vietnamese / symbols stripped because the theme targets pt-PT and en. Raw woff2 in `_extensions/fmup/fonts/` for provenance.

For Typst output, Typst <= 0.14 does not support variable fonts and will warn. Users who want institutional fonts in PDF must install static-weight TTFs system-wide or override `mainfont` in their Typst block.

## License note

MIT covers the SCSS, Typst config, Lua filters, syntax-highlighting theme, and example projects. The FMUP institutional identity (yellow tile mark, FMUP wordmark, faculty name) is not licensed to third parties through this repo. For unrelated work, change the palette.
