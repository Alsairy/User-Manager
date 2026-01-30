import { Page, expect } from '@playwright/test';

/**
 * Test credentials for E2E testing
 */
export const testCredentials = {
  admin: {
    email: 'admin@madares.sa',
    password: 'Admin123!',
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword',
  },
};

/**
 * Login helper function
 * Performs login with given credentials and waits for successful authentication
 */
export async function login(
  page: Page,
  email: string = testCredentials.admin.email,
  password: string = testCredentials.admin.password
): Promise<void> {
  // Navigate to the app (will redirect to login if not authenticated)
  await page.goto('/');

  // Wait for login page elements
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });

  // Fill in credentials
  await page.fill('[data-testid="input-email"]', email);
  await page.fill('[data-testid="input-password"]', password);

  // Click login button
  await page.click('[data-testid="button-login"]');

  // Wait for successful login - dashboard should load
  await page.waitForSelector('[data-testid="text-page-title"]', { timeout: 15000 });
}

/**
 * Login and store auth state for reuse
 * Useful for tests that need authenticated state
 */
export async function loginAndSaveState(
  page: Page,
  storagePath: string,
  email: string = testCredentials.admin.email,
  password: string = testCredentials.admin.password
): Promise<void> {
  await login(page, email, password);

  // Save storage state
  await page.context().storageState({ path: storagePath });
}

/**
 * Logout helper function
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button in sidebar
  await page.click('[data-testid="button-logout"]');

  // Wait for redirect to login page
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for dashboard element (authenticated state)
    await page.waitForSelector('[data-testid="text-page-title"]', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is logged out before test
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  // Clear local storage to ensure logged out state
  await page.evaluate(() => {
    localStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  });
}
