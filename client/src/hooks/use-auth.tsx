import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getAccessToken, login as authLogin, logout as authLogout, refreshAccessToken } from '../lib/auth'
import { apiGet } from '../lib/api'

interface User {
  id: string
  email: string
  fullName: string
  roles: string[]
}

// API returns PascalCase
interface ApiUser {
  Id: string
  Email: string
  FullName: string
  Roles: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const apiUser = await apiGet<ApiUser>('/api/v1/auth/me')
      // Map PascalCase API response to camelCase
      setUser({
        id: apiUser.Id,
        email: apiUser.Email,
        fullName: apiUser.FullName,
        roles: apiUser.Roles
      })
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const token = getAccessToken()
      if (token) {
        await fetchUser()
      } else {
        const newToken = await refreshAccessToken()
        if (newToken) {
          await fetchUser()
        }
      }
      setIsLoading(false)
    }
    init()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    await authLogin(email, password)
    await fetchUser()
  }

  const logout = async () => {
    await authLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
