import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/authApi'
import { UserProfile } from '../types'
import { tokenStorage } from '../utils/tokenStorage'

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    const accessToken = tokenStorage.getAccessToken()
    if (!accessToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const profile = await authApi.getCurrentUser(accessToken)
      setUser(profile)
    } catch {
      tokenStorage.clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  const logout = async () => {
    const refreshToken = tokenStorage.getRefreshToken()
    const accessToken = tokenStorage.getAccessToken()
    if (refreshToken) {
      await authApi.logout(refreshToken, accessToken ?? undefined).catch(() => {})
    }
    tokenStorage.clearTokens()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
