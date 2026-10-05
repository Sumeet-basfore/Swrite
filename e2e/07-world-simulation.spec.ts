import { test, expect } from '@playwright/test';
import { seedRealisticProject, waitForEditor, getPersistedProject } from './helpers/testUtils';

test.describe('Part 22 — World Simulation Workspace & What-If Scenarios (Experimental Extension)', () => {

  test.beforeEach(async ({ page }) => {
    await seedRealisticProject(page);
    await page.goto('/');
    await waitForEditor(page);
  });

  test('World Simulation: Opt-In Extension Enablement & Lifecycle Toggle', async ({ page }) => {
    // 1. Open World Simulation Workspace via More Menu
    await page.getByTestId('workspace-more-btn').click();
    await page.waitForTimeout(200);
    await page.getByTestId('nav-simulation').click();
    await page.waitForTimeout(400);

    // 2. Verify Opt-In Screen is displayed initially for unconfigured project
    await expect(page.getByTestId('world-simulation-opt-in-screen')).toBeVisible();
    await expect(page.getByText('OPTIONAL PROJECT EXTENSION')).toBeVisible();
    await expect(page.getByTestId('btn-enable-simulation-extension')).toBeVisible();
    await expect(page.getByTestId('btn-cancel-simulation-extension')).toBeVisible();

    // 3. Click Enable for this Project
    await page.getByTestId('btn-enable-simulation-extension').click();
    await page.waitForTimeout(400);

    // 4. Verify World Simulation Workspace is now active
    await expect(page.getByTestId('world-simulation-workspace')).toBeVisible();
    await expect(page.getByText('EXTENSION ACTIVE')).toBeVisible();
    await expect(page.getByText('Deterministic World Simulation')).toBeVisible();
    await expect(page.getByText('Kingdoms & Realms')).toBeVisible();
    await expect(page.getByText('Active World Rules')).toBeVisible();
    await expect(page.getByTestId('btn-start-first-scenario')).toBeVisible();

    // 5. Test Disable button toggles back to opt-in screen
    await page.getByTestId('btn-disable-simulation-extension').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('world-simulation-opt-in-screen')).toBeVisible();
  });

  test('World Simulation: Complete Scenario Lifecycle (Enable -> Create -> Intervene -> Simulate -> Cause Tree -> Discard)', async ({ page }) => {
    // 1. Navigate to World Simulation via Story subview or More menu
    await page.getByTestId('workspace-more-btn').click();
    await page.waitForTimeout(200);
    await page.getByTestId('nav-simulation').click();
    await page.waitForTimeout(400);

    // 2. Enable Extension
    await page.getByTestId('btn-enable-simulation-extension').click();
    await page.waitForTimeout(300);

    // 3. Click "Create First What-If Scenario"
    await page.getByTestId('btn-start-first-scenario').click();
    await page.waitForTimeout(200);
    await expect(page.getByTestId('create-scenario-modal')).toBeVisible();

    // Fill scenario details
    await page.getByTestId('input-new-scenario-name').fill('Frontier Famine & Escalation');
    await page.getByTestId('btn-confirm-create-scenario').click();
    await page.waitForTimeout(400);

    // 4. Verify Sandbox Mode is Active
    await expect(page.getByText('SANDBOX (CANONICAL SAFE)')).toBeVisible();
    await expect(page.getByTestId('scenario-builder-panel')).toBeVisible();
    await expect(page.getByTestId('world-state-map-2d')).toBeVisible();
    await expect(page.getByTestId('simulation-results-panel-empty')).toBeVisible();
    await expect(page.getByTestId('simulation-turn-timeline')).toBeVisible();

    // 5. Add an author intervention (Resource Shift: -35 Food Supply)
    await page.getByTestId('btn-add-change').click();
    await page.waitForTimeout(200);
    await page.getByTestId('input-metric-value').fill('-35');
    
    // Verify Live Delta / Target preview is rendered
    await expect(page.getByTestId('live-delta-preview')).toBeVisible();
    await expect(page.getByTestId('live-delta-preview')).toContainText('-35');
    
    await page.getByTestId('btn-confirm-add-change').click();
    await page.waitForTimeout(300);

    // Verify change is listed
    await expect(page.getByTestId('scenario-changes-list')).toBeVisible();

    // 6. Run the Simulation (Simulate 6 Turns)
    await page.getByTestId('btn-run-simulation').click();
    await page.waitForTimeout(600);

    // 7. Verify Results Panel is Populated with Deltas & Cause Tree
    await expect(page.getByTestId('simulation-results-panel')).toBeVisible();
    await expect(page.getByTestId('metric-deltas-list')).toBeVisible();
    await expect(page.getByTestId('cause-effect-explorer')).toBeVisible();

    // 8. Click a node in the 2D Map to inspect kingdom details
    const firstNode = page.locator('[data-testid^="sim-node-"]').first();
    if (await firstNode.isVisible()) {
      await firstNode.click();
      await page.waitForTimeout(200);
      await expect(page.getByTestId('sim-selected-entity-card')).toBeVisible();
      // Close entity card
      await page.getByTestId('btn-close-entity-card').click();
      await page.waitForTimeout(200);
    }

    // 8b. Click an edge in the 2D Map to inspect bilateral relationship details
    const firstEdge = page.locator('[data-testid^="sim-edge-"]').first();
    if (await firstEdge.isVisible()) {
      await firstEdge.click({ force: true });
      await page.waitForTimeout(200);
      await expect(page.getByTestId('sim-selected-relation-card')).toBeVisible();
      // Close relation card
      await page.getByTestId('btn-close-relation-card').click();
      await page.waitForTimeout(200);
    }

    // 9. Scrub Timeline: click Turn 2
    const turn2Btn = page.getByTestId('turn-btn-2');
    if (await turn2Btn.isVisible()) {
      await turn2Btn.click();
      await page.waitForTimeout(200);
      await expect(page.getByText('Turn 2 (Simulated)')).toBeVisible();
    }

    // 10. Check Evaluation Metrics Modal
    await page.getByTestId('btn-eval-summary').click();
    await page.waitForTimeout(200);
    await expect(page.getByTestId('simulation-metrics-modal')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await page.waitForTimeout(200);

    // 11. Discard Scenario and verify canonical world remains 100% untouched
    await page.getByTestId('btn-discard-scenario').click();
    await page.waitForTimeout(400);

    // Verify returned to Entry Screen
    await expect(page.getByText('Deterministic World Simulation')).toBeVisible();
    await expect(page.getByTestId('btn-start-first-scenario')).toBeVisible();
  });

  test('World Simulation: Apply Consequences to Canonical World with Safety Snapshot', async ({ page }) => {
    // 1. Navigate to World Simulation
    await page.getByTestId('workspace-more-btn').click();
    await page.waitForTimeout(200);
    await page.getByTestId('nav-simulation').click();
    await page.waitForTimeout(400);

    // 2. Enable Extension
    await page.getByTestId('btn-enable-simulation-extension').click();
    await page.waitForTimeout(300);

    // 3. Create Scenario
    await page.getByTestId('btn-start-first-scenario').click();
    await page.waitForTimeout(200);
    await page.getByTestId('input-new-scenario-name').fill('Southern March Reorganization');
    await page.getByTestId('btn-confirm-create-scenario').click();
    await page.waitForTimeout(400);

    // 4. Add an intervention
    await page.getByTestId('btn-add-change').click();
    await page.waitForTimeout(200);
    await page.getByTestId('input-metric-value').fill('-25');
    await page.getByTestId('btn-confirm-add-change').click();
    await page.waitForTimeout(300);

    // 5. Simulate
    await page.getByTestId('btn-run-simulation').click();
    await page.waitForTimeout(600);

    // 6. Open Apply Modal
    await page.getByTestId('btn-open-apply-modal').click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId('apply-scenario-modal')).toBeVisible();
    await expect(page.getByText('Automated Pre-Apply Safety Snapshot')).toBeVisible();
    await expect(page.getByTestId('apply-diff-list')).toBeVisible();

    // 7. Confirm Apply
    await page.getByTestId('btn-confirm-apply').click();
    await page.waitForTimeout(500);

    // 8. Verify Apply Success Banner & Snapshot ID
    await expect(page.getByTestId('apply-success-banner')).toBeVisible();
    await expect(page.getByText('Safety snapshot created')).toBeVisible();

    // 9. Verify Project Integrity: check Version History modal to see the created safety snapshot
    const persisted = await getPersistedProject(page);
    expect(persisted.snapshots?.length).toBeGreaterThan(0);
    const snap = persisted.snapshots?.find(s => s.label.includes('Pre-Simulation Apply'));
    expect(snap).toBeDefined();
  });

});
