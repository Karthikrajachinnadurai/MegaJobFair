import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, clearSession, getSession, saveSession, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

/** Where each role lands after login. */
export const HOME_BY_ROLE = {
  ADMIN: '/admin',
  GATE_VOLUNTEER: '/gate',
  STUDENT: '/student',
  COMPANY_VOLUNTEER: '/company',
  HR: '/hr',
}

export const ROLE_LABEL = {
  ADMIN: 'Admin',
  GATE_VOLUNTEER: 'Gate Volunteer',
  STUDENT: 'Student',
  COMPANY_VOLUNTEER: 'Company Volunteer',
  HR: 'HR',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getSession())
  const navigate = useNavigate()

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null)
      navigate('/login', { replace: true, state: { expired: true } })
    })
  }, [navigate])

  // Log out automatically when the token expires while the page is open
  useEffect(() => {
    if (!session?.expiresAt) return
    const ms = new Date(session.expiresAt).getTime() - Date.now()
    if (ms <= 0) return logout()
    const timer = setTimeout(logout, Math.min(ms, 2 ** 31 - 1))
    return () => clearTimeout(timer)
  }, [session, logout])

  const login = useCallback(async (email, password) => {
    const res = await api.login(email.trim().toLowerCase(), password)
    saveSession(res)
    setSession(res)
    return res
  }, [])

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
