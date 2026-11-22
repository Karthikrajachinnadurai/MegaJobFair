import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Alert, Badge, Card, EmptyState, Field, Modal, PageHeader, Spinner } from '../../components/ui'
import { generatePassword } from '../../components/format'
import Icon from '../../components/Icon'

const EMPTY_COMPANY = { name: '', description: '', rolesOffered: '', cabinNo: '' }

export default function Companies() {
  const [companies, setCompanies] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [loginFor, setLoginFor] = useState(null) // company to create a login for
  const [created, setCreated] = useState([]) // logins created in this session, to show the password once

  async function load() {
    try {
      setCompanies(await api.listCompanies())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { load() }, [])

  async function toggleActive(c) {
    try {
      const updated = await api.setCompanyActive(c.id, !c.active)
      setCompanies((list) => list.map((x) => (x.id === c.id ? updated : x)))
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Add companies and create their volunteer and HR logins."
        actions={
          <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
            <Icon name="plus" /> Add company
          </button>
        }
      />

      {error && <Alert tone="danger" onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onClose={() => setNotice('')}>{notice}</Alert>}

      {created.length > 0 && <CreatedLogins items={created} onClear={() => setCreated([])} />}

      <Card padded={false}>
        {!companies ? (
          <Spinner />
        ) : companies.length === 0 ? (
          <EmptyState icon="building" title="No companies yet">Click “Add company” to create the first one.</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Roles offered</th>
                  <th>Cabin</th>
                  <th>Status</th>
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-title">{c.name}</div>
                      {c.description && <div className="cell-sub clamp">{c.description}</div>}
                    </td>
                    <td className="cell-sub">{c.rolesOffered || '–'}</td>
                    <td>{c.cabinNo || '–'}</td>
                    <td>{c.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge>}</td>
                    <td className="right">
                      <div className="btn-row btn-row--end">
                        <button className="btn btn--secondary btn--sm" onClick={() => setLoginFor(c)}>
                          <Icon name="key" size={16} /> Add login
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={() => toggleActive(c)}>
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && (
        <CreateCompanyModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCompanies((list) => [...(list || []), c])
            setShowCreate(false)
            setNotice(`${c.name} added. Now create its volunteer and HR logins.`)
          }}
        />
      )}

      {loginFor && (
        <CreateCompanyLoginModal
          company={loginFor}
          onClose={() => setLoginFor(null)}
          onCreated={(item) => {
            setCreated((list) => [item, ...list])
            setLoginFor(null)
          }}
        />
      )}
    </>
  )
}

function CreateCompanyModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_COMPANY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      onCreated(await api.createCompany({ ...form, name: form.name.trim() }))
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Add company"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" form="company-form" disabled={busy}>{busy ? 'Saving…' : 'Add company'}</button>
        </>
      }
    >
      <form id="company-form" className="form" onSubmit={submit}>
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Company name *" error={errors.name}>
          <input className="input" value={form.name} onChange={set('name')} maxLength={150} required autoFocus />
        </Field>
        <div className="form-grid">
          <Field label="Cabin / room" error={errors.cabinNo}>
            <input className="input" value={form.cabinNo} onChange={set('cabinNo')} maxLength={50} placeholder="e.g. B-204" />
          </Field>
          <Field label="Roles offered" error={errors.rolesOffered}>
            <input className="input" value={form.rolesOffered} onChange={set('rolesOffered')} maxLength={500} placeholder="e.g. Java Developer, QA" />
          </Field>
        </div>
        <Field label="Description" error={errors.description}>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} maxLength={1000} />
        </Field>
      </form>
    </Modal>
  )
}

function CreateCompanyLoginModal({ company, onClose, onCreated }) {
  const [role, setRole] = useState('COMPANY_VOLUNTEER')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(() => generatePassword())
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const user = await api.createCompanyUser(company.id, { email: email.trim().toLowerCase(), password, role })
      onCreated({ email: user.email, password, role: user.role, companyName: company.name })
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`New login for ${company.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" form="login-form" disabled={busy}>{busy ? 'Creating…' : 'Create login'}</button>
        </>
      }
    >
      <form id="login-form" className="form" onSubmit={submit}>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="segmented">
          {[
            ['COMPANY_VOLUNTEER', 'Volunteer', 'Scans students into the queue'],
            ['HR', 'HR', 'Runs interviews and decides'],
          ].map(([value, label, help]) => (
            <button
              type="button"
              key={value}
              className={`segmented__item ${role === value ? 'segmented__item--active' : ''}`}
              onClick={() => setRole(value)}
            >
              <span className="segmented__label">{label}</span>
              <span className="segmented__help">{help}</span>
            </button>
          ))}
        </div>
        <Field label="Email *" error={errors.email}>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Password *" error={errors.password} hint="At least 8 characters. Copy it now; it is not shown again.">
          <div className="input-group">
            <input className="input mono" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            <button type="button" className="input-group__btn" onClick={() => setPassword(generatePassword())}>Generate</button>
          </div>
        </Field>
      </form>
    </Modal>
  )
}

export function CreatedLogins({ items, onClear }) {
  const [copied, setCopied] = useState(null)
  async function copy(i, item) {
    await navigator.clipboard?.writeText(`Email: ${item.email}\nPassword: ${item.password}`)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <Card
      title="Logins created just now"
      subtitle="Share these with the people who will use them. Passwords disappear when you leave this page."
      actions={<button className="btn btn--ghost btn--sm" onClick={onClear}>Clear</button>}
      padded={false}
      className="card--highlight"
    >
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Email</th><th>Role</th><th>Company</th><th>Password</th><th /></tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.email + i}>
                <td>{item.email}</td>
                <td>{item.role === 'HR' ? 'HR' : item.role === 'GATE_VOLUNTEER' ? 'Gate volunteer' : 'Company volunteer'}</td>
                <td>{item.companyName || '–'}</td>
                <td className="mono">{item.password}</td>
                <td className="right">
                  <button className="btn btn--ghost btn--sm" onClick={() => copy(i, item)}>
                    {copied === i ? 'Copied' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
