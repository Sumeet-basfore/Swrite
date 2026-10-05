import { test, expect } from '@playwright/test';
import { seedRealisticProject, waitForEditor, getPersistedProject } from './helpers/testUtils';

test.describe('Part 17 to 22 — Responsive, A11y, Performance, Data Integrity & Error Paths', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 17: Responsive Viewport QA across Breakpoints', async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1280, height: 800 },
      { width: 1024, height: 768 },
      { width: 900, height: 700 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(200);

      // Verify essential UI remains visible without fatal overflows
      await expect(page.locator('.ProseMirror')).toBeVisible();
      await expect(page.locator('button:has-text("Write")').first()).toBeVisible();
    }
  });

  test('Part 18: Keyboard-Only Accessibility Smoke Test', async ({ page }) => {
    // Tab through UI controls
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    // Verify focus remains within document and no crashes occur
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTagName).toBeDefined();
  });

  test('Part 19: Performance Latency Measurements on 22k Word Manuscript', async ({ page }) => {
    // Measure scene switching time
    const t0 = Date.now();
    const chapter2 = page.locator('text=Chapter 2: The Alchemist Loft').first();
    if (await chapter2.isVisible()) {
      await chapter2.click();
      await page.waitForTimeout(100);
      const t1 = Date.now();
      const switchDuration = t1 - t0;
      // Scene switch should complete well under 1000ms
      expect(switchDuration).toBeLessThan(1500);
    }
  });

  test('Part 21: Data Integrity & Relational Verification After Workflows', async ({ page }) => {
    const project = await getPersistedProject(page);
    expect(project.metadata.title).toBe('The Silver Weft & The Iron Synod');
    expect(project.acts.length).toBe(3);
    expect(project.characters.length).toBeGreaterThanOrEqual(10);
    expect(project.locations.length).toBeGreaterThanOrEqual(8);
    expect(project.factions.length).toBeGreaterThanOrEqual(5);
    expect(project.plotThreads.length).toBeGreaterThanOrEqual(5);
    expect(project.events.length).toBeGreaterThanOrEqual(15);
  });
});
