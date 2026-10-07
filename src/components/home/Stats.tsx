import { useEffect, useRef, useState } from 'react'
import { stats } from '../../data/landing'
import './Stats.css'

function AnimatedNumber({ value }: { value: string }) {
  const [displayValue, setDisplayValue] = useState(() => {
    const number = Number.parseInt(value.replace(/\D/g, ''), 10)

    if (Number.isNaN(number)) {
      return value
    }

    return '0'
  })

  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const number = Number.parseInt(value.replace(/\D/g, ''), 10)

    if (Number.isNaN(number)) {
      return
    }

    const suffix = value.replace(/[0-9,]/g, '')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        const duration = 1200
        const startTime = performance.now()

        const animate = (currentTime: number) => {
          const progress = Math.min(
            (currentTime - startTime) / duration,
            1,
          )

          const easedProgress = 1 - Math.pow(1 - progress, 3)
          const currentValue = Math.floor(number * easedProgress)

          setDisplayValue(`${currentValue.toLocaleString()}${suffix}`)

          if (progress < 1) {
            requestAnimationFrame(animate)
          }
        }

        requestAnimationFrame(animate)
        observer.unobserve(element)
      },
      {
        threshold: 0.3,
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [value])

  return <strong ref={ref}>{displayValue}</strong>
}

export default function Stats() {
  return (
    <section className="container stats" aria-label="Marketplace stats">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <AnimatedNumber value={stat.value} />
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  )
}