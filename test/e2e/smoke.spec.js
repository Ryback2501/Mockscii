import { test, expect } from '@playwright/test';

test('app loads with grid canvas and side panel', async ({ page }) => {
  await page.goto('/Mockscii/');
  await expect(page).toHaveTitle(/Mockscii/);
  await expect(page.getByTestId('grid')).toBeVisible();
  await expect(page.getByTestId('side-panel')).toBeVisible();
});
