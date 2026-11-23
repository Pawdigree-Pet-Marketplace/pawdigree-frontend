import { useEffect, useRef } from 'react'

export default function useScrollReveal<T extends HTMLElement>(refreshToken?: unknown) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const container = ref.current

    if (!container) return

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'),
    )
    if (elements.length === 0) return

    const revealAll = () => elements.forEach((element) => element.classList.add('is-visible'))
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      revealAll()
      return
    }

    let observer: IntersectionObserver | undefined
    try {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.15 },
      )

      elements.forEach((element) => observer?.observe(element))
    } catch {
      observer?.disconnect()
      revealAll()
      return
    }

    return () => observer?.disconnect()
  }, [refreshToken])

  return ref
}
