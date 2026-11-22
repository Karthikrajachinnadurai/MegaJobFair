import { useState } from 'react'
import { api } from '../../api/client'
import QrScanner from '../../components/QrScanner'
import { Alert, Badge, Card, EmptyState, PageHeader } from '../../components/ui'
import { formatTime } from '../../components/format'
import Icon from '../../components/Icon'

export default function GateScan() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // { ok, data } or { ok: false, message }
  const [history, setHistory] = useState([])

  async function handleScan(token) {
    setBusy(true)
    try {
      const data = await api.gateScan(token)
      setResult({ ok: true, data })
      setHistory((h) => [{ ...data, at: new Date() }, ...h].slice(0, 20))
    } catch (e) {
      setResult({ ok: false, message: e.message })
    } finally {
      setBusy(false)
    }
  }

  const paused = busy || !!result

  return (
    <>
      <PageHeader title="Gate check-in" subtitle="Scan the student's entry QR to mark attendance and send their login." />

      <div className="grid grid--scan">
        <Card>
          {result ? (
            <ScanResult result={result} onNext={() => setResult(null)} />
          ) : (
            <>
              <QrScanner onScan={handleScan} paused={paused} />
              {busy && <p className="muted center">Checking…</p>}
            </>
          )}
        </Card>

        <Card title="Recent scans" subtitle="This device, this session" padded={false}>
          {history.length === 0 ? (
            <EmptyState icon="scan" title="No scans yet" />
          ) : (
            <ul className="list">
              {history.map((h, i) => (
                <li key={i} className="list__item">
                  <div>
                    <div className="cell-title">{h.name}</div>
                    <div className="cell-sub">{h.registerNo || h.email}</div>
                  </div>
                  <div className="list__meta">
                    {h.alreadyCheckedIn ? <Badge tone="warning">Repeat</Badge> : <Badge tone="success">Checked in</Badge>}
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

function ScanResult({ result, onNext }) {
  if (!result.ok) {
    return (
      <div className="result result--danger">
        <div className="result__icon"><Icon name="x" size={28} /></div>
        <h2 className="result__title">Scan failed</h2>
        <p className="result__text">{result.message}</p>
        <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>Scan next</button>
      </div>
    )
  }

  const s = result.data
  const repeat = s.alreadyCheckedIn
  return (
    <div className={`result ${repeat ? 'result--warning' : 'result--success'}`}>
      <div className="result__icon"><Icon name={repeat ? 'alert' : 'check'} size={28} /></div>
      <h2 className="result__title">{repeat ? 'Already checked in' : 'Checked in'}</h2>
      <p className="result__text">
        {repeat ? `First checked in at ${formatTime(s.checkedInAt)}. Let them through.` : 'Attendance marked. Let them through.'}
      </p>

      <dl className="details">
        <div><dt>Name</dt><dd>{s.name}</dd></div>
        <div><dt>Register no</dt><dd>{s.registerNo || '–'}</dd></div>
        <div><dt>Department</dt><dd>{s.department || '–'}</dd></div>
        <div><dt>Email</dt><dd>{s.email}</dd></div>
      </dl>

      {!repeat && !s.credentialsSent && (
        <Alert tone="warning" title="Login email not sent">
          The student is checked in, but their login email failed. Ask the admin to use “Reset login”.
        </Alert>
      )}

      <button className="btn btn--primary btn--lg btn--block" onClick={onNext}>Scan next</button>
    </div>
  )
}
