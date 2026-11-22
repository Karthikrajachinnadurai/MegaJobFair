import { useEffect } from 'react'
import Icon from './Icon'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function Card({ title, subtitle, actions, children, padded = true, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card__header">
          <div>
            {title && <h2 className="card__title">{title}</h2>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'card__body' : ''}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, tone = 'default', hint }) {
  return (
    <div className={`stat stat--${tone}`}>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value ?? '–'}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  )
}

const STATUS_LABEL = {
  REGISTERED: 'Registered',
  WAITING: 'Waiting',
  IN_INTERVIEW: 'In interview',
  SELECTED: 'Selected',
  REJECTED: 'Rejected',
}

export function StatusBadge({ status }) {
  return <span className={`badge badge--${String(status).toLowerCase()}`}>{STATUS_LABEL[status] || status}</span>
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Alert({ tone = 'info', title, children, onClose }) {
  const icon = tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'alert'
  return (
    <div className={`alert alert--${tone}`} role="status">
      <Icon name={icon} />
      <div className="alert__body">
        {title && <div className="alert__title">{title}</div>}
        {children && <div>{children}</div>}
      </div>
      {onClose && (
        <button className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Dismiss">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'info', title, children }) {
  return (
    <div className="empty">
      <div className="empty__icon"><Icon name={icon} size={22} /></div>
      <div className="empty__title">{title}</div>
      {children && <div className="empty__text">{children}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="loading">
      <span className="spinner" /> {label}
    </div>
  )
}

export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function LiveDot({ label = 'Live' }) {
  return (
    <span className="live"><span className="live__dot" />{label}</span>
  )
}
