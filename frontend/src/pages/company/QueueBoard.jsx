import { api } from '../../api/client'
import { useAuth } from '../../auth/AuthContext'
import { Alert, Card, EmptyState, LiveDot, PageHeader, Spinner, StatCard, StatusBadge } from '../../components/ui'
import { formatTime } from '../../components/format'
import usePolling from '../../components/usePolling'

/** Live queue for the signed-in company (company volunteer and HR). */
export default function QueueBoard() {
  const { session } = useAuth()
  const { data, error, loading, updatedAt } = usePolling(() => api.queueSummary(session.companyId), 4000, [session.companyId])

  return (
    <>
      <PageHeader
        title={data ? `${data.companyName} · Live queue` : 'Live queue'}
        subtitle="Refreshes every few seconds."
        actions={<LiveDot label={updatedAt ? `Live · updated ${formatTime(updatedAt)}` : 'Live'} />}
      />

      {error && <Alert tone="danger">{error.message}</Alert>}
      {loading && !data ? <Spinner /> : data && (
        <>
          <div className="stats">
            <StatCard label="Registered" value={data.registered + data.waiting + data.inInterview + data.selected + data.rejected} hint={`${data.registered} not in queue yet`} />
            <StatCard label="Waiting" value={data.waiting} tone="warning" />
            <StatCard label="In interview" value={data.inInterview} tone="info" />
            <StatCard label="Selected" value={data.selected} tone="success" />
            <StatCard label="Rejected" value={data.rejected} tone="danger" />
          </div>

          <div className="grid grid--2">
            <Card title="Waiting list" subtitle={`${data.waiting} in line`} padded={false}>
              <QueueTable items={data.waitingList} showPosition empty="Nobody is waiting." />
            </Card>
            <Card title="In interview" subtitle={`${data.inInterview} right now`} padded={false}>
              <QueueTable items={data.inInterviewList} empty="No interviews in progress." />
            </Card>
          </div>
        </>
      )}
    </>
  )
}

export function QueueTable({ items, showPosition, empty, actions }) {
  if (!items?.length) return <EmptyState icon="list" title={empty} />
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {showPosition && <th className="num">#</th>}
            <th>Student</th>
            <th>Department</th>
            <th>Joined</th>
            <th>Status</th>
            {actions && <th className="right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.registrationId}>
              {showPosition && <td className="num"><span className="position">{i.position ?? '–'}</span></td>}
              <td>
                <div className="cell-title">{i.studentName}</div>
                <div className="cell-sub">{i.registerNo || '–'}</div>
              </td>
              <td>{i.department || '–'}</td>
              <td>{formatTime(i.joinedAt)}</td>
              <td><StatusBadge status={i.status} /></td>
              {actions && <td className="right">{actions(i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
