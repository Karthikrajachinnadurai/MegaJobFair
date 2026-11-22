import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Calls `fetcher` now and then every `intervalMs`. Pauses while the tab is hidden
 * and stops when the component unmounts, so no stray requests after logout.
 */
export default function usePolling(fetcher, intervalMs = 5000, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(null)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let timer
    const tick = async () => {
      if (!document.hidden) await load()
      timer = setTimeout(tick, intervalMs)
    }
    setLoading(true)
    tick()
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, load, ...deps])

  return { data, error, loading, updatedAt, reload: load, setData }
}
