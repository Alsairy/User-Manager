/**
 * Test data for E2E tests
 */

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test.user.${timestamp}.${random}@test.madares.sa`;
}

/**
 * Test user data for creating new users
 */
export const testUserData = {
  basic: {
    email: generateTestEmail,
    status: 'active' as const,
    sendInvitation: true,
  },
  withRole: {
    email: generateTestEmail,
    status: 'active' as const,
    sendInvitation: true,
    assignmentType: 'role' as const,
  },
  withCustomPermissions: {
    email: generateTestEmail,
    status: 'active' as const,
    sendInvitation: false,
    assignmentType: 'custom' as const,
  },
};

/**
 * Mock API responses for testing
 */
export const mockResponses = {
  dashboardStats: {
    totalUsers: 150,
    activeUsers: 120,
    pendingUsers: 25,
    totalRoles: 8,
    recentActivity: [],
  },
  usersList: {
    users: [
      {
        id: 'test-user-1',
        email: 'user1@test.com',
        status: 'active',
        organizationId: 'org-1',
        workUnitId: 'unit-1',
        roleId: 'role-1',
        hasCustomPermissions: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        organization: { id: 'org-1', name: 'Test Organization' },
        workUnit: { id: 'unit-1', name: 'Test Unit' },
      },
    ],
    total: 1,
    page: 1,
    limit: 25,
  },
  organizations: [
    { id: 'org-1', name: 'Test Organization 1', code: 'ORG1' },
    { id: 'org-2', name: 'Test Organization 2', code: 'ORG2' },
  ],
  roles: [
    { id: 'role-1', name: 'Administrator', description: 'Full access', isSystem: true },
    { id: 'role-2', name: 'User Manager', description: 'Manage users', isSystem: false },
  ],
};

/**
 * Navigation routes for testing
 */
export const routes = {
  dashboard: '/',
  users: '/users',
  userCreate: '/users/create',
  userEdit: (id: string) => `/users/${id}/edit`,
  roles: '/roles',
  auditLogs: '/audit-logs',
  settings: '/settings',
  assetRegistrations: '/assets/registrations',
  assetCreate: '/assets/registrations/create',
  assetDetail: (id: string) => `/assets/registrations/${id}`,
  reviewQueue: '/assets/reviews',
  assetsBank: '/assets/bank',
  contracts: '/contracts',
  invalidRoute: '/this-route-does-not-exist',
};

/**
 * Wait times for various operations (in milliseconds)
 */
export const waitTimes = {
  pageLoad: 5000,
  apiResponse: 10000,
  animation: 500,
  debounce: 300,
};
