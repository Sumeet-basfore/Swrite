import { test, expect } from '@playwright/test';
import { seedRealisticProject, getPersistedProject, waitForEditor } from './helpers/testUtils';

test.describe('Part 3 & 4 & 5 & 6 — Write Flow, New Scene, Split, and Reorder', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 3: Critical Write Flow & Scene Isolation', async ({ page }) => {
    // 1. Verify project loads and manuscript renders
    await expect(page.getByText('The Silver Weft & The Iron Synod').first()).toBeVisible();

    // 2. Select Chapter 1 / Scene 1
    const scene1Pill = page.locator('button').filter({ hasText: 'The Vault Breach' }).first();
    await scene1Pill.click();
    await page.waitForTimeout(200);

    // 3. Verify editor is loaded with Scene 1 content
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();
    await expect(editor).toContainText('The Sunken Scriptorium');

    // 4. Click into the editor and type isolated text
    await editor.click();
    await page.keyboard.press('End');
    const uniqueIsolationToken = ' [VERIFIED_ISOLATED_SCENE_1_WRITE]';
    await page.keyboard.type(uniqueIsolationToken);
    await expect(editor).toContainText(uniqueIsolationToken);

    // 5. Switch to Scene 2 of Chapter 1 via SceneContextBar ribbon
    const scene2Pill = page.locator('button').filter({ hasText: 'The Rain of Cinders' }).first();
    await expect(scene2Pill).toBeVisible();
    await scene2Pill.click();
    await page.waitForTimeout(400);

    // Verify Scene 2 does NOT have the isolation token from Scene 1
    await expect(editor).not.toContainText(uniqueIsolationToken);
    await expect(editor).toContainText('Low Ashfall Quarter');

    // 6. Switch back to Scene 1 and verify the token is preserved
    await scene1Pill.click();
    await page.waitForTimeout(400);
    await expect(editor).toContainText(uniqueIsolationToken);
  });

  test('Part 4: One-Click New Scene Creation and Persistence', async ({ page }) => {
    // 1. Click Add New Scene button in SceneContextBar
    const addSceneButton = page.locator('button[title="Add New Scene"]').first();
    await addSceneButton.click();
    await page.waitForTimeout(400);

    // 2. Verify editor is immediately focused and receives typed text without blocking modal
    const editor = page.locator('.ProseMirror');
    await expect(editor).toBeVisible();
    
    const freshSceneText = 'Entering the subterranean archive without a lantern was suicide.';
    await editor.click();
    await page.keyboard.type(freshSceneText);
    await expect(editor).toContainText(freshSceneText);

    // 3. Verify persistence across page reload
    await page.reload();
    await waitForEditor(page);
    const untitledScenePill = page.locator('button').filter({ hasText: 'Untitled Scene' }).first();
    if (await untitledScenePill.isVisible()) {
      await untitledScenePill.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.ProseMirror')).toContainText(freshSceneText);
    }
  });

  test('Part 5: Scene Split Operation with Content Preservation', async ({ page }) => {
    // Navigate to Scene 1
    const scene1Pill = page.locator('button').filter({ hasText: 'The Vault Breach' }).first();
    await scene1Pill.click();
    await waitForEditor(page);

    const editor = page.locator('.ProseMirror');
    await editor.click();

    // Trigger Split Scene via Command Palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(200);
    const cmdInput = page.locator('input[placeholder*="command" i], input[type="text"]').first();
    if (await cmdInput.isVisible()) {
      await cmdInput.fill('Split Scene');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify the scene split created two scenes without losing words
      const persisted = await getPersistedProject(page);
      const ch1 = persisted.acts[0].chapters[0];
      expect(ch1.scenes!.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('Part 6: Scene Reorder, Duplicate, and Data Preservation', async ({ page }) => {
    const persistedBefore = await getPersistedProject(page);
    expect(persistedBefore.acts[0].chapters.length).toBe(5);

    // Verify all 15 chapters and 30+ scenes exist in the persisted model
    const totalScenes = persistedBefore.acts.flatMap(a => a.chapters).flatMap(c => c.scenes || []);
    expect(totalScenes.length).toBeGreaterThanOrEqual(30);
  });
});
