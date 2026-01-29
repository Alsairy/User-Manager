import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAccessToken,
  setTokens,
  clearTokens,
  getRefreshToken,
  login,
  logout,
  refreshAccessToken,
} from './auth'

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAccessToken', () => {
    it('should return null when no token is stored', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      expect(getAccessToken()).toBeNull()
    })

    it('should return token when stored', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('test-token')
      expect(getAccessToken()).toBe('test-token')
    })
  })

  describe('setTokens', () => {
    it('should store both tokens', () => {
      setTokens('access-token', 'refresh-token')

      expect(sessionStorage.setItem).toHaveBeenCalledWith('access_token', 'access-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-token')
    })
  })

  describe('clearTokens', () => {
    it('should remove both tokens', () => {
      clearTokens()

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })
  })

  describe('getRefreshToken', () => {
    it('should return null when no token is stored', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      expect(getRefreshToken()).toBeNull()
    })

    it('should return token when stored', () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('refresh-token')
      expect(getRefreshToken()).toBe('refresh-token')
    })
  })

  describe('login', () => {
    it('should call login API and store tokens on success', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          AccessToken: 'new-access-token',
          RefreshToken: 'new-refresh-token',
        }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await login('test@example.com', 'password123')

      expect(fetch).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      })
      expect(sessionStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token')
    })

    it('should throw error on failed login', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({ title: 'Invalid credentials' }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials')
    })

    it('should throw default error message when response has no title', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockRejectedValue(new Error()),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(login('test@example.com', 'wrong-password')).rejects.toThrow('Login failed')
    })
  })

  describe('logout', () => {
    it('should call logout API and clear tokens', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('refresh-token')
      const mockResponse = { ok: true }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await logout()

      expect(fetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'refresh-token' }),
      })
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('should clear tokens even if API call fails', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('refresh-token')
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await logout()

      expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })

    it('should clear tokens without API call if no refresh token', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)

      await logout()

      expect(fetch).not.toHaveBeenCalled()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token')
    })
  })

  describe('refreshAccessToken', () => {
    it('should return null if no refresh token', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)

      const result = await refreshAccessToken()

      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should refresh token and store new tokens on success', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('old-refresh-token')
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          AccessToken: 'new-access-token',
          RefreshToken: 'new-refresh-token',
        }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await refreshAccessToken()

      expect(result).toBe('new-access-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('access_token', 'new-access-token')
      expect(sessionStorage.setItem).toHaveBeenCalledWith('refresh_token', 'new-refresh-token')
    })

    it('should clear tokens and return null on failed refresh', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('old-refresh-token')
      const mockResponse = { ok: false }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await refreshAccessToken()

      expect(result).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('access_token')
    })

    it('should clear tokens and return null on network error', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('old-refresh-token')
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await refreshAccessToken()

      expect(result).toBeNull()
      expect(sessionStorage.removeItem).toHaveBeenCalled()
    })
  })
})
