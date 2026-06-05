import { test, expect } from '@playwright/test';

test('app loads with grid canvas and side panel', async ({ page }) => {
  await page.goto('/Mockscii/');
  await expect(page).toHaveTitle(/Mockscii/);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.getByTestId('side-panel')).toBeVisible();
  await expect(page.getByTestId('app-title')).toHaveText('Mockscii');
});

test('choosing a font applies it globally', async ({ page }) => {
  await page.goto('/Mockscii/');
  const select = page.getByTestId('font-control').locator('select');
  await select.selectOption({ label: 'Fira Code' });

  const font = await page.evaluate(() => window.__mockscii.tools.font);
  expect(font).toContain('Fira Code');

  const cssVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--mock-font').trim(),
  );
  expect(cssVar).toContain('Fira Code');
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

test('select mode: select a painted cell and delete it', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page
    .getByTestId('glyph-selector')
    .locator('button.glyph', { hasText: '#' })
    .first()
    .click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 60, box.y + 60);
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(1);

  // Switch to select mode, select the painted cell, delete it.
  await page.getByTestId('toolbar').locator('.tool-select').click();
  await page.mouse.click(box.x + 60, box.y + 60);
  expect(await page.evaluate(() => window.__mockscii.selection.keys.size)).toBeGreaterThan(0);

  await page.keyboard.press('Delete');
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);
});

test('select mode suppresses painting', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page.getByTestId('toolbar').locator('.tool-select').click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 80, box.y + 80);

  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);
});

test('palette assigns a colour to the active channel', async ({ page }) => {
  await page.goto('/Mockscii/');
  const swatches = page.getByTestId('palette').locator('button.swatch');
  const color = await swatches.nth(3).getAttribute('aria-label');
  await swatches.nth(3).click();
  expect(await page.evaluate(() => window.__mockscii.tools.fg)).toBe(color);
});

test('clicking the selected swatch again deselects it back to the default', async ({ page }) => {
  await page.goto('/Mockscii/');
  const swatch = page.getByTestId('palette').locator('button.swatch').nth(3);

  await swatch.click();
  const picked = await page.evaluate(() => window.__mockscii.tools.fg);
  expect(picked).not.toBe('#d4d4d4');

  await swatch.click(); // click again -> deselect
  const reverted = await page.evaluate(() => window.__mockscii.tools.fg);
  expect(reverted).toBe('#d4d4d4');
  await expect(page.getByTestId('palette').locator('.swatch.selected')).toHaveCount(0);
});

test('the + button opens the colour picker modal', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page.getByTestId('palette').locator('.palette-add').click();
  await expect(page.getByTestId('color-picker')).toBeVisible();
  await page.getByTestId('color-picker').locator('.cp-cancel').click();
  await expect(page.getByTestId('color-picker')).toHaveCount(0);
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
