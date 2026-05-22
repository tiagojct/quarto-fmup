# Contributing to quarto-fmup

Thanks for considering a contribution. This file tells you how to
develop, test, and ship changes to the theme without breaking what is
already working.

## Local setup

Requirements:

- Quarto **>= 1.4** (the theme uses `theme: { light, dark }`).
- Typst is bundled with Quarto for the PDF format; nothing extra to install.
- For visual-regression tests: Node 20+, then `cd tests/visual && npm install && npx playwright install chromium`.

Clone, then render any of the three example projects against your
local checkout - the `_extensions/fmup/` directory is auto-resolved
because each example contains a `_extensions` symlink pointing at the
repo root:

```sh
cd example/site   && quarto preview
cd example/book   && quarto preview
cd example/slides && quarto preview slides.qmd
```

Edits to SCSS / Lua / Typst files in `_extensions/fmup/` are picked up
on the next render.

## Project shape

```
_extensions/fmup/                      Extension contents
├── _extension.yml                     Format contributions
├── fmup.scss                          HTML format SCSS manifest
├── fmup-revealjs.scss                 Reveal.js SCSS manifest
├── fmup-variables.scss                Design tokens (light)
├── fmup-variables-dark.scss           Design tokens (dark)
├── fmup-fonts.css                     Self-hosted woff2 (base64)
├── fmup-typst.typ                     Typst style partial
├── fmup-highlight.theme               Pandoc syntax-highlighting theme
├── fmup.lua                           Logo forwarding + OG / Twitter meta
├── partials/_callouts.scss            HTML callouts
├── partials/_callouts-revealjs.scss   Reveal callouts
└── fonts/                             Raw woff2 (provenance for the base64)
docs/                                  Dogfooded documentation site
example/{site,book,slides}/            Reference projects + manual test bed
tests/visual/                          Playwright visual-regression scaffold
.github/workflows/                     CI (render-examples, visual-regression, publish-docs)
```

## Design rules (the "scars")

These are not preferences. They are bugs that were fixed once and will
come back if you re-introduce the pattern. The full register lives at
[`docs/design-scars.qmd`](docs/design-scars.qmd); short version:

1. **Reveal owns slide layout.** Do not override `display`,
   `position`, or `height` on `#title-slide` or `section.center` in
   `fmup-revealjs.scss`. Centre via reveal's own `center: true`.
2. **Callout overrides need `!important`.** Quarto's core CSS loads
   after theme SCSS. No other reliable hook exists.
2b. **`.callout-header` AND `.callout-title` both need the
   background-color override.** Quarto core paints the wrapping
   `.callout-header` bar, not the inner `.callout-title`; missing the
   first selector lets the Bootstrap defaults bleed through in dark
   mode (note blue, tip green).
2c. **Table thead pinned to literal `#1A1A1A` / `#FFCD00`.** Using
   `$fmup-text` flips to near-white in dark mode and the yellow text
   on near-white falls to 1.4:1 (WCAG fail). The institutional
   dark-band header is identity-preserving across modes.
3. **The reveal footer needs `text-align: center !important` on both
   `.footer` and the inner `<p>`.** Quarto's `support.js` inline-styles
   `display: block` at deck-ready time, killing any flex centring.
4. **`.reveal .slide-number` shares font-size, padding and `bottom`
   with `.reveal .footer` text.** Drift breaks the baseline alignment.
5. **Page-grid widening** lives on `.page-columns`, not on
   `.sidebar`. Touching only the sidebar overlaps the content column.
6. **Prose link styling is scoped to
   `main / .content / article / .quarto-document-content`** and
   excludes `.citation`, `.no-underline`, anchor / footnote refs.
7. **Self-hosted fonts ship via `css:` (HTML) and `include-in-header`
   (reveal), never via `theme:`.** Quarto's css-vars analyser
   mis-parses base64 data URIs in the theme pipeline; reveal's `css:`
   adds a `<link>` but does NOT copy the file into the output bundle,
   so a shared deck 404s its fonts.
7b. **`.css` files use `/* */` comments only.** Browsers' CSS parser
   does not understand `//` comments; if the file starts with `//`
   header comments (common SCSS habit after renaming), the parser
   bails and every subsequent `@font-face` declaration is silently
   discarded.
7c. **`.gitignore` `*.<ext>` rules at the root SILENTLY swallow
   assets inside `_extensions/`.** v1.2.0 shipped without
   `fmup-fonts.html` because the build-artefact `*.html` glob
   matched it. Always negate explicitly
   (`!_extensions/fmup/fmup-fonts.html`) for any asset whose
   extension overlaps a build glob. Verify with
   `git ls-files _extensions/fmup/ | grep <file>` BEFORE tagging a
   release.
8. **Attribute selector values must not contain `//`.** The css-vars
   analyser treats `//` as a comment start even inside strings.
9. **`include-in-header` does not interpolate Pandoc templates.** Use
   `fmup.lua` and `quarto.doc.include_text` for templated meta tags.
10. **Typst variable fonts** warn and may fall back. Document, do not
    silence.
11. **Syntax highlighting needs separate light + dark `.theme` files.**
    Pandoc `.theme` is static JSON, not data-bs-theme aware. Ship
    `fmup-highlight.theme` + `fmup-highlight-dark.theme` and declare
    `highlight-style: { light, dark }`.

Edits that re-introduce any of the above will get the same one-line
review comment: *"design scar #N, see CONTRIBUTING."*

## Making a change

1. Branch from `main`. Name format: `fix/<short-desc>`, `feat/<short-desc>`, or `docs/<short-desc>`.
2. Edit. Render all three examples locally and visually verify.
3. Update `CHANGELOG.md` under `## [Unreleased]`.
4. If touching tokens, add or update the `## Decisões do tema` table in `docs/accessibility.qmd` with the new contrast ratios.
5. Open a PR. The `render-examples` workflow runs all three example renders; `visual-regression` snapshots them against committed baselines.

### Commit messages

Convention from `git log`:

```
v<X.Y.Z>: <short imperative summary>          (release commits, tag-the-commit)
<short imperative summary>                    (any other commit)
```

No `feat:` / `fix:` prefix; no Conventional Commits scope. Keep
subjects under 70 chars.

## Releasing

1. Bump `version:` in `_extensions/fmup/_extension.yml`.
2. Move the `[Unreleased]` section of `CHANGELOG.md` to a new
   `[X.Y.Z] - YYYY-MM-DD` heading and add fresh empty `[Unreleased]`
   subsections.
3. Commit as `vX.Y.Z: <one-line summary>`.
4. Tag `vX.Y.Z` (the tag, not just the version - `quarto add /
   update` resolves to git tags).
5. Push commit + tag. `publish-docs.yml` deploys the updated docs site.

### Version bump guidance

- **PATCH** (`1.1.x`): visual fixes, doc corrections, internal
  refactors that do not change the SCSS public surface.
- **MINOR** (`1.x.0`): new tokens, new partials, new YAML keys (e.g.
  `fmup.logo`), additive Lua filter capabilities.
- **MAJOR** (`x.0.0`): rename or remove a token, restructure
  `_extension.yml` keys that downstream theme: lists rely on, change
  the SCSS partial folder layout.

## Visual-regression baselines

Baseline PNGs live under
[`tests/visual/__snapshots__/`](tests/visual/__snapshots__/). They are
populated on first run with `npx playwright test --update-snapshots`
(local) and committed to git. CI fails on any pixel drift over the
`maxDiffPixelRatio: 0.002` threshold.

If you intentionally change visuals:

```sh
cd tests/visual
npx playwright test --update-snapshots
git add __snapshots__
```

Mention the visual change in the PR description so reviewers know to
expect new baselines.

## License

MIT for SCSS, Typst config, Lua filters, and example projects. The
FMUP institutional identity (yellow tile mark, FMUP wordmark, faculty
name) is not licensed to third parties through this repository. For
unrelated work, change the palette.
