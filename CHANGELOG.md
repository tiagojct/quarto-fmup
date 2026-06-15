# Changelog

All notable changes to `quarto-fmup` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 1.3.0

### Changed (visible behaviour)

- **Default body font swapped from Atkinson Hyperlegible Next to
  Inter.** Inter (Rasmus Andersson, SIL OFL) is now the default
  sans-serif across `fmup-html`, `fmup-revealjs`, and `fmup-typst`.
  Every existing site / deck / PDF re-rendered with v1.3.0 will look
  different — the body, headings, navbar, sidebar, slide chrome, and
  PDF text all switch typeface. This is the visible-change
  justification for the minor version bump rather than a patch.

### Added

- **Inter font payload** bundled in the extension:
  - `Inter-Variable-Latin.woff2` (~47 KB)
  - `Inter-Variable-Italic-Latin.woff2` (~50 KB)
  - 4 Inter static TTFs (Regular / Italic / Bold / BoldItalic) under
    `_extensions/fmup/fonts/` for Typst (~1.6 MB total).
  - Two new `@font-face` blocks prepended to `fmup-fonts.css` (and
    its `<style>`-wrapped counterpart `fmup-fonts.html`); base64
    payload grows ~130 KB.
- **`fmup-variables-atkinson.scss`** opt-in partial. Appending it to
  the `theme:` chain after `fmup-variables.scss` flips
  `$fmup-font-sans` back to the Atkinson stack. Atkinson Hyperlegible
  Next TTFs and `@font-face` blocks stay bundled — no extra
  resources needed to opt back in.

### Fixed (latent bug)

- **Four hardcoded `font-family` declarations in `fmup.scss`**
  (`body`, `h1..h6`, `.navbar`, `.sidebar`) had literal `"Atkinson
  Hyperlegible Next", ...` strings instead of the `$fmup-font-sans`
  token. Without that fix the default-font swap would not propagate
  to those selectors. All four now reference the token, so any
  downstream override of `$fmup-font-sans` flows through correctly.

### Documented

- `docs/customise.qmd` gained an "Atkinson Hyperlegible Next
  (opt-in)" section with the recipe for HTML/reveal and Typst.
- `docs/accessibility.qmd` now lists Inter as the default
  typeface rationale and Atkinson as the opt-in row, with the link
  in the "Recursos" section split between the two.
- `docs/formats/typst.qmd` simplified: the "variable fonts not
  supported" workaround no longer applies because the extension
  ships static-weight TTFs and declares `font-paths: [fonts]`.
- README, CLAUDE.md, example projects all updated to reflect Inter
  as the default and Atkinson as the opt-in.

## [1.2.3] - 2026-05-22

### Fixed (CRITICAL)

- **Typst PDF: `font-paths` was a project-relative absolute path
  (`_extensions/fmup/fonts`), broken under `quarto add` because
  Quarto installs extensions at `_extensions/<org>/<name>/`.** With
  the canonical org-prefixed install, Typst looked for fonts in
  `_extensions/fmup/fonts` (does not exist), silently fell back to
  Libertinus Serif for the body and DejaVu Sans Mono for code.
  Changed to `font-paths: [fonts]` (relative to the extension dir);
  Quarto auto-resolves this to the correct absolute path regardless
  of org-prefix.
- **Typst PDF: Geist Mono fell back to DejaVu Sans Mono in body
  text.** Two causes:
  1. Quarto's Typst template reads `codefont:` from YAML, not
     `monofont:`. Without an explicit `codefont:` key in the typst
     contribution, raw / code blocks hit Typst's hardcoded DejaVu
     Sans Mono default. Added `codefont: "Geist Mono"` to the typst
     format block.
  2. Geist Mono only shipped Regular + Medium TTFs; Bold + Italic
     requests synthesised or fell back. Added the official Vercel
     Geist Mono Regular / Medium / Bold / Italic TTFs (~745 KB
     total) under `_extensions/fmup/fonts/`. Geist Mono does not
     ship a true BoldItalic upstream; Typst synthesises.
- **Buttons + yellow-anchor surfaces were illegible in dark mode.**
  `.btn-primary` declared `color: $fmup-text`, which flips to
  `#F2F2F2` (near-white) in dark mode while the background stays
  `#FFCD00` yellow. Contrast collapsed to ~1.4:1. Same bug class
  affected `.btn-secondary:hover`, navbar nav-link hover/active,
  sidebar active item, prose link hover, `.reveal .slides a:hover`,
  and `.reveal .highlight`. Introduced two constant tokens that do
  NOT flip across modes:
  ```scss
  $fmup-ink-on-yellow:  #1A1A1A !default;
  $fmup-ink-on-danger:  #FFFFFF !default;
  ```
  Used wherever the background is an institutional anchor colour.
  See design scar #2d.

### Documented

- **README**: explicit warning that `format: fmup-*` (prefixed) is
  REQUIRED. Bare `format: typst` / `format: html` does NOT pick up
  extension defaults.
- **README**: known-issue note on single-file `quarto render
  subdir/chapter.qmd` failing to resolve the extension under
  org-prefixed install (Quarto resolver bug). Workarounds: render
  project-wide, or flatten the extension path.
- **README**: Typst's BibLaTeX parser is stricter than Pandoc's
  citeproc. Duplicate `.bib` entries tolerated under `html` become
  fatal under `fmup-typst`. Deduplicate before switching formats.
- **Design scar #2d** (text-on-anchor-bg colour tokens) added to
  `docs/design-scars.qmd`.

## [1.2.2] - 2026-05-22

### Removed

- **External-link `::after` arrow (`↗`).** Two visual artefacts:
  on hover the yellow background flowed over the arrow but the
  underline did not extend through the ::after pseudo-element, so
  the arrow read as floating in a yellow void; in dense rows
  (cards, single-line table cells with links) the arrow sat
  ambiguously close to other icons (anchorjs headings, table
  markers) and created visual stutter. Link distinction is now
  carried purely by the existing yellow underline
  (`text-decoration-thickness: 2.5px`) + `font-weight: 500`, which
  is already WCAG-compliant (two channels). Documentation in
  `docs/formats/html.qmd` and `docs/accessibility.qmd` updated.

### Documented

- **New design scar #7d**: root `.gitignore` `*.<ext>` rules
  silently swallow assets inside `_extensions/`. Lives in
  `docs/design-scars.qmd`, `CONTRIBUTING.md` and `CLAUDE.md`. The
  v1.2.0 release that shipped without `fmup-fonts.html` is the
  reference incident.

## [1.2.1] - 2026-05-22

### Fixed

- **`fmup-fonts.html` was missing from the v1.2.0 release tarball.**
  Root `.gitignore` had a broad `*.html` rule (intended for Quarto
  build artefacts) which silently swallowed the file. Downstream
  installs via `quarto add / update` got an `_extension.yml` that
  references `include-in-header: [fmup-fonts.html]` for the
  `fmup-revealjs` format but no such file on disk, so reveal decks
  fell back to system fonts. `.gitignore` now negates the path
  (`!_extensions/fmup/fmup-fonts.html`); the file is shipped with
  this release. Affected users: anyone who ran
  `quarto add tiagojct/quarto-fmup@v1.2.0` for reveal output - run
  `quarto update tiagojct/quarto-fmup` to pull the fix.

> **v1.2.0 is broken:** missing `fmup-fonts.html`. Use v1.2.1 or later. See above.

### Fixed

- **`fmup-fonts.html` was missing from the v1.2.0 release tarball.**
  Root `.gitignore` had a broad `*.html` rule (intended for Quarto
  build artefacts) which silently swallowed the file. Downstream
  installs via `quarto add / update` got an `_extension.yml` that
  references `include-in-header: [fmup-fonts.html]` for the
  `fmup-revealjs` format but no such file on disk, so reveal decks
  fell back to system fonts. `.gitignore` now negates the path
  (`!_extensions/fmup/fmup-fonts.html`); the file is shipped with
  this release. Affected users: anyone who ran
  `quarto add tiagojct/quarto-fmup@v1.2.0` for reveal output - run
  `quarto update tiagojct/quarto-fmup` to pull the fix.

## [1.2.0] - 2026-05-22

### Added

- **Static-weight Atkinson Hyperlegible Next + Geist Mono TTFs**
  bundled under `_extensions/fmup/fonts/` (Regular / Italic / Bold /
  BoldItalic + Geist Mono Regular / Medium). The typst format now
  declares `font-paths: [_extensions/fmup/fonts]` so Typst loads them
  directly. **Eliminates the "variable fonts are not currently
  supported" warning** that fired on every PDF render.
- **Typst `#callout` override** in `fmup-typst.typ`. Quarto's
  template calls `#callout(...)` with Bootstrap-default colours;
  the override maps `note -> yellow`, `tip -> dark`, `warning ->
  mid-grey`, `caution -> muted`, `important -> red` so PDFs match the
  HTML / reveal callout palette. Layout: thick left border, tinted
  header, body on page bg.
- **Open Graph image plumbing in `fmup.lua`**. Reads
  `meta.fmup["og-image"]` (extension key), `meta.website["open-graph"].image`
  (Quarto's native key), or `meta["og-image"]` (per-page). Emits
  `og:image` + `twitter:image` and upgrades the Twitter Card to
  `summary_large_image` when an image is set; falls back to plain
  `summary` otherwise.
- **Per-slide `.no-footer` / `.no-logo`** opt-outs on reveal:
  `## My slide {.no-footer .no-logo}` hides each via `:has()` rules.
  Footer is also hidden by default on `#title-slide` and H1 section
  dividers (convention: running matter does not appear on chapter
  starts). Same default applies to logo.

### Changed

- **Font payload subsetted to LATIN ONLY** (was Latin + Latin-ext).
  Portuguese and English glyphs all live in U+0000-00FF. Drops the
  inlined base64 from 210 KB to 137 KB. Polish / Czech / Vietnamese /
  Eastern European consumers add their own latin-ext `@font-face`
  via include-in-header; recipe in `docs/customise.qmd`.
- **Unused latin-ext `.woff2` files removed** from
  `_extensions/fmup/fonts/`. Only the inlined latin variants stay
  (kept as provenance for the base64 in `fmup-fonts.css`).
- Bumped extension version to `1.2.0` (additive minor release).

### Known issues

- Reveal does not support `theme: { light, dark }` natively. Authors
  who want a dark deck swap `fmup-variables.scss` for
  `fmup-variables-dark.scss` in their own `theme:` list - recipe
  documented in `docs/customise.qmd`.

## [1.1.0] - 2026-05-22

### Added

**Tokens + architecture**

- `fmup-variables.scss` and `fmup-variables-dark.scss` - single
  source of truth for palette, font stacks and radii. Listed as
  separate entries in the theme stack so they participate in Quarto's
  reverse-ordered defaults compilation.
- `$fmup-surface-strong` (`#F0F0F0`) token, used as background for
  code blocks and inline code so they read distinctly from `$fmup-bg`.
- `$fmup-danger` token (`#B91C1C` light / `#F87171` dark) replaces
  the hard-coded red in callout-important.
- `$fmup-chart-1..6` data-viz palette (Okabe-Ito derived,
  deuteranopia-safe, no green). Also exported as `--fmup-chart-1..6`
  CSS custom properties on `:root` for JS / R / Python access.
- `partials/_callouts.scss` and `partials/_callouts-revealjs.scss` -
  highest-volatility section of each main SCSS extracted into paired
  partials.

**Dark mode**

- Full dark variant for `fmup-html` via `theme: { light, dark }`.
  Background to `#0E0E0E`, text to `#F2F2F2`, surfaces step up in two
  stops, yellow stays (passes WCAG AAA against near-black), red
  lightens for AA on dark.

**Self-hosted fonts**

- Atkinson Hyperlegible Next (latin + latin-ext, regular + italic
  variable axes) and Geist Mono (latin + latin-ext variable) embedded
  as base64 data URIs in `fmup-fonts.css`. Zero third-party network
  requests at render time. GDPR-clean, offline-renderable, cached once
  per site via Quarto's `css:` mechanism.
- Source woff2 files committed under `_extensions/fmup/fonts/` for
  provenance.

**Typography + accessibility**

- Prose link `font-weight: 500` + 2.5px yellow underline - second
  channel of distinction beyond colour for monochrome / high-contrast
  renderers.
- External-link CSS pseudo-element (north-east arrow) on
  `[href^="http"]` links, scoped to article content, excluding
  `.citation`, `.no-underline`, and localhost.
- `prefers-reduced-motion: reduce` media-query disables theme
  smooth-scroll. Bootstrap 5 covers component-level animations via
  `$enable-reduced-motion`.

**Format coverage**

- `fmup-typst.typ` extends the Typst format with H1 yellow underline
  rule, dark links with yellow underline, surface-tinted code blocks,
  yellow-bordered blockquotes, dark / yellow table headers.
- `fmup-highlight.theme` - Pandoc syntax-highlighting theme tuned to
  the FMUP palette. Restrained: weight + greyscale carry
  differentiation; yellow-dark accent on keywords; red kept for errors
  / alerts only.
- Print stylesheet for HTML: hides navbar / sidebar / TOC / footer,
  prints external-link URLs after each link, drops surface fills,
  prevents page breaks inside headings / figures / tables.

**Lua filter (`fmup.lua`)**

- Forwards `fmup.logo` from project YAML to format-specific keys
  (`logo` for revealjs, `website.navbar.logo` for sites,
  `book.navbar.logo` for books). Non-destructive of user-set values.
- Emits Open Graph + Twitter Card meta tags populated from each
  page's `title`, `description`, `lang`, `author`.

**Docs + process**

- Dogfooded documentation site under `docs/` (rendered with
  `fmup-html` itself). Covers install, format options, customisation,
  accessibility, data-viz palette, and the full design-scars
  register.
- `CONTRIBUTING.md` with branch / commit / release flow and the
  design-rules summary.
- `CHANGELOG.md` (this file) backfilled from git tags.
- CI: `render-examples.yml` matrix-renders all three example projects
  on push / PR. `visual-regression.yml` runs Playwright against
  committed baselines. `publish-docs.yml` deploys `docs/_site` to
  `gh-pages` on push to main.
- Playwright visual-regression scaffold under `tests/visual/`.

### Changed

- `:focus-visible` outline is now `$fmup-text` with a yellow
  `box-shadow` glow. Pure yellow on white was 1.4:1 and failed WCAG
  1.4.11; brand cue preserved through the glow.
- Code-block and inline-code backgrounds use `$fmup-surface-strong`
  instead of `$fmup-surface` for visible distinction from body.
- Removed `lang: pt-PT` from the `common` format defaults. Consumers
  must set `lang:` in their own project YAML; the bundled `example/`
  projects do so explicitly.
- Bumped extension version to `1.1.0` (additive minor release).

### Fixed

- Table zebra striping was effectively invisible
  (`lighten($fmup-surface, 1.5%)` rounded to ~`#F9F9F9` against
  `#FFFFFF`). Striping now uses `$fmup-surface` directly.
- Selector form `[href*="//localhost"]` triggered Quarto's css-vars
  analyser to treat `//` as a comment and abort. Now
  `[href*="localhost"]`.

### Font-rendering fix (post-Tier-4 follow-up)

- **`fmup-fonts.css` had `//` SCSS comments at the top.** Browsers'
  CSS parser does not accept `//` comments and bailed before reaching
  the `@font-face` declarations, so Atkinson Hyperlegible Next never
  registered. Body text everywhere fell back to system-ui. Comments
  converted to `/* ... */`.
- **Reveal's `css:` key does NOT copy the linked file into the output
  bundle** (HTML format does; reveal does not). The reveal preview
  worked locally because the in-source `_extensions` symlink resolved,
  but any shared `slides.html` 404'd the font CSS. Reveal now uses
  `include-in-header: [fmup-fonts.html]` - a `<style>`-wrapped copy
  of the font payload that lands inline in `<head>`. Single-file
  decks are now genuinely self-contained.

### Dark-mode fixes (post-Tier-4 follow-up)

- **Callout headers**: Quarto core CSS paints the WHOLE `.callout-header`
  bar, not just the inner `.callout-title`. Earlier overrides targeted
  only `.callout-title`, so in dark mode the Bootstrap defaults
  (blue for note, green for tip) bled through visibly. Both selectors
  are now in `partials/_callouts.scss` and `partials/_callouts-revealjs.scss`.
- **Table header**: was `background: $fmup-text`, which flipped to
  `#F2F2F2` in dark mode, leaving yellow text on near-white background
  (1.4:1, fails WCAG). Pinned to literal `#1A1A1A` / `#FFCD00` (with
  `!important` for HTML) since the institutional table band is
  identity-preserving across modes.
- **Syntax highlighting**: Pandoc `.theme` files are static JSON and do
  not react to `data-bs-theme`. Added `fmup-highlight-dark.theme` with
  the dark palette colours and wired
  `highlight-style: { light: fmup-highlight.theme, dark: fmup-highlight-dark.theme }`
  for the HTML format. Code blocks in dark mode now read as
  `#F2F2F2` text on `#242424` surface, with yellow keyword accent and
  `#F87171` for errors / alerts.

### Known issues

- Typst PDF render emits "variable fonts are not currently supported"
  warnings (Typst <= 0.14.x limitation; falls back silently). Users
  who want institutional fonts in PDF should install the static-weight
  TTF files system-wide or override `mainfont` in their Typst block.
- Quarto's css-vars analyser cannot extract `--`-exported colour vars
  when the SCSS rules block contains the universal selector inside an
  `@media` query, so the reduced-motion clamp is intentionally scoped
  to `html` only.

## [1.0.14] - 2025
- Callout selectors now target `.callout-title`; smaller footer font.

## [1.0.13] - 2025
- Enable reveal's `center: true` by default for the `fmup-revealjs` format.

## [1.0.12] - 2025
- Belt-and-braces footer-paragraph centring (`width: 100%` + `text-align`)
  to defeat Quarto's `support.js` inlining `display: block` at deck-ready.

## [1.0.11] - 2025
- Baseline-align `.reveal .slide-number` with the footer text by sharing
  font size, padding, and `bottom` offset.

## [1.0.10] - 2025
- Pin `text-align: center` with `!important` on `.footer` and its inner
  `<p>` so the inline-style override from `support.js` does not clobber it.

## [1.0.9] - 2025
- Place `.reveal .slide-number` on the same horizontal line as the
  footer text.

## [1.0.8] - 2025
- Footer flex-centring (text-align alone was being inherited away).

## [1.0.7] - 2025
- Footer horizontal centring (box-sizing fix).

## [1.0.6] - 2025
- Rewrite reveal.js SCSS as paint-only. No layout overrides on
  `#title-slide` or `section.center` - reveal owns layout, the theme
  only owns colour and typography.

## [1.0.5] - 2025
- Hotfix: empty-slides regression introduced by an earlier
  layout-override attempt.

## [1.0.4] - 2025
- Smaller slide font; redesigned title slide; callouts in the reveal
  format.

## [1.0.3] - 2025
- Callout overrides require `!important` to beat Quarto's core CSS,
  which loads after theme SCSS.
- Simplify README: install + three copy-paste YAML snippets.

## [1.0.2] - 2025
- Fix section-divider centring, footer layout, drop auto-TOC.

## [1.0.1] - 2025
- Fix font loading; scope prose underlines to `main`/`article`; tone
  callout palette; slide-chrome cleanup.

## [1.0.0] - 2025
- Initial release: `fmup-html`, `fmup-revealjs`, `fmup-typst` formats.

[Unreleased]: https://github.com/tiagojct/quarto-fmup/compare/v1.0.14...HEAD
[1.0.14]: https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.14
[1.0.13]: https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.13
[1.0.12]: https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.12
[1.0.11]: https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.11
[1.0.10]: https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.10
[1.0.9]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.9
[1.0.8]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.8
[1.0.7]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.7
[1.0.6]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.6
[1.0.5]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.5
[1.0.4]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.4
[1.0.3]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.3
[1.0.2]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.2
[1.0.1]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.1
[1.0.0]:  https://github.com/tiagojct/quarto-fmup/releases/tag/v1.0.0
