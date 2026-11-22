import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ROLE_LABEL, useAuth } from '../auth/AuthContext'
import Icon from './Icon'

/** App shell: sidebar navigation on desktop, slide-in drawer on mobile. */
export default function Layout({ nav }) {
  const { session, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const initial = (session?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <div className="brand__logo">M</div>
          <div>
            <div className="brand__name">Mega Job Fair</div>
            <div className="brand__sub">{ROLE_LABEL[session?.role]} portal</div>
          </div>
        </div>

        <nav className="nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="user">
            <div className="avatar">{initial}</div>
            <div className="user__meta">
              <div className="user__email" title={session?.email}>{session?.email}</div>
              <div className="user__role">{ROLE_LABEL[session?.role]}</div>
            </div>
          </div>
          <button className="btn btn--ghost btn--block" onClick={logout}>
            <Icon name="logout" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="backdrop" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <span className="topbar__title">Mega Job Fair</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
