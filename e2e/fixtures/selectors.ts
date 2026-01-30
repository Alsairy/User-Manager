/**
 * Common selectors used across E2E tests
 * Centralized for maintainability
 */

export const selectors = {
  // Login page
  login: {
    emailInput: '[data-testid="input-email"]',
    passwordInput: '[data-testid="input-password"]',
    loginButton: '[data-testid="button-login"]',
    otpButton: '[data-testid="button-otp"]',
    forgotPasswordLink: '[data-testid="link-forgot-password"]',
    togglePasswordButton: '[data-testid="button-toggle-password"]',
    logo: '[data-testid="img-login-logo"]',
    title: '[data-testid="text-login-title"]',
  },

  // Navigation
  nav: {
    sidebar: '[data-sidebar="sidebar"]',
    sidebarToggle: '[data-testid="button-sidebar-toggle"]',
    logo: '[data-testid="img-logo"]',
    logoutButton: '[data-testid="button-logout"]',
    dashboard: '[data-testid="link-nav-dashboard"]',
    userManagement: '[data-testid="link-nav-userManagement"]',
    roles: '[data-testid="link-nav-roles"]',
    auditLogs: '[data-testid="link-nav-auditLogs"]',
    assetRegistration: '[data-testid="link-nav-assetRegistration"]',
    reviewQueue: '[data-testid="link-nav-reviewQueue"]',
    assetsBank: '[data-testid="link-nav-assetsBank"]',
    settings: '[data-testid="link-nav-settings"]',
  },

  // Dashboard
  dashboard: {
    pageTitle: '[data-testid="text-page-title"]',
    createUserLink: '[data-testid="link-quick-create-user"]',
    manageRolesLink: '[data-testid="link-quick-manage-roles"]',
  },

  // Users list
  users: {
    pageTitle: '[data-testid="text-page-title"]',
    createButton: '[data-testid="button-create-user"]',
    searchInput: '[data-testid="input-search-users"]',
    statusFilter: '[data-testid="select-status-filter"]',
    orgFilter: '[data-testid="select-org-filter"]',
    exportButton: '[data-testid="button-export"]',
    selectAllCheckbox: '[data-testid="checkbox-select-all"]',
    prevPageButton: '[data-testid="button-prev-page"]',
    nextPageButton: '[data-testid="button-next-page"]',
    userRow: (id: string) => `[data-testid="row-user-${id}"]`,
    userCheckbox: (id: string) => `[data-testid="checkbox-user-${id}"]`,
    userEmail: (id: string) => `[data-testid="text-email-${id}"]`,
    userActions: (id: string) => `[data-testid="button-actions-${id}"]`,
  },

  // Not found page
  notFound: {
    pageTitle: '[data-testid="text-page-title"]',
    goBackButton: '[data-testid="button-go-back"]',
    goHomeButton: '[data-testid="button-go-home"]',
  },

  // Common elements
  common: {
    pageTitle: '[data-testid="text-page-title"]',
    toast: '[data-testid="toast"]',
    loadingSpinner: '[data-testid="loading-spinner"]',
  },
};

/**
 * Get selector by path (e.g., 'login.emailInput')
 */
export function getSelector(path: string): string {
  const parts = path.split('.');
  let current: any = selectors;

  for (const part of parts) {
    if (current[part] === undefined) {
      throw new Error(`Selector not found: ${path}`);
    }
    current = current[part];
  }

  if (typeof current !== 'string') {
    throw new Error(`Invalid selector path: ${path}`);
  }

  return current;
}
