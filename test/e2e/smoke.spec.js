import { test, expect } from '@playwright/test';

test('app loads with grid canvas and side panel', async ({ page }) => {
  await page.goto('/Mockscii/');
  await expect(page).toHaveTitle(/Mockscii/);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.getByTestId('side-panel')).toBeVisible();
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
