import { test, expect } from '@playwright/test';
import { login, logout, ensureLoggedOut, testCredentials } from '../fixtures/auth';
import { selectors } from '../fixtures/selectors';
import { routes } from '../fixtures/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure logged out state before each test
    await page.goto('/');
    await ensureLoggedOut(page);
    await page.reload();
  });

  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/');

    // Verify login page elements are visible
    await expect(page.locator(selectors.login.emailInput)).toBeVisible();
    await expect(page.locator(selectors.login.passwordInput)).toBeVisible();
    await expect(page.locator(selectors.login.loginButton)).toBeVisible();
    await expect(page.locator(selectors.login.otpButton)).toBeVisible();
    await expect(page.locator(selectors.login.forgotPasswordLink)).toBeVisible();
    await expect(page.locator(selectors.login.logo)).toBeVisible();
    await expect(page.locator(selectors.login.title)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Perform login
    await login(page, testCredentials.admin.email, testCredentials.admin.password);

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator(selectors.dashboard.pageTitle)).toBeVisible();

    // Verify sidebar is visible (authenticated state)
    await expect(page.locator(selectors.nav.logo)).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill in invalid credentials
    await page.fill(selectors.login.emailInput, testCredentials.invalid.email);
    await page.fill(selectors.login.passwordInput, testCredentials.invalid.password);

    // Click login button
    await page.click(selectors.login.loginButton);

    // Wait for error toast to appear
    // The app shows toast notifications for login errors
    await expect(page.getByText(/login failed|invalid credentials/i)).toBeVisible({ timeout: 10000 });

    // Should still be on login page
    await expect(page.locator(selectors.login.emailInput)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.locator(selectors.login.passwordInput);
    const toggleButton = page.locator(selectors.login.togglePasswordButton);

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should logout and redirect to login page', async ({ page }) => {
    // First login
    await login(page);

    // Verify we're logged in
    await expect(page.locator(selectors.dashboard.pageTitle)).toBeVisible();

    // Perform logout
    await logout(page);

    // Verify redirect to login page
    await expect(page.locator(selectors.login.emailInput)).toBeVisible();
    await expect(page.locator(selectors.login.passwordInput)).toBeVisible();
  });

  test('should redirect to login when accessing protected route while not authenticated', async ({ page }) => {
    // Ensure logged out
    await ensureLoggedOut(page);

    // Try to access users page directly
    await page.goto(routes.users);

    // Should redirect to login page (app renders login when not authenticated)
    await expect(page.locator(selectors.login.emailInput)).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to login when accessing dashboard while not authenticated', async ({ page }) => {
    // Ensure logged out
    await ensureLoggedOut(page);

    // Try to access dashboard
    await page.goto(routes.dashboard);

    // Should show login page
    await expect(page.locator(selectors.login.emailInput)).toBeVisible({ timeout: 10000 });
  });

  test('should maintain authentication state after page reload', async ({ page }) => {
    // Login first
    await login(page);

    // Verify logged in
    await expect(page.locator(selectors.dashboard.pageTitle)).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be logged in (dashboard visible)
    await expect(page.locator(selectors.dashboard.pageTitle)).toBeVisible();
  });

  test('should require email field', async ({ page }) => {
    await page.goto('/');

    // Fill only password
    await page.fill(selectors.login.passwordInput, testCredentials.admin.password);

    // Try to submit
    await page.click(selectors.login.loginButton);

    // Email input should be marked as invalid (HTML5 validation)
    const emailInput = page.locator(selectors.login.emailInput);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should require password field', async ({ page }) => {
    await page.goto('/');

    // Fill only email
    await page.fill(selectors.login.emailInput, testCredentials.admin.email);

    // Try to submit
    await page.click(selectors.login.loginButton);

    // Password input should be marked as invalid (HTML5 validation)
    const passwordInput = page.locator(selectors.login.passwordInput);
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });
});
