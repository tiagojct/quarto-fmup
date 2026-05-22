import { defineConfig, devices } from '@playwright/test';

// Visual-regression scaffold for the quarto-fmup theme.
//
// Run order (CI or local):
//   1. quarto render example/site
//   2. quarto render example/book
//   3. quarto render example/slides/slides.qmd
//   4. npx playwright test tests/visual
//
// Baselines live under tests/visual/__snapshots__/. First-time run with
// --update-snapshots seeds them. Subsequent runs fail on any pixel
// drift over the threshold below. Workflow render-examples.yml uploads
// the diff artefacts for inspection.

export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  snapshotDir: './__snapshots__',
  fullyParallel: false, // deterministic order keeps snapshots stable

  expect: {
    toHaveScreenshot: {
      // 0.2% pixel-diff tolerance absorbs sub-pixel anti-aliasing and
      // font-rendering jitter between OS / chromium minor versions
      // without missing visual regressions.
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },

  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2, // crisp HiDPI baselines
    colorScheme: 'light',
  },

  projects: [
    {
      name: 'chromium-light',
      use: { ...devices['Desktop Chrome'], colorScheme: 'light' },
    },
    {
      name: 'chromium-dark',
      use: { ...devices['Desktop Chrome'], colorScheme: 'dark' },
    },
  ],
});
