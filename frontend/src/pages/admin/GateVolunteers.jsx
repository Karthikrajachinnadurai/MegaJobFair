import { useState } from 'react'
import { api } from '../../api/client'
import { Alert, Card, Field, PageHeader } from '../../components/ui'
import { generatePassword } from '../../components/format'
import { CreatedLogins } from './Companies'

export default function GateVolunteers() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState([])

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const user = await api.createGateVolunteer({ email: email.trim().toLowerCase(), password })
      setCreated((list) => [{ email: user.email, password, role: 'GATE_VOLUNTEER' }, ...list])
      setEmail('')
      setPassword(generatePassword())
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Gate volunteers" subtitle="Create logins for the volunteers who scan students in at the gate." />

      <div className="grid grid--2">
        <Card title="New gate volunteer">
          <form className="form" onSubmit={submit}>
            {error && <Alert tone="danger">{error}</Alert>}
            <Field label="Email *" error={errors.email}>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password *" error={errors.password} hint="At least 8 characters.">
              <div className="input-group">
                <input className="input mono" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                <button type="button" className="input-group__btn" onClick={() => setPassword(generatePassword())}>Generate</button>
              </div>
            </Field>
            <div>
              <button className="btn btn--primary" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button>
            </div>
          </form>
        </Card>

        <Card title="How gate check-in works">
          <ol className="steps">
            <li>The volunteer signs in on a phone and opens the scanner.</li>
            <li>They scan the QR the student received by email.</li>
            <li>Attendance is marked once, and the student gets their portal login by email.</li>
            <li>Scanning the same student again only shows “already checked in”.</li>
          </ol>
        </Card>
      </div>

      {created.length > 0 && <CreatedLogins items={created} onClear={() => setCreated([])} />}
    </>
  )
}
