import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Resolve `_site/_book/slides` outputs as file:// URLs so the suite
// runs without a local web server. Playwright reads them straight off
// disk; relative asset paths in the rendered HTML still resolve.

const root = resolve(__dirname, '..', '..');
const url  = (p: string) => pathToFileURL(resolve(root, p)).toString();

test.describe('site', () => {
  test('home', async ({ page }) => {
    await page.goto(url('example/site/_site/index.html'));
    await expect(page).toHaveScreenshot('site-home.png', { fullPage: true });
  });

  test('about', async ({ page }) => {
    await page.goto(url('example/site/_site/sobre.html'));
    await expect(page).toHaveScreenshot('site-about.png', { fullPage: true });
  });
});

test.describe('book', () => {
  test('intro', async ({ page }) => {
    await page.goto(url('example/book/_book/intro.html'));
    await expect(page).toHaveScreenshot('book-intro.png', { fullPage: true });
  });

  test('typography', async ({ page }) => {
    await page.goto(url('example/book/_book/tipografia.html'));
    await expect(page).toHaveScreenshot('book-tipografia.png', { fullPage: true });
  });
});

test.describe('slides', () => {
  test('title-slide', async ({ page }) => {
    await page.goto(url('example/slides/slides.html'));
    // Reveal needs a beat to hydrate before the first slide settles
    // into its final layout; without this, screenshots capture the
    // pre-hydration layout and drift between runs.
    await page.waitForFunction(() => (window as any).Reveal && (window as any).Reveal.isReady && (window as any).Reveal.isReady());
    await expect(page).toHaveScreenshot('slides-title.png');
  });

  test('callouts-slide', async ({ page }) => {
    // pathToFileURL percent-encodes `#`; append the reveal hash AFTER
    // building the file URL so reveal interprets it as a slide index.
    await page.goto(url('example/slides/slides.html') + '#/10');
    await page.waitForFunction(() => (window as any).Reveal && (window as any).Reveal.isReady && (window as any).Reveal.isReady());
    await expect(page).toHaveScreenshot('slides-callouts.png');
  });
});
