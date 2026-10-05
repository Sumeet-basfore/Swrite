import { test, expect } from '@playwright/test';
import { seedRealisticProject, waitForEditor, getPersistedProject } from './helpers/testUtils';

test.describe('Part 15 & 16 — Appearance & Publication Studio', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 15: Appearance Theme & Typography Switching', async ({ page }) => {
    // Open Theme selector via header button
    const themeBtn = page.locator('button[title="Theme & Typography Settings"]').first();
    await themeBtn.click();
    await page.waitForTimeout(400);

    // Verify Theme modal opens with tabs
    await expect(page.locator('button:has-text("Themes")').first()).toBeVisible();

    // Click on Themes tab
    const themesTab = page.locator('button:has-text("Themes")').first();
    await themesTab.click();
    await page.waitForTimeout(300);

    // Verify theme categories appear
    await expect(page.locator('button:has-text("All Themes")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Dark / Ink")').first()).toBeVisible();
  });

  test('Part 16: Publication Studio & Export Profiles', async ({ page }) => {
    // Open Publication Studio via TopHeader button
    const exportBtn = page.locator('button[title="Compile & Export Manuscript"], button:has-text("Export")').first();
    await exportBtn.click();
    await page.waitForTimeout(500);

    // Verify Publication Studio modal renders with standard presets
    await expect(page.getByText('Publication & Export Studio').first()).toBeVisible();
    await expect(page.getByText('Trade Paperback').first()).toBeVisible();
  });
});
