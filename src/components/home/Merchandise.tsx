import { useRef, useState } from 'react'
import { merchandise } from '../../data/landing'
import useScrollReveal from '../../hooks/useScrollReveal'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import './Merchandise.css'

export default function Merchandise() {
  const trackRef = useRef<HTMLDivElement>(null)
  const merchRef = useScrollReveal<HTMLDivElement>()

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  // Enable or disable the arrows depending on where the track is scrolled
  const updateArrows = () => {
    const track = trackRef.current

    if (!track) return

    setCanPrev(track.scrollLeft > 0)
    setCanNext(
      track.scrollLeft + track.clientWidth < track.scrollWidth - 1,
    )
  }

  // Move the track by exactly one card
  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current
    const card = track?.firstElementChild

    if (!track || !card) return

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0

    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: 'smooth',
    })
  }

  return (
    <section className="container section" id="merchandise">
      <div className="section-header">
        <h2 className="section-title">Shop Pet Merchandise</h2>

        <div className="merch-controls">
          <button
            type="button"
            className="merch-arrow"
            aria-label="Previous items"
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
          >
            <ChevronLeftIcon />
          </button>

          <button
            type="button"
            className="merch-arrow"
            aria-label="Next items"
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="merch-track-wrapper" ref={merchRef}>
        <div
          className="merch-track"
          ref={trackRef}
          onScroll={updateArrows}
        >
          {merchandise.map((item, index) => (
            <a
              key={item.name}
              href="#merchandise"
              className={`merch-card reveal reveal-delay-${Math.min(
                index + 1,
                4,
              )}`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="merch-image"
              />

              <span>{item.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}