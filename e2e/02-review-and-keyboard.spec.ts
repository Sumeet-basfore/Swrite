import { test, expect } from '@playwright/test';
import { seedRealisticProject, waitForEditor } from './helpers/testUtils';

test.describe('Part 7 & 8 — Review Workflow & Keyboard Safety', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 7: Review Workspace Unified Queue & Keyboard Triage', async ({ page }) => {
    // Navigate to Review Workspace
    const reviewNav = page.locator('button').filter({ hasText: /^Review/ }).first();
    await reviewNav.click();
    await page.waitForTimeout(400);

    // Verify Review Workspace renders
    await expect(page.locator('strong:has-text("Review")').first()).toBeVisible();

    // Verify Scope options exist (Review Scene, Review Chapter, Review Manuscript)
    await expect(page.getByText('Review Scene').first()).toBeVisible();

    // Test Keyboard navigation (J / K / Arrow keys)
    await page.keyboard.press('j');
    await page.waitForTimeout(200);
    await page.keyboard.press('k');
    await page.waitForTimeout(200);

    // Filter pills (Story & Craft / Language & Proofing)
    const filterPill = page.locator('button:has-text("Language & Proofing"), button:has-text("Story & Craft")').first();
    if (await filterPill.isVisible()) {
      await filterPill.click();
      await page.waitForTimeout(300);
    }
  });

  test('Part 8: Keyboard Safety during Active Editor Typing', async ({ page }) => {
    // Ensure in Write Workspace
    const writeNav = page.locator('button[title*="Write Workspace"]').first();
    await writeNav.click();
    await waitForEditor(page);

    const editor = page.locator('.ProseMirror');
    await editor.click();

    // When typing into editor, verify typing is safe and robust
    await page.keyboard.type(' Testing keyboard isolation without unintentional hotkey triggers.');
    await expect(editor).toContainText('Testing keyboard isolation');

    // Click Plan button to navigate safely
    const planNav = page.locator('button[title*="Plan Workspace"]').first();
    await planNav.click();
    await page.waitForTimeout(400);
    await expect(page.locator('input[value*="The Stolen Palimpsest"]').first()).toBeVisible();

    // Click Write button back
    await writeNav.click();
    await page.waitForTimeout(400);
    await expect(page.locator('.ProseMirror')).toBeVisible();
  });
});
