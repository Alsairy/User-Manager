import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './use-auth'
import * as authLib from '../lib/auth'
import * as apiLib from '../lib/api'

// Mock the auth and api modules
vi.mock('../lib/auth', () => ({
  getAccessToken: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshAccessToken: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
}))

// Test component that uses the auth hook
function TestComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  if (isLoading) {
    return <div data-testid="loading">Loading...</div>
  }

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      {user && (
        <div data-testid="user-info">
          <span data-testid="user-email">{user.email}</span>
          <span data-testid="user-name">{user.fullName}</span>
        </div>
      )}
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}

// Component that tries to use useAuth outside provider
function ComponentWithoutProvider() {
  try {
    useAuth()
    return <div>Should not render</div>
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should throw error when used outside AuthProvider', () => {
    render(<ComponentWithoutProvider />)

    expect(screen.getByTestId('error')).toHaveTextContent('useAuth must be used within AuthProvider')
  })

  it('should show loading state initially', () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(null)
    vi.mocked(authLib.refreshAccessToken).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })

  it('should show not authenticated when no token', async () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(null)
    vi.mocked(authLib.refreshAccessToken).mockResolvedValue(null)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })
  })

  it('should fetch user when token exists', async () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue('valid-token')
    vi.mocked(apiLib.apiGet).mockResolvedValue({
      Id: '123',
      Email: 'test@example.com',
      FullName: 'Test User',
      Roles: ['Admin'],
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User')
  })

  it('should try to refresh token when access token is missing', async () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue(null)
    vi.mocked(authLib.refreshAccessToken).mockResolvedValue('new-token')
    vi.mocked(apiLib.apiGet).mockResolvedValue({
      Id: '123',
      Email: 'refreshed@example.com',
      FullName: 'Refreshed User',
      Roles: ['User'],
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authLib.refreshAccessToken).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })
  })

  it('should handle login', async () => {
    const user = userEvent.setup()

    vi.mocked(authLib.getAccessToken).mockReturnValue(null)
    vi.mocked(authLib.refreshAccessToken).mockResolvedValue(null)
    vi.mocked(authLib.login).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    })
    vi.mocked(apiLib.apiGet).mockResolvedValue({
      Id: '456',
      Email: 'newuser@example.com',
      FullName: 'New User',
      Roles: ['User'],
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })

    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(authLib.login).toHaveBeenCalledWith('test@example.com', 'password')
    })
  })

  it('should handle logout', async () => {
    const user = userEvent.setup()

    vi.mocked(authLib.getAccessToken).mockReturnValue('valid-token')
    vi.mocked(authLib.logout).mockResolvedValue(undefined)
    vi.mocked(apiLib.apiGet).mockResolvedValue({
      Id: '123',
      Email: 'test@example.com',
      FullName: 'Test User',
      Roles: ['Admin'],
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(authLib.logout).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })
  })

  it('should handle user fetch error gracefully', async () => {
    vi.mocked(authLib.getAccessToken).mockReturnValue('invalid-token')
    vi.mocked(apiLib.apiGet).mockRejectedValue(new Error('Unauthorized'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })
  })
})
