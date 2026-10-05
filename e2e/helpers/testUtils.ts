import { Page } from '@playwright/test';
import { createRealisticNovelProject } from '../fixtures/realisticProject';
import { ProjectData } from '../../src/types';

export const STORAGE_KEY = 'swrite_active_project_data';
export const STORAGE_THEME_KEY = 'swrite_user_theme_pref';
export const STORAGE_TYPO_KEY = 'swrite_user_typo_pref';

/**
 * Injects a realistic novel project into localStorage before loading the app.
 */
export async function seedRealisticProject(page: Page, customProject?: ProjectData): Promise<ProjectData> {
  const project = customProject || createRealisticNovelProject();
  await page.addInitScript(({ key, projectData }) => {
    localStorage.setItem(key, JSON.stringify(projectData));
  }, { key: STORAGE_KEY, projectData: project });
  return project;
}

/**
 * Retrieves the current project data persisted in the browser's localStorage.
 */
export async function getPersistedProject(page: Page): Promise<ProjectData> {
  return await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

/**
 * Waits for the Novel Editor ProseMirror instance to be visible and interactive.
 */
export async function waitForEditor(page: Page) {
  // Ensure we are on Write tab if currently on another workspace
  const writeBtn = page.locator('button[title*="Write Workspace"]').first();
  if (await writeBtn.isVisible()) {
    await writeBtn.click();
    await page.waitForTimeout(100);
  }
  await page.waitForSelector('.ProseMirror', { state: 'visible', timeout: 15000 });
}
