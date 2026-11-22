import { Navigate, Outlet } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from './AuthContext'

/** Lets the page through only for the given roles; everyone else goes to their own home. */
export default function RequireRole({ roles }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (!roles.includes(session.role)) return <Navigate to={HOME_BY_ROLE[session.role] || '/login'} replace />
  return <Outlet />
}
