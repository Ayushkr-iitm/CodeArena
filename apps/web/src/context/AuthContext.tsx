'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, tokenStorage } from '@/lib/api'

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  role: 'USER' | 'ADMIN'
  rating: number
  avatarUrl?: string | null
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: { email: string; password: string }) => Promise<User>
  register: (payload: { email: string; username: string; displayName?: string; password: string }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verify and hydrate current user on initial page load
  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken()
    if (!token) {
      setUser(null)
      setAccessToken(null)
      setIsLoading(false)
      return
    }

    try {
      setAccessToken(token)
      const userData = await api.getMe()
      setUser(userData)
    } catch (error) {
      console.warn('Session verification failed, attempting token refresh...', error)
      const refreshToken = tokenStorage.getRefreshToken()
      if (refreshToken) {
        try {
          const { accessToken: newToken } = await api.refreshToken(refreshToken)
          tokenStorage.setTokens(newToken, refreshToken)
          setAccessToken(newToken)
          const freshUser = await api.getMe()
          setUser(freshUser)
        } catch {
          // If refresh token also invalid, clear storage
          tokenStorage.clearTokens()
          setUser(null)
          setAccessToken(null)
        }
      } else {
        tokenStorage.clearTokens()
        setUser(null)
        setAccessToken(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    setIsLoading(true)
    try {
      const result = await api.login(credentials)
      const { user: loggedInUser, accessToken: newAccess, refreshToken: newRefresh } = result
      tokenStorage.setTokens(newAccess, newRefresh)
      setAccessToken(newAccess)
      setUser(loggedInUser)
      return loggedInUser
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: { email: string; username: string; displayName?: string; password: string }): Promise<User> => {
    setIsLoading(true)
    try {
      const result = await api.register(payload)
      const { user: registeredUser, accessToken: newAccess, refreshToken: newRefresh } = result
      tokenStorage.setTokens(newAccess, newRefresh)
      setAccessToken(newAccess)
      setUser(registeredUser)
      return registeredUser
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    tokenStorage.clearTokens()
    setUser(null)
    setAccessToken(null)
  }

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
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
