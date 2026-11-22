import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from '../auth/AuthContext'
import { Alert, Field } from '../components/ui'

export default function Login() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to={HOME_BY_ROLE[session.role] || '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await login(email, password)
      navigate(HOME_BY_ROLE[res.role] || '/', { replace: true })
    } catch (err) {
      setError(err.status === 401 || err.status === 400 ? 'Incorrect email or password.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__brand">
          <div className="brand__logo brand__logo--lg">M</div>
          <h1>Mega Job Fair</h1>
          <p>One place for check-in, company registration, queues and interviews.</p>
        </div>
        <ul className="auth__points">
          <li>Scan in at the gate with your QR</li>
          <li>Register for companies and track live queues</li>
          <li>Get interview results instantly</li>
        </ul>
      </div>

      <div className="auth__form-wrap">
        <form className="auth__form" onSubmit={submit}>
          <div>
            <h2 className="auth__title">Sign in</h2>
            <p className="auth__subtitle">Students: use the email and password sent to you after gate check-in.</p>
          </div>

          {location.state?.expired && !error && (
            <Alert tone="warning">Your session expired. Please sign in again.</Alert>
          )}
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Email">
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </Field>

          <Field label="Password">
            <div className="input-group">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="input-group__btn" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <button className="btn btn--primary btn--block btn--lg" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
