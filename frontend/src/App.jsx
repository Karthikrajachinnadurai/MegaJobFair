import { Navigate, Route, Routes } from 'react-router-dom'
import { HOME_BY_ROLE, useAuth } from './auth/AuthContext'
import RequireRole from './auth/RequireRole'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import Companies from './pages/admin/Companies'
import Students from './pages/admin/Students'
import GateVolunteers from './pages/admin/GateVolunteers'
import GateScan from './pages/gate/GateScan'
import StudentCompanies from './pages/student/StudentCompanies'
import MyRegistrations from './pages/student/MyRegistrations'
import StudentProfile from './pages/student/StudentProfile'
import CompanyScan from './pages/company/CompanyScan'
import QueueBoard from './pages/company/QueueBoard'
import HrPanel from './pages/hr/HrPanel'

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
    { to: '/admin/companies', label: 'Companies', icon: 'building' },
    { to: '/admin/students', label: 'Students', icon: 'users' },
    { to: '/admin/gate-volunteers', label: 'Gate volunteers', icon: 'key' },
    { to: '/admin/gate-scan', label: 'Gate scanner', icon: 'scan' },
  ],
  gate: [{ to: '/gate', label: 'Gate check-in', icon: 'scan', end: true }],
  student: [
    { to: '/student', label: 'Companies', icon: 'building', end: true },
    { to: '/student/registrations', label: 'My registrations', icon: 'qr' },
    { to: '/student/profile', label: 'Profile', icon: 'user' },
  ],
  company: [
    { to: '/company', label: 'Add to queue', icon: 'scan', end: true },
    { to: '/company/queue', label: 'Live queue', icon: 'list' },
  ],
  hr: [
    { to: '/hr', label: 'Interviews', icon: 'briefcase', end: true },
    { to: '/hr/queue', label: 'Live queue', icon: 'list' },
  ],
}

function Home() {
  const { session } = useAuth()
  return <Navigate to={session ? HOME_BY_ROLE[session.role] || '/login' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireRole roles={['ADMIN']} />}>
        <Route element={<Layout nav={NAV.admin} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/companies" element={<Companies />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/gate-volunteers" element={<GateVolunteers />} />
          <Route path="/admin/gate-scan" element={<GateScan />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['GATE_VOLUNTEER']} />}>
        <Route element={<Layout nav={NAV.gate} />}>
          <Route path="/gate" element={<GateScan />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['STUDENT']} />}>
        <Route element={<Layout nav={NAV.student} />}>
          <Route path="/student" element={<StudentCompanies />} />
          <Route path="/student/registrations" element={<MyRegistrations />} />
          <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['COMPANY_VOLUNTEER']} />}>
        <Route element={<Layout nav={NAV.company} />}>
          <Route path="/company" element={<CompanyScan />} />
          <Route path="/company/queue" element={<QueueBoard />} />
        </Route>
      </Route>

      <Route element={<RequireRole roles={['HR']} />}>
        <Route element={<Layout nav={NAV.hr} />}>
          <Route path="/hr" element={<HrPanel />} />
          <Route path="/hr/queue" element={<QueueBoard />} />
        </Route>
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
