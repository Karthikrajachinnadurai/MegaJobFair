import { useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../../api/client'
import { Alert, EmptyState, LiveDot, Modal, PageHeader, Spinner, StatusBadge } from '../../components/ui'
import usePolling from '../../components/usePolling'
import Icon from '../../components/Icon'

const STATUS_HELP = {
  REGISTERED: 'Go to the cabin and show this QR to the company volunteer to join the queue.',
  WAITING: 'You are in the queue. Stay near the cabin until HR calls your name.',
  IN_INTERVIEW: 'Your interview is in progress.',
  SELECTED: 'Congratulations! You have been selected.',
  REJECTED: 'Not selected this time. Keep going with other companies.',
}

export default function MyRegistrations() {
  const { data, error, loading, reload } = usePolling(api.myRegistrations, 5000)
  const [openQr, setOpenQr] = useState(null)
  const [confirmDrop, setConfirmDrop] = useState(null)
  const [message, setMessage] = useState(null)
  const [dropping, setDropping] = useState(false)

  const activeQueue = (data || []).find((r) => r.status === 'WAITING')

  async function drop() {
    const r = confirmDrop
    setDropping(true)
    try {
      await api.dropQueue(r.companyId)
      setMessage({ tone: 'success', text: `You left ${r.companyName}'s queue. You can now join another queue.` })
      await reload()
    } catch (e) {
      setMessage({ tone: 'danger', text: e.message })
    } finally {
      setDropping(false)
      setConfirmDrop(null)
    }
  }

  return (
    <>
      <PageHeader
        title="My registrations"
        subtitle="Show the company QR at the cabin to join that company's queue."
        actions={<LiveDot />}
      />

      {error && <Alert tone="danger">{error.message}</Alert>}
      {message && <Alert tone={message.tone} onClose={() => setMessage(null)}>{message.text}</Alert>}
      {activeQueue && (
        <Alert tone="info" title={`You are in ${activeQueue.companyName}'s queue`}>
          You can only be in one queue at a time. To join another company, drop this queue first.
        </Alert>
      )}

      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState icon="qr" title="No registrations yet">
          <Link to="/student" className="btn btn--primary btn--sm">Browse companies</Link>
        </EmptyState>
      ) : (
        <div className="reg-grid">
          {data.map((r) => (
            <article key={r.id} className={`reg-card reg-card--${r.status.toLowerCase()}`}>
              <div className="reg-card__head">
                <div>
                  <h3 className="reg-card__name">{r.companyName}</h3>
                  {r.cabinNo && <div className="company-card__meta"><Icon name="mapPin" size={14} /> Cabin {r.cabinNo}</div>}
                </div>
                <StatusBadge status={r.status} />
              </div>

              <button className="reg-card__qr" onClick={() => setOpenQr(r)} aria-label={`Open QR for ${r.companyName}`}>
                <QRCodeSVG value={r.companyQrToken} size={148} level="M" marginSize={0} />
                <span className="reg-card__qr-hint">Tap to enlarge</span>
              </button>

              <p className="reg-card__help">{STATUS_HELP[r.status]}</p>

              <div className="reg-card__foot">
                <span className="company-card__queue"><Icon name="clock" size={16} /><span><strong>{r.waitingCount}</strong> waiting</span></span>
                {r.status === 'WAITING' && (
                  <button className="btn btn--danger-ghost btn--sm" onClick={() => setConfirmDrop(r)}>Drop queue</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {openQr && (
        <Modal title={openQr.companyName} onClose={() => setOpenQr(null)}>
          <div className="qr-large">
            <QRCodeSVG value={openQr.companyQrToken} size={280} level="M" marginSize={2} />
            <p className="muted center">Show this to the {openQr.companyName} volunteer{openQr.cabinNo ? ` at cabin ${openQr.cabinNo}` : ''}.</p>
            <StatusBadge status={openQr.status} />
          </div>
        </Modal>
      )}

      {confirmDrop && (
        <Modal
          title="Drop this queue?"
          onClose={() => setConfirmDrop(null)}
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setConfirmDrop(null)}>Stay in queue</button>
              <button className="btn btn--danger" onClick={drop} disabled={dropping}>{dropping ? 'Dropping…' : 'Drop queue'}</button>
            </>
          }
        >
          <p>You will lose your place in <strong>{confirmDrop.companyName}</strong>'s queue. You stay registered and can be scanned back in later, but you will join at the end.</p>
        </Modal>
      )}
    </>
  )
}
