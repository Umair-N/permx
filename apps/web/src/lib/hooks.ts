import { useCallback, useEffect, useRef, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'permx-theme'

export function useTheme(): [Theme, (next: Theme) => void, () => void] {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    const stored = (typeof window !== 'undefined'
      ? window.localStorage.getItem(THEME_KEY)
      : null) as Theme | null
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light')
    setThemeState(initial)
    document.documentElement.dataset.theme = initial
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.dataset.theme = next
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  return [theme, setTheme, toggle]
}

export function useReveal<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px', ...options },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [options])

  return { ref, shown }
}

export function useCountUp(target: number, duration = 1200, start: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const elapsed = now - t0
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, start])

  return value
}

export function useActiveSection(ids: ReadonlyArray<string>): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter((n): n is HTMLElement => n !== null)

    if (nodes.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio ||
              a.boundingClientRect.top - b.boundingClientRect.top,
          )
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [ids])

  return active
}

export interface NpmInfo {
  name: string
  version: string | null
  weekly: number | null
  monthly: number | null
  loading: boolean
  url: string
}

const npmCache = new Map<string, NpmInfo>()

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function useNpmPackage(pkg: string): NpmInfo {
  const [info, setInfo] = useState<NpmInfo>(
    () =>
      npmCache.get(pkg) ?? {
        name: pkg,
        version: null,
        weekly: null,
        monthly: null,
        loading: true,
        url: `https://www.npmjs.com/package/${pkg}`,
      },
  )

  useEffect(() => {
    const cached = npmCache.get(pkg)
    if (cached && !cached.loading) {
      setInfo(cached)
      return
    }

    let cancelled = false
    const load = async () => {
      const [reg, week, month] = await Promise.all([
        fetchJson<{ 'dist-tags'?: { latest?: string } }>(
          `https://registry.npmjs.org/${pkg}`,
        ),
        fetchJson<{ downloads: number }>(
          `https://api.npmjs.org/downloads/point/last-week/${pkg}`,
        ),
        fetchJson<{ downloads: number }>(
          `https://api.npmjs.org/downloads/point/last-month/${pkg}`,
        ),
      ])
      if (cancelled) return
      const next: NpmInfo = {
        name: pkg,
        version: reg?.['dist-tags']?.latest ?? null,
        weekly: week?.downloads ?? null,
        monthly: month?.downloads ?? null,
        loading: false,
        url: `https://www.npmjs.com/package/${pkg}`,
      }
      npmCache.set(pkg, next)
      setInfo(next)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [pkg])

  return info
}

export function useCopy(resetAfterMs = 1600) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(
          () => setCopied(false),
          resetAfterMs,
        )
      } catch {
        /* ignore */
      }
    },
    [resetAfterMs],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  return { copied, copy }
}
