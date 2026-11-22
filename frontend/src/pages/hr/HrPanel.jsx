import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Alert, Card, LiveDot, Modal, PageHeader, StatCard } from '../../components/ui'
import usePolling from '../../components/usePolling'
import Icon from '../../components/Icon'
import { QueueTable } from '../company/QueueBoard'

/** HR: search a student by name, mark In-interview, then Select or Reject. */
export default function HrPanel() {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { item, decision }
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const search = usePolling(() => api.hrSearch(debounced), 5000, [debounced])
  const summary = usePolling(() => api.queueSummary(session.companyId), 5000, [session.companyId])

  const refresh = () => Promise.all([search.reload(), summary.reload()])

  async function startInterview(item) {
    setBusyId(item.registrationId)
    setMessage(null)
    try {
      await api.hrInInterview(item.registrationId)
      setMessage({ tone: 'info', text: `${item.studentName} is now in interview.` })
      await refresh()
    } catch (e) {
      setMessage({ tone: 'danger', text: e.message })
    } finally {
      setBusyId(null)
    }
  }

  async function decide() {
    const { item, decision } = confirm
    setBusyId(item.registrationId)
    try {
      await api.hrDecision(item.registrationId, decision)
      setMessage({
        tone: decision === 'SELECTED' ? 'success' : 'info',
        text: `${item.studentName} marked as ${decision === 'SELECTED' ? 'selected' : 'rejected'}.`,
      })
      await refresh()
    } catch (e) {
      setMessage({ tone: 'danger', text: e.message })
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  const actions = (item) => {
    const inInterview = item.status === 'IN_INTERVIEW'
    const busy = busyId === item.registrationId
    return (
      <div className="btn-row btn-row--end">
        <button
          className="btn btn--secondary btn--sm"
          disabled={busy || inInterview || item.status !== 'WAITING'}
          onClick={() => startInterview(item)}
        >
          In-interview
        </button>
        <button
          className="btn btn--success btn--sm"
          disabled={busy || !inInterview}
          title={inInterview ? '' : 'Mark In-interview first'}
          onClick={() => setConfirm({ item, decision: 'SELECTED' })}
        >
          <Icon name="check" size={16} /> Select
        </button>
        <button
          className="btn btn--danger-ghost btn--sm"
          disabled={busy || !inInterview}
          title={inInterview ? '' : 'Mark In-interview first'}
          onClick={() => setConfirm({ item, decision: 'REJECTED' })}
        >
          <Icon name="x" size={16} /> Reject
        </button>
      </div>
    )
  }

  const s = summary.data
  // students already in interview are shown in their own card above
  const results = (search.data || []).filter((i) => i.status !== 'IN_INTERVIEW')

  return (
    <>
      <PageHeader
        title={s ? `${s.companyName} · Interviews` : 'Interviews'}
        subtitle="Search the student by name, start the interview, then record the result."
        actions={<LiveDot />}
      />

      {message && <Alert tone={message.tone} onClose={() => setMessage(null)}>{message.text}</Alert>}
      {(search.error || summary.error) && <Alert tone="danger">{(search.error || summary.error).message}</Alert>}

      {s && (
        <div className="stats stats--compact">
          <StatCard label="Waiting" value={s.waiting} tone="warning" />
          <StatCard label="In interview" value={s.inInterview} tone="info" />
          <StatCard label="Selected" value={s.selected} tone="success" />
          <StatCard label="Rejected" value={s.rejected} tone="danger" />
        </div>
      )}

      {s?.inInterviewList?.length > 0 && (
        <Card title="In interview now" subtitle="Record the result when the interview ends" padded={false}>
          <QueueTable items={s.inInterviewList} empty="" actions={actions} />
        </Card>
      )}

      <Card
        title="Find a student"
        subtitle="Only students in your queue appear here"
        padded={false}
        actions={<LiveDot label="Auto refresh" />}
      >
        <div className="toolbar">
          <div className="search search--lg">
            <Icon name="search" />
            <input
              className="input"
              placeholder="Type the student's name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <QueueTable
          items={results}
          showPosition
          actions={actions}
          empty={debounced ? `No one named “${debounced}” in your queue. They may need to be scanned in first.` : 'Your queue is empty.'}
        />
      </Card>

      {confirm && (
        <Modal
          title={confirm.decision === 'SELECTED' ? 'Select this student?' : 'Reject this student?'}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className={`btn ${confirm.decision === 'SELECTED' ? 'btn--success' : 'btn--danger'}`}
                onClick={decide}
                disabled={busyId === confirm.item.registrationId}
              >
                {confirm.decision === 'SELECTED' ? 'Confirm select' : 'Confirm reject'}
              </button>
            </>
          }
        >
          <p>
            <strong>{confirm.item.studentName}</strong> ({confirm.item.registerNo || 'no register no'}) will be marked as{' '}
            <strong>{confirm.decision === 'SELECTED' ? 'Selected' : 'Rejected'}</strong>. This is final and cannot be changed here.
          </p>
        </Modal>
      )}
    </>
  )
}
