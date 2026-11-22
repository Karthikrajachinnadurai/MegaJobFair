import { useEffect, useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Alert, Badge, Card, EmptyState, Field, Modal, PageHeader, Spinner } from '../../components/ui'
import { formatDateTime } from '../../components/format'
import Icon from '../../components/Icon'

const EMPTY = { name: '', email: '', registerNo: '', department: '', studyYear: '', phone: '' }
const PAGE_SIZE = 25

export default function Students() {
  const [students, setStudents] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [resetting, setResetting] = useState(null)

  async function load() {
    try {
      setStudents(await api.listStudents())
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (students || []).filter((s) => {
      if (status === 'in' && !s.checkedIn) return false
      if (status === 'out' && s.checkedIn) return false
      if (!q) return true
      return [s.name, s.email, s.registerNo, s.department].some((v) => v && v.toLowerCase().includes(q))
    })
  }, [students, query, status])

  useEffect(() => setPage(1), [query, status])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const checkedIn = (students || []).filter((s) => s.checkedIn).length

  async function confirmReset() {
    const s = resetting
    try {
      const res = await api.resetCredentials(s.id)
      setNotice(res.credentialsSent
        ? `New login details emailed to ${s.email}.`
        : `New password created for ${s.name}, but the email could not be sent. Check the email service.`)
    } catch (e) {
      setError(e.message)
    } finally {
      setResetting(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={students ? `${students.length} imported · ${checkedIn} checked in` : 'Students imported from the Google Form.'}
        actions={
          <>
            <button className="btn btn--ghost" onClick={load}><Icon name="refresh" /> Refresh</button>
            <button className="btn btn--primary" onClick={() => setShowCreate(true)}><Icon name="plus" /> Add student</button>
          </>
        }
      />

      {error && <Alert tone="danger" onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert tone="success" onClose={() => setNotice('')}>{notice}</Alert>}

      <Card padded={false}>
        <div className="toolbar">
          <div className="search">
            <Icon name="search" />
            <input className="input" placeholder="Search name, email, register no, department" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="input input--auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All students</option>
            <option value="in">Checked in</option>
            <option value="out">Not checked in</option>
          </select>
        </div>

        {!students ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title={students.length ? 'No matching students' : 'No students yet'}>
            {students.length ? 'Try a different search.' : 'Run the Google Form import, or add a student manually.'}
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Register no</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Check-in</th>
                    <th className="right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-title">{s.name}</div>
                        <div className="cell-sub">{s.email}</div>
                      </td>
                      <td>{s.registerNo || '–'}</td>
                      <td>{s.department || '–'}</td>
                      <td>{s.studyYear || '–'}</td>
                      <td>
                        {s.checkedIn
                          ? <Badge tone="success">{formatDateTime(s.checkedInAt)}</Badge>
                          : <Badge tone="neutral">Not yet</Badge>}
                      </td>
                      <td className="right">
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={!s.checkedIn}
                          title={s.checkedIn ? 'Create a new password and email it' : 'Available after gate check-in'}
                          onClick={() => setResetting(s)}
                        >
                          <Icon name="key" size={16} /> Reset login
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pager">
              <span className="muted small">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="btn-row">
                <button className="btn btn--ghost btn--sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button className="btn btn--ghost btn--sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </Card>

      {showCreate && (
        <CreateStudentModal
          onClose={() => setShowCreate(false)}
          onCreated={(s) => {
            setStudents((list) => [s, ...(list || [])])
            setShowCreate(false)
            setNotice(`${s.name} added.`)
          }}
        />
      )}

      {resetting && (
        <Modal
          title="Reset student login?"
          onClose={() => setResetting(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setResetting(null)}>Cancel</button>
              <button className="btn btn--primary" onClick={confirmReset}>Reset and email</button>
            </>
          }
        >
          <p>A new password will be created for <strong>{resetting.name}</strong> and emailed to <strong>{resetting.email}</strong>. The old password stops working.</p>
        </Modal>
      )}
    </>
  )
}

function CreateStudentModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
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
      const body = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        studyYear: form.studyYear ? Number(form.studyYear) : null,
      }
      onCreated(await api.createStudent(body))
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Add student"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" form="student-form" disabled={busy}>{busy ? 'Saving…' : 'Add student'}</button>
        </>
      }
    >
      <form id="student-form" className="form" onSubmit={submit}>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="form-grid">
          <Field label="Full name *" error={errors.name}>
            <input className="input" value={form.name} onChange={set('name')} maxLength={150} required autoFocus />
          </Field>
          <Field label="Email *" error={errors.email}>
            <input className="input" type="email" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="Register no" error={errors.registerNo}>
            <input className="input" value={form.registerNo} onChange={set('registerNo')} maxLength={50} />
          </Field>
          <Field label="Department" error={errors.department}>
            <input className="input" value={form.department} onChange={set('department')} maxLength={100} placeholder="e.g. CSE" />
          </Field>
          <Field label="Year of study" error={errors.studyYear}>
            <select className="input" value={form.studyYear} onChange={set('studyYear')}>
              <option value="">–</option>
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input className="input" value={form.phone} onChange={set('phone')} maxLength={20} />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
