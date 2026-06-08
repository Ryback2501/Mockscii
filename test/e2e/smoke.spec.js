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

test('palette assigns a colour id to the active channel', async ({ page }) => {
  await page.goto('/Mockscii/');
  const swatches = page.getByTestId('palette').locator('button.swatch');
  const color = await swatches.nth(3).getAttribute('aria-label');
  await swatches.nth(3).click();
  // The channel stores a palette colour id that resolves back to the swatch colour.
  const resolved = await page.evaluate(() =>
    window.__mockscii.palette.colorOf(window.__mockscii.tools.fg),
  );
  expect(resolved).toBe(color);
});

test('clicking the selected swatch again deselects it back to the default', async ({ page }) => {
  await page.goto('/Mockscii/');
  const swatch = page.getByTestId('palette').locator('button.swatch').nth(3);

  await swatch.click();
  const picked = await page.evaluate(() => window.__mockscii.tools.fg);
  expect(picked).not.toBeNull();

  await swatch.click(); // click again -> deselect
  const reverted = await page.evaluate(() => window.__mockscii.tools.fg);
  expect(reverted).toBeNull(); // no id -> default colour at render time
  await expect(page.getByTestId('palette').locator('.swatch.selected')).toHaveCount(0);
});

test('the + button opens the colour picker modal', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page.getByTestId('palette').locator('.palette-add').click();
  await expect(page.getByTestId('color-picker')).toBeVisible();
  await page.getByTestId('color-picker').locator('.cp-cancel').click();
  await expect(page.getByTestId('color-picker')).toHaveCount(0);
});

test('undo and redo a painted cell via keyboard', async ({ page }) => {
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

  await page.keyboard.press('Control+z');
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);

  await page.keyboard.press('Control+y');
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(1);
});

test('copy and paste a selection', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page
    .getByTestId('glyph-selector')
    .locator('button.glyph', { hasText: '#' })
    .first()
    .click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  const cell = await page.evaluate(() => window.__mockscii.grid.grid.cell);
  const at = (c, r) => ({ x: box.x + (c + 0.5) * cell.width, y: box.y + (r + 0.5) * cell.height });

  // Paint two adjacent cells.
  await page.mouse.click(at(5, 5).x, at(5, 5).y);
  await page.mouse.click(at(6, 5).x, at(6, 5).y);
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(2);

  // Select them, copy, then paste at a different spot.
  await page.getByTestId('toolbar').locator('.tool-select').click();
  await page.mouse.move(at(5, 5).x, at(5, 5).y);
  await page.mouse.down();
  await page.mouse.move(at(6, 5).x, at(6, 5).y);
  await page.mouse.up();
  await page.keyboard.press('Control+c');
  await page.mouse.move(at(10, 10).x, at(10, 10).y);
  await page.keyboard.press('Control+v');

  const res = await page.evaluate(() => ({
    size: window.__mockscii.cells.size,
    a: window.__mockscii.cells.has(10, 10),
    b: window.__mockscii.cells.has(11, 10),
  }));
  expect(res.size).toBe(4);
  expect(res.a).toBe(true);
  expect(res.b).toBe(true);
});

test('text tool types characters onto the grid', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page.getByTestId('toolbar').locator('.tool-text').click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 50, box.y + 50); // drop the caret
  await page.keyboard.type('hello');

  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(5);
});

test('rectangle tool stamps a hollow box', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page
    .getByTestId('glyph-selector')
    .locator('button.glyph', { hasText: '#' })
    .first()
    .click();
  await page.getByTestId('toolbar').locator('.tool-rect').click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  const cell = await page.evaluate(() => window.__mockscii.grid.grid.cell);
  const at = (c, r) => ({ x: box.x + (c + 0.5) * cell.width, y: box.y + (r + 0.5) * cell.height });

  const a = at(3, 3);
  const b = at(7, 6);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y);
  await page.mouse.up();

  const res = await page.evaluate(() => ({
    size: window.__mockscii.cells.size,
    center: window.__mockscii.cells.has(5, 4),
  }));
  expect(res.size).toBe(2 * (5 + 4) - 4); // perimeter of a 5x4 box = 14
  expect(res.center).toBe(false); // hollow
});

test('eraser tool removes a painted cell', async ({ page }) => {
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

  await page.getByTestId('toolbar').locator('.tool-erase').click();
  await page.mouse.click(box.x + 60, box.y + 60);
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);
});

test('clear wipes the canvas and undo brings it back', async ({ page }) => {
  await page.goto('/Mockscii/');
  await page
    .getByTestId('glyph-selector')
    .locator('button.glyph', { hasText: '#' })
    .first()
    .click();

  const canvas = page.getByTestId('grid');
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 60, box.y + 60);
  await page.mouse.click(box.x + 90, box.y + 60);
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(2);

  await page.getByTestId('toolbar').locator('.tool-clear').click();
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);

  await page.keyboard.press('Control+z');
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(2);
});

test('export then import restores the painted cells', async ({ page }) => {
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

  // Export captures a JSON download.
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('io-controls').locator('.io-export').click();
  const download = await downloadPromise;
  const path = await download.path();

  // Reload wipes the in-memory state, then import restores it.
  await page.reload();
  expect(await page.evaluate(() => window.__mockscii.cells.size)).toBe(0);

  await page.getByTestId('io-controls').locator('input[type=file]').setInputFiles(path);
  await expect.poll(() => page.evaluate(() => window.__mockscii.cells.size)).toBe(1);
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
