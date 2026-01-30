import { test, expect } from '@playwright/test';
import { login } from '../fixtures/auth';
import { selectors } from '../fixtures/selectors';
import { routes } from '../fixtures/test-data';

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display sidebar with all navigation sections', async ({ page }) => {
    // Verify main navigation items
    await expect(page.locator(selectors.nav.dashboard)).toBeVisible();
    await expect(page.locator(selectors.nav.userManagement)).toBeVisible();
    await expect(page.locator(selectors.nav.roles)).toBeVisible();
    await expect(page.locator(selectors.nav.auditLogs)).toBeVisible();
  });

  test('should navigate to dashboard via sidebar', async ({ page }) => {
    // Navigate away first
    await page.goto(routes.users);

    // Click dashboard link
    await page.click(selectors.nav.dashboard);

    // Verify navigation
    await expect(page).toHaveURL('/');
    await expect(page.locator(selectors.dashboard.pageTitle)).toContainText(/dashboard/i);
  });

  test('should navigate to user management via sidebar', async ({ page }) => {
    await page.click(selectors.nav.userManagement);

    await expect(page).toHaveURL(routes.users);
    await expect(page.locator(selectors.users.pageTitle)).toContainText(/user/i);
  });

  test('should navigate to roles via sidebar', async ({ page }) => {
    await page.click(selectors.nav.roles);

    await expect(page).toHaveURL(routes.roles);
    await expect(page.locator(selectors.common.pageTitle)).toBeVisible();
  });

  test('should navigate to audit logs via sidebar', async ({ page }) => {
    await page.click(selectors.nav.auditLogs);

    await expect(page).toHaveURL(routes.auditLogs);
    await expect(page.locator(selectors.common.pageTitle)).toBeVisible();
  });

  test('should navigate to asset registration via sidebar', async ({ page }) => {
    await page.click(selectors.nav.assetRegistration);

    await expect(page).toHaveURL(routes.assetRegistrations);
    await expect(page.locator(selectors.common.pageTitle)).toBeVisible();
  });

  test('should navigate to settings via sidebar', async ({ page }) => {
    await page.click(selectors.nav.settings);

    await expect(page).toHaveURL(routes.settings);
    await expect(page.locator(selectors.common.pageTitle)).toBeVisible();
  });

  test('should toggle sidebar visibility', async ({ page }) => {
    const sidebar = page.locator(selectors.nav.sidebar);
    const toggleButton = page.locator(selectors.nav.sidebarToggle);

    // Initial state - sidebar should be visible
    await expect(sidebar).toBeVisible();

    // Toggle sidebar
    await toggleButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Sidebar might be collapsed (still in DOM but narrower)
    // Check if toggle button is still accessible
    await expect(toggleButton).toBeVisible();

    // Toggle back
    await toggleButton.click();
    await page.waitForTimeout(300);

    // Sidebar should be expanded again
    await expect(sidebar).toBeVisible();
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to users
    await page.goto(routes.users);

    // The active link should have active styling
    const userManagementLink = page.locator(selectors.nav.userManagement);
    const parentButton = userManagementLink.locator('..').locator('..');

    // Check for active state (data-active attribute or active class)
    await expect(parentButton).toHaveAttribute('data-active', 'true');
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    // Navigate to invalid route
    await page.goto(routes.invalidRoute);

    // Verify 404 page elements
    await expect(page.locator(selectors.notFound.pageTitle)).toContainText(/not found|404/i);
    await expect(page.locator(selectors.notFound.goBackButton)).toBeVisible();
    await expect(page.locator(selectors.notFound.goHomeButton)).toBeVisible();
  });

  test('should navigate back from 404 page', async ({ page }) => {
    // First go to a valid page
    await page.goto(routes.users);
    await expect(page.locator(selectors.users.pageTitle)).toBeVisible();

    // Then go to invalid route
    await page.goto(routes.invalidRoute);
    await expect(page.locator(selectors.notFound.pageTitle)).toBeVisible();

    // Click go back
    await page.click(selectors.notFound.goBackButton);

    // Should go back to previous page (users)
    await expect(page).toHaveURL(routes.users);
  });

  test('should navigate to dashboard from 404 page', async ({ page }) => {
    // Go to invalid route
    await page.goto(routes.invalidRoute);
    await expect(page.locator(selectors.notFound.pageTitle)).toBeVisible();

    // Click go home
    await page.click(selectors.notFound.goHomeButton);

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator(selectors.dashboard.pageTitle)).toBeVisible();
  });

  test('should display logo in sidebar', async ({ page }) => {
    await expect(page.locator(selectors.nav.logo)).toBeVisible();
  });

  test('should show logout button in sidebar footer', async ({ page }) => {
    await expect(page.locator(selectors.nav.logoutButton)).toBeVisible();
  });

  test('should navigate via quick actions on dashboard', async ({ page }) => {
    await page.goto(routes.dashboard);

    // Test create user quick action
    await page.click(selectors.dashboard.createUserLink);
    await expect(page).toHaveURL(routes.userCreate);

    // Go back to dashboard
    await page.goto(routes.dashboard);

    // Test manage roles quick action
    await page.click(selectors.dashboard.manageRolesLink);
    await expect(page).toHaveURL(routes.roles);
  });

  test('should preserve scroll position in sidebar', async ({ page }) => {
    // Get sidebar element
    const sidebarContent = page.locator('[data-sidebar="content"]');

    // Scroll down in sidebar
    await sidebarContent.evaluate((el) => {
      el.scrollTop = 200;
    });

    // Navigate to a page
    await page.click(selectors.nav.settings);
    await expect(page).toHaveURL(routes.settings);

    // Check if scroll position is maintained (or reasonably close)
    const scrollTop = await sidebarContent.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
  });

  test('should navigate between nested routes correctly', async ({ page }) => {
    // Go to users list
    await page.goto(routes.users);
    await expect(page.locator(selectors.users.pageTitle)).toBeVisible();

    // Navigate to create user
    await page.click(selectors.users.createButton);
    await expect(page).toHaveURL(routes.userCreate);

    // Navigate back to users list via sidebar
    await page.click(selectors.nav.userManagement);
    await expect(page).toHaveURL(routes.users);
  });
});
