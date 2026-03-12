import { useState, useEffect, useCallback } from 'react'
import { signIn as cognitoSignIn, signUp as cognitoSignUp, confirmSignUp as cognitoConfirm, getTokenPayload, clearTokens, refreshSession } from '../lib/cognito'

interface AuthUser {
  sub: string
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined)

  const checkAuth = useCallback(async () => {
    let payload = getTokenPayload()
    if (!payload) {
      // Try refreshing
      const newToken = await refreshSession()
      if (newToken) payload = getTokenPayload()
    }
    setUser(payload || null)
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  return {
    user,
    loading: user === undefined,
    signIn: async (email: string, password: string) => {
      await cognitoSignIn(email, password)
      setUser(getTokenPayload())
    },
    signUp: cognitoSignUp,
    confirmSignUp: cognitoConfirm,
    signOut: () => {
      clearTokens()
      setUser(null)
    },
  }
}
