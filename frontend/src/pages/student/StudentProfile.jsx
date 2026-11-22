import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { Alert, Badge, Card, PageHeader, Spinner } from '../../components/ui'
import { formatDateTime } from '../../components/format'

export default function StudentProfile() {
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.me().then(setMe).catch((e) => setError(e.message))
  }, [])

  return (
    <>
      <PageHeader title="My profile" subtitle="Details from your job fair registration." />
      {error && <Alert tone="danger">{error}</Alert>}
      {!me && !error ? (
        <Spinner />
      ) : me && (
        <Card>
          <div className="profile">
            <div className="avatar avatar--lg">{me.name.charAt(0).toUpperCase()}</div>
            <div>
              <h2 className="profile__name">{me.name}</h2>
              <div className="muted">{me.email}</div>
            </div>
            {me.checkedIn && <Badge tone="success">Checked in {formatDateTime(me.checkedInAt)}</Badge>}
          </div>
          <dl className="details details--grid">
            <div><dt>Register no</dt><dd>{me.registerNo || '–'}</dd></div>
            <div><dt>Department</dt><dd>{me.department || '–'}</dd></div>
            <div><dt>Year of study</dt><dd>{me.studyYear || '–'}</dd></div>
            <div><dt>Phone</dt><dd>{me.phone || '–'}</dd></div>
          </dl>
          <p className="muted small">If any detail is wrong, contact the help desk.</p>
        </Card>
      )}
    </>
  )
}
