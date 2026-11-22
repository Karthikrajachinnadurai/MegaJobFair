export function formatTime(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** Simple random password that meets the backend's 8-character minimum. */
export function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}
