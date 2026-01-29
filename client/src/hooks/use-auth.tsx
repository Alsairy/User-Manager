import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getAccessToken, login as authLogin, logout as authLogout, refreshAccessToken } from '../lib/auth'
import { apiGet } from '../lib/api'

interface User {
  id: string
  email: string
  fullName: string
  roles: string[]
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
      const userData = await apiGet<User>('/api/v1/auth/me')
      setUser(userData)
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
