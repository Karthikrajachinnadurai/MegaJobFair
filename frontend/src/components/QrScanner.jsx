import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Icon from './Icon'

/**
 * Camera QR scanner with a manual-entry fallback.
 * Calls onScan(token) once per code; `paused` stops new scans while a result is shown.
 * Note: phone browsers only allow the camera on HTTPS or localhost.
 */
export default function QrScanner({ onScan, paused = false }) {
  const regionId = useRef(`qr-${Math.random().toString(36).slice(2)}`).current
  const scannerRef = useRef(null)
  const pausedRef = useRef(paused)
  const onScanRef = useRef(onScan)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [manual, setManual] = useState('')

  pausedRef.current = paused
  onScanRef.current = onScan

  useEffect(() => () => stopCamera(), []) // stop the camera when leaving the page

  async function startCamera() {
    setCameraError('')
    if (!window.isSecureContext) {
      setCameraError('Camera needs HTTPS (or localhost). Use manual entry below, or open the site over HTTPS.')
      return
    }
    try {
      const scanner = new Html5Qrcode(regionId, { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s } } },
        (text) => {
          if (pausedRef.current) return
          pausedRef.current = true // block duplicates until the parent unpauses
          onScanRef.current(text.trim())
        },
        () => {},
      )
      setCameraOn(true)
    } catch (e) {
      scannerRef.current = null
      setCameraError(e?.message?.includes('Permission') || e?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow it in the browser settings and try again.'
        : 'Could not start the camera. Use manual entry below.')
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current
    scannerRef.current = null
    setCameraOn(false)
    if (scanner) {
      try { await scanner.stop() } catch { /* already stopped */ }
      try { scanner.clear() } catch { /* ignore */ }
    }
  }

  function submitManual(e) {
    e.preventDefault()
    const token = manual.trim()
    if (!token || paused) return
    onScan(token)
    setManual('')
  }

  return (
    <div className="scanner">
      <div className={`scanner__view ${cameraOn ? 'scanner__view--on' : ''}`}>
        <div id={regionId} className="scanner__region" />
        {!cameraOn && (
          <div className="scanner__placeholder">
            <div className="scanner__placeholder-icon"><Icon name="camera" size={28} /></div>
            <p>Point the camera at the student's QR code</p>
            <button className="btn btn--primary" onClick={startCamera}>
              <Icon name="camera" /> Start camera
            </button>
          </div>
        )}
      </div>

      {cameraOn && (
        <button className="btn btn--ghost btn--block" onClick={stopCamera}>Stop camera</button>
      )}
      {cameraError && <p className="field__error">{cameraError}</p>}

      <form className="scanner__manual" onSubmit={submitManual}>
        <input
          className="input"
          placeholder="Or paste / type the QR token"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <button className="btn btn--secondary" type="submit" disabled={!manual.trim() || paused}>Submit</button>
      </form>
    </div>
  )
}
