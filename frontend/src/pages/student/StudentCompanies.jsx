import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Alert, Badge, EmptyState, LiveDot, PageHeader, Spinner } from '../../components/ui'
import usePolling from '../../components/usePolling'
import Icon from '../../components/Icon'

export default function StudentCompanies() {
  const { data: companies, error, loading, setData } = usePolling(api.studentCompanies, 10000)
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (companies || []).filter((c) =>
      !q || [c.name, c.rolesOffered, c.description].some((v) => v && v.toLowerCase().includes(q)))
  }, [companies, query])

  const registeredCount = (companies || []).filter((c) => c.registered).length

  async function register(c) {
    setBusyId(c.id)
    setMessage(null)
    try {
      await api.registerCompany(c.id)
      setData((list) => list.map((x) => (x.id === c.id ? { ...x, registered: true } : x)))
      setMessage({ tone: 'success', text: `Registered for ${c.name}. Your company QR is in My registrations.` })
    } catch (e) {
      setMessage({ tone: 'danger', text: e.message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Companies"
        subtitle="Register for the companies you want to interview with. Waiting counts update live."
        actions={<LiveDot />}
      />

      {error && <Alert tone="danger">{error.message}</Alert>}
      {message && <Alert tone={message.tone} onClose={() => setMessage(null)}>{message.text}</Alert>}

      <div className="toolbar toolbar--plain">
        <div className="search">
          <Icon name="search" />
          <input className="input" placeholder="Search by company or role" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {registeredCount > 0 && (
          <Link to="/student/registrations" className="btn btn--secondary">
            <Icon name="qr" /> My registrations ({registeredCount})
          </Link>
        )}
      </div>

      {loading && !companies ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState icon="building" title={companies?.length ? 'No matching companies' : 'No companies yet'}>
          {companies?.length ? 'Try a different search.' : 'Companies will appear here once the admin adds them.'}
        </EmptyState>
      ) : (
        <div className="company-grid">
          {list.map((c) => (
            <article key={c.id} className="company-card">
              <div className="company-card__head">
                <div className="company-card__logo">{c.name.charAt(0).toUpperCase()}</div>
                <div className="company-card__titles">
                  <h3 className="company-card__name">{c.name}</h3>
                  {c.cabinNo && <div className="company-card__meta"><Icon name="mapPin" size={14} /> Cabin {c.cabinNo}</div>}
                </div>
              </div>

              {c.rolesOffered && (
                <div className="chips">
                  {c.rolesOffered.split(',').map((r) => r.trim()).filter(Boolean).map((r) => (
                    <span key={r} className="chip">{r}</span>
                  ))}
                </div>
              )}
              {c.description && <p className="company-card__desc">{c.description}</p>}

              <div className="company-card__foot">
                <div className="company-card__queue">
                  <Icon name="clock" size={16} />
                  <span><strong>{c.waitingCount}</strong> waiting</span>
                </div>
                {c.registered ? (
                  <Badge tone="success">Registered</Badge>
                ) : (
                  <button className="btn btn--primary btn--sm" disabled={busyId === c.id} onClick={() => register(c)}>
                    {busyId === c.id ? 'Registering…' : 'Register'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
