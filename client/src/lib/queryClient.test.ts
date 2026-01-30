import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiRequest, getQueryFn, queryClient } from './queryClient'

describe('queryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('apiRequest', () => {
    it('should make GET request without auth header when no token', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await apiRequest('GET', '/api/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
      })
    })

    it('should include Authorization header when token exists', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('test-token')
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await apiRequest('GET', '/api/test')

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer test-token' },
        body: undefined,
      })
    })

    it('should include Content-Type header and body for POST requests', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('test-token')
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await apiRequest('POST', '/api/test', { name: 'test' })

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'test' }),
      })
    })

    it('should throw error on non-ok response', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: vi.fn().mockResolvedValue('Invalid input'),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('400: Invalid input')
    })

    it('should use statusText when response text is empty', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue(''),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('500: Internal Server Error')
    })
  })

  describe('getQueryFn', () => {
    it('should return null on 401 when on401 is returnNull', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Unauthorized'),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const queryFn = getQueryFn({ on401: 'returnNull' })
      const result = await queryFn({
        queryKey: ['/api/test'],
        signal: new AbortController().signal,
        meta: undefined,
      })

      expect(result).toBeNull()
    })

    it('should throw on 401 when on401 is throw', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null)
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Unauthorized'),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const queryFn = getQueryFn({ on401: 'throw' })

      await expect(
        queryFn({
          queryKey: ['/api/test'],
          signal: new AbortController().signal,
          meta: undefined,
        })
      ).rejects.toThrow('401: Unauthorized')
    })

    it('should return JSON data on success', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue('test-token')
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const queryFn = getQueryFn({ on401: 'throw' })
      const result = await queryFn({
        queryKey: ['/api', 'users', '1'],
        signal: new AbortController().signal,
        meta: undefined,
      })

      expect(result).toEqual({ id: 1, name: 'Test' })
      expect(fetch).toHaveBeenCalledWith('/api/users/1', {
        headers: { Authorization: 'Bearer test-token' },
      })
    })
  })

  describe('queryClient', () => {
    it('should be configured with correct default options', () => {
      const defaultOptions = queryClient.getDefaultOptions()

      expect(defaultOptions.queries?.refetchInterval).toBe(false)
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false)
      expect(defaultOptions.queries?.staleTime).toBe(Infinity)
      // retry is a function for smart retry logic (retry on 5xx, no retry on 4xx)
      expect(typeof defaultOptions.queries?.retry).toBe('function')
      expect(defaultOptions.mutations?.retry).toBe(false)
    })
  })
})
