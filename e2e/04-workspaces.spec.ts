import { test, expect } from '@playwright/test';
import { seedRealisticProject, waitForEditor, getPersistedProject } from './helpers/testUtils';

test.describe('Part 11, 12, 13, 14 — Plan, Story, Timeline, and Version History Workspaces', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('Part 11: Plan Workspace (Outliner & Corkboard)', async ({ page }) => {
    // Switch to Plan Workspace
    const planNav = page.locator('button[title*="Plan"], button:has-text("Plan")').first();
    await planNav.click();
    await page.waitForTimeout(400);

    // Verify Outliner renders chapter input
    await expect(page.locator('input[value*="The Stolen Palimpsest"]').first()).toBeVisible();

    // Toggle Corkboard View if available
    const boardToggle = page.locator('button:has-text("Corkboard"), button[title*="Corkboard" i], button:has-text("Board")').first();
    if (await boardToggle.isVisible()) {
      await boardToggle.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=The Stolen Palimpsest').first()).toBeVisible();
    }
  });

  test('Part 12: Story Workspace & Codex Exploration', async ({ page }) => {
    // Open Story Environment via TopHeader More menu
    await page.getByTestId('workspace-more-btn').click();
    await page.waitForTimeout(200);
    await page.getByTestId('nav-story-bible').click();
    await page.waitForTimeout(500);

    // Verify Story Workspace renders
    await expect(page.getByText('Story Bible & World').first()).toBeVisible();
    await expect(page.getByText('Lucan Graves').first()).toBeVisible();

    // Switch to Plot Threads sub-tab
    const threadsSubTab = page.locator('button:has-text("Plot Threads")').first();
    await threadsSubTab.click();
    await page.waitForTimeout(300);
    await expect(page.getByText('The Silver Weft Cipher').first()).toBeVisible();
  });

  test('Part 13: Timeline Workspace (Narrative Order vs Story Chronology)', async ({ page }) => {
    // Open Timeline Workspace via TopHeader More menu
    await page.getByTestId('workspace-more-btn').click();
    await page.waitForTimeout(200);
    await page.getByTestId('nav-timeline').click();
    await page.waitForTimeout(500);

    // Verify Timeline events render (Flashback & Flashforward)
    await expect(page.getByText('The Great Archival Fire of the Scriptorium').first()).toBeVisible();
  });

  test('Part 14: Version History & Comparison', async ({ page }) => {
    // Open Version History via TopHeader button
    const historyBtn = page.locator('button[title="Version History & Snapshots"]').first();
    await historyBtn.click();
    await page.waitForTimeout(500);

    // Verify Version History modal renders with snapshots
    await expect(page.getByText('Manuscript Baseline — Pre-Revision').first()).toBeVisible();
    await expect(page.getByText('Act I Polished Draft').first()).toBeVisible();
  });
});
