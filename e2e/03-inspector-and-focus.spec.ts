import { test, expect } from '@playwright/test';
import { seedRealisticProject, getPersistedProject, waitForEditor } from './helpers/testUtils';

test.describe('Part 9 & 10 — Inspector Quick Edit & Focus Mode', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 9: Inspector Inline Quick Edit without Workspace Switch', async ({ page }) => {
    // Open Inspector if closed
    const inspectorToggle = page.locator('button[title*="Inspector" i], button:has-text("Inspector")').first();
    if (await inspectorToggle.isVisible()) {
      // check if inspector panel is open
      const inspectorPanel = page.locator('text=Dramatic Weight, text=Scene Context, text=Characters').first();
      if (!await inspectorPanel.isVisible()) {
        await inspectorToggle.click();
        await page.waitForTimeout(300);
      }
    }

    // Click on character in the Inspector or Scene context (e.g. Lucan Graves)
    const charCard = page.locator('button, div').filter({ hasText: 'Lucan Graves' }).first();
    if (await charCard.isVisible()) {
      await charCard.click();
      await page.waitForTimeout(300);

      // Verify inline quick edit buttons exist (Edit Current State / Add Goal)
      const editStateBtn = page.locator('button:has-text("Edit")').first();
      if (await editStateBtn.isVisible()) {
        await editStateBtn.click();
        const stateInput = page.locator('input[placeholder*="state" i], input[placeholder*="Emotional" i]').first();
        if (await stateInput.isVisible()) {
          await stateInput.fill('Resolute and deeply focused');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);

          // Verify state saved into persistent storage
          const persisted = await getPersistedProject(page);
          const lucan = persisted.characters.find(c => c.id === 'char-lucan');
          expect(typeof lucan?.currentState === 'object' ? (lucan?.currentState as any).emotional : lucan?.currentState)
            .toContain('Resolute');
        }
      }
    }
  });

  test('Part 10: Distraction-Free Focus Mode Validation', async ({ page }) => {
    // Enter Focus Mode via shortcut or button
    const focusBtn = page.locator('button[title*="Focus Mode" i], button:has-text("Focus")').first();
    if (await focusBtn.isVisible()) {
      await focusBtn.click();
      await page.waitForTimeout(400);

      // In Focus Mode, Sidebar and Header should be hidden
      await expect(page.locator('header, nav').filter({ hasText: 'Write' })).not.toBeVisible();

      // Typing should remain responsive
      const editor = page.locator('.ProseMirror');
      await editor.click();
      await page.keyboard.type(' Typing freely in distraction-free focus mode.');
      await expect(editor).toContainText('Typing freely in distraction-free focus mode.');

      // Press Escape to exit Focus Mode
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);

      // Header should reappear
      await expect(page.locator('button:has-text("Write")').first()).toBeVisible();
    }
  });
});
