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

  // Drop the platform suffix from snapshot filenames so darwin and
  // linux chromium share one baseline per (test, project) pair. The
  // wider maxDiffPixelRatio absorbs cross-OS font-hinting jitter
  // without missing genuine visual regressions.
  snapshotPathTemplate: '{snapshotDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
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
