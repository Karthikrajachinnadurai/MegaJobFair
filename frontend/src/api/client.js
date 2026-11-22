// Single place that talks to the Spring Boot backend.
// Every request carries the JWT; a 401 logs the user out.

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '')
const SESSION_KEY = 'mjf_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

/** Error thrown for any non-2xx response. Carries the backend's ApiError fields. */
export class ApiRequestError extends Error {
  constructor(status, message, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors || null
  }
}

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

async function request(method, path, body) {
  const session = getSession()
  const headers = { 'Content-Type': 'application/json' }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`

  let res
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the server. Check that the backend is running.')
  }

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      clearSession()
      onUnauthorized()
    }
    const message = data?.message || data?.error || `Request failed (${res.status})`
    throw new ApiRequestError(res.status, message, data?.fieldErrors)
  }
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const api = {
  // auth
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),

  // admin
  dashboard: () => request('GET', '/api/admin/dashboard'),
  listCompanies: () => request('GET', '/api/admin/companies'),
  createCompany: (data) => request('POST', '/api/admin/companies', data),
  setCompanyActive: (id, value) => request('PATCH', `/api/admin/companies/${id}/active?value=${value}`),
  createCompanyUser: (companyId, data) => request('POST', `/api/admin/companies/${companyId}/users`, data),
  createGateVolunteer: (data) => request('POST', '/api/admin/gate-volunteers', data),
  listStudents: () => request('GET', '/api/admin/students'),
  createStudent: (data) => request('POST', '/api/admin/students', data),
  resetCredentials: (id) => request('POST', `/api/admin/students/${id}/reset-credentials`),

  // gate
  gateScan: (qrToken) => request('POST', '/api/gate/scan', { qrToken }),

  // student
  me: () => request('GET', '/api/student/me'),
  studentCompanies: () => request('GET', '/api/student/companies'),
  registerCompany: (companyId) => request('POST', `/api/student/companies/${companyId}/register`),
  myRegistrations: () => request('GET', '/api/student/registrations'),
  dropQueue: (companyId) => request('POST', `/api/student/queue/${companyId}/drop`),

  // company volunteer / HR (Module 2)
  queueScan: (qrToken) => request('POST', '/api/queue/scan', { qrToken }),
  queueSummary: (companyId) => request('GET', `/api/queue/${companyId}/summary`),
  hrSearch: (name) => request('GET', `/api/hr/search?name=${encodeURIComponent(name)}`),
  hrInInterview: (registrationId) => request('POST', `/api/hr/${registrationId}/in-interview`),
  hrDecision: (registrationId, decision) =>
    request('POST', `/api/hr/${registrationId}/decision`, { decision }),
}
