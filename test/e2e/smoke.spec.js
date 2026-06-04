import { test, expect } from '@playwright/test';

test('app loads with grid canvas and side panel', async ({ page }) => {
  await page.goto('/Mockscii/');
  await expect(page).toHaveTitle(/Mockscii/);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.getByTestId('side-panel')).toBeVisible();
});

test('glyph selector renders and a glyph can be picked', async ({ page }) => {
  await page.goto('/Mockscii/');
  const selector = page.getByTestId('glyph-selector');
  await expect(selector).toBeVisible();

  const glyphs = selector.locator('button.glyph');
  expect(await glyphs.count()).toBeGreaterThan(50);

  const at = selector.locator('button.glyph', { hasText: '@' });
  await at.click();
  await expect(at).toHaveClass(/selected/);
});

test('clicking the grid paints a cell with the selected glyph', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page
    .getByTestId('glyph-selector')
    .locator('button.glyph', { hasText: '#' })
    .first()
    .click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 60, box.y + 60);

  const size = await page.evaluate(() => window.__mockscii.cells.size);
  expect(size).toBeGreaterThan(0);
});

test('select mode suppresses painting', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page.getByTestId('toolbar').locator('.tool-select').click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 80, box.y + 80);

  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);
});

test('canvas auto-fits the grid area', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/Mockscii/');

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  // The grid fills everything left of the 260px side panel.
  expect(box.width).toBeGreaterThan(800);
  expect(box.height).toBeGreaterThan(600);

  // The backing buffer is sized (auto-fit ran), not the default 300x150.
  const buffer = await canvas.evaluate((el) => ({ w: el.width, h: el.height }));
  expect(buffer.w).toBeGreaterThan(300);
  expect(buffer.h).toBeGreaterThan(150);
});
