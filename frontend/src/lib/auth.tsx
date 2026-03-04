'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react'
import { apiClient } from './api'

export interface User {
  id: string
  email: string
  username: string
  first_name: string
  last_name: string
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isLoggedIn: boolean
  register: (data: any) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      // Try to load user
      apiClient
        .me(savedToken)
        .then((user) => setUser(user))
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('auth_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(
    async (data: any) => {
      setIsLoading(true)
      try {
        await apiClient.register(data)
        // Auto-login after registration
        await login(data.email, data.password)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await apiClient.login({ email, password })
      const newToken = result.access_token
      setToken(newToken)
      localStorage.setItem('auth_token', newToken)

      // Load user data
      const userData = await apiClient.me(newToken)
      setUser(userData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (!token) return

    try {
      await apiClient.logout(token)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
    }
  }, [token])

  const refreshUser = useCallback(async () => {
    if (!token) return

    try {
      const userData = await apiClient.me(token)
      setUser(userData)
    } catch (error) {
      // Token might be invalid
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
      throw error
    }
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isLoggedIn: !!user,
    register,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
