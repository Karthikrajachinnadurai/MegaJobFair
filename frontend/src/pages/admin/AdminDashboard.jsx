import { useMemo, useState } from 'react'
import { api } from '../../api/client'
import { Alert, Badge, Card, EmptyState, LiveDot, PageHeader, Spinner, StatCard } from '../../components/ui'
import { formatTime } from '../../components/format'
import usePolling from '../../components/usePolling'

const LONG_QUEUE = 15

export default function AdminDashboard() {
  const { data, error, loading, updatedAt } = usePolling(api.dashboard, 5000)
  const [filter, setFilter] = useState('')

  const companies = useMemo(() => {
    const list = data?.companies || []
    const q = filter.trim().toLowerCase()
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list
  }, [data, filter])

  const totals = useMemo(() => {
    const sum = (k) => (data?.companies || []).reduce((acc, c) => acc + (c[k] || 0), 0)
    return {
      registrations: sum('totalRegistrations'),
      waiting: sum('waiting'),
      inInterview: sum('inInterview'),
      selected: sum('selected'),
    }
  }, [data])

  const checkInRate = data?.totalStudents ? Math.round((data.checkedIn / data.totalStudents) * 100) : 0

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of the fair. Updates every 5 seconds."
        actions={<LiveDot label={updatedAt ? `Live · updated ${formatTime(updatedAt)}` : 'Live'} />}
      />

      {error && <Alert tone="danger">{error.message}</Alert>}
      {loading && !data ? (
        <Spinner />
      ) : data && (
        <>
          <div className="stats">
            <StatCard label="Students imported" value={data.totalStudents} hint={`${data.totalCompanies} companies`} />
            <StatCard label="Checked in" value={data.checkedIn} tone="primary" hint={`${checkInRate}% of imported`} />
            <StatCard label="Registrations" value={totals.registrations} />
            <StatCard label="Waiting now" value={totals.waiting} tone="warning" />
            <StatCard label="In interview" value={totals.inInterview} tone="info" />
            <StatCard label="Selected" value={totals.selected} tone="success" />
          </div>

          <Card
            title="Companies"
            subtitle={`Queues longer than ${LONG_QUEUE} are highlighted`}
            padded={false}
            actions={
              <input
                className="input input--sm"
                placeholder="Search company"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            }
          >
            {companies.length === 0 ? (
              <EmptyState icon="building" title="No companies yet">Add companies from the Companies page.</EmptyState>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Cabin</th>
                      <th className="num">Registered</th>
                      <th className="num">Waiting</th>
                      <th className="num">In interview</th>
                      <th className="num">Selected</th>
                      <th className="num">Rejected</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.companyId} className={c.waiting >= LONG_QUEUE ? 'row--warn' : ''}>
                        <td>
                          <div className="cell-title">{c.name}</div>
                          {!c.active && <Badge tone="neutral">Inactive</Badge>}
                          {c.active && c.waiting === 0 && c.inInterview === 0 && c.totalRegistrations > 0 && (
                            <Badge tone="neutral">Idle</Badge>
                          )}
                        </td>
                        <td>{c.cabinNo || '–'}</td>
                        <td className="num">{c.registered}</td>
                        <td className="num"><strong>{c.waiting}</strong></td>
                        <td className="num">{c.inInterview}</td>
                        <td className="num text-success">{c.selected}</td>
                        <td className="num text-danger">{c.rejected}</td>
                        <td className="num">{c.totalRegistrations}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </>
  )
}
