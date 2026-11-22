import { useState } from 'react'
import { api } from '../../api/client'
import QrScanner from '../../components/QrScanner'
import { Card, EmptyState, PageHeader, Badge } from '../../components/ui'
import { formatTime } from '../../components/format'
import Icon from '../../components/Icon'

/** Company volunteer scans the student's company QR to add them to the waiting list. */
export default function CompanyScan() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  async function handleScan(token) {
    setBusy(true)
    try {
      const data = await api.queueScan(token)
      setResult({ ok: true, data })
      setHistory((h) => [{ ...data, at: new Date() }, ...h].slice(0, 20))
    } catch (e) {
      // 409 = already in another queue or not in REGISTERED state; 403 = QR for another company
      setResult({ ok: false, status: e.status, message: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Add to queue" subtitle="Scan the student's company QR to add them to your waiting list." />

      <div className="grid grid--scan">
        <Card>
          {result ? (
            <Result result={result} onNext={() => setResult(null)} />
          ) : (
            <>
              <QrScanner onScan={handleScan} paused={busy || !!result} />
              {busy && <p className="muted center">Checking…</p>}
            </>
          )}
        </Card>

        <Card title="Recently added" subtitle="This device, this session" padded={false}>
          {history.length === 0 ? (
            <EmptyState icon="scan" title="No scans yet" />
          ) : (
            <ul className="list">
              {history.map((h, i) => (
                <li key={i} className="list__item">
                  <div>
                    <div className="cell-title">{h.studentName}</div>
                    <div className="cell-sub">{h.registerNo || '–'} · {h.department || '–'}</div>
                  </div>
                  <div className="list__meta">
                    {h.alreadyInQueue ? <Badge tone="warning">Repeat</Badge> : <Badge tone="success">Added</Badge>}
                    <span className="muted small">{formatTime(h.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function Result({ result, onNext }) {
  if (!result.ok) {
    const otherQueue = result.status === 409 && result.message.toLowerCase().includes('queue')
    return (
      <div className={`result ${otherQueue ? 'result--warning' : 'result--danger'}`}>
        <div className="result__icon"><Icon name={otherQueue ? 'alert' : 'x'} size={28} /></div>
        <h2 className="result__title">{otherQueue ? 'In another queue' : 'Cannot add to queue'}</h2>
        <p className="result__text">{result.message}</p>
        {otherQueue && (
          <p className="result__hint">Ask the student to open <strong>My registrations</strong>, tap <strong>Drop queue</strong> on the other company, then scan again.</p>
        )}
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>Scan next</button>
      </div>
    )
  }

  const s = result.data
  return (
    <div className={`result ${s.alreadyInQueue ? 'result--warning' : 'result--success'}`}>
      <div className="result__icon"><Icon name={s.alreadyInQueue ? 'info' : 'check'} size={28} /></div>
      <h2 className="result__title">{s.alreadyInQueue ? 'Already in your queue' : 'Added to queue'}</h2>
      <p className="result__text">
        {s.alreadyInQueue ? `Joined at ${formatTime(s.joinedAt)}.` : 'Ask the student to wait near the cabin.'}
      </p>
      <dl className="details">
        <div><dt>Name</dt><dd>{s.studentName}</dd></div>
        <div><dt>Register no</dt><dd>{s.registerNo || '–'}</dd></div>
        <div><dt>Department</dt><dd>{s.department || '–'}</dd></div>
        <div><dt>Now waiting</dt><dd>{s.waitingCount}</dd></div>
      </dl>
      <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>Scan next</button>
    </div>
  )
}
