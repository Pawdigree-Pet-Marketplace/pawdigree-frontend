import { listings } from '../../data/landing'
import useScrollReveal from '../../hooks/useScrollReveal'
import { HeartIcon } from '../icons'
import './Listings.css'

export default function Listings() {
  const listingsRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="container section" id="pets">
      <div className="section-header">
        <h2 className="section-title">Popular pet listings</h2>

        <a href="#pets" className="section-link">
          See All
        </a>
      </div>

      <div className="listings-grid" ref={listingsRef}>
        {listings.map((pet, index) => (
          <article
            key={pet.id}
            className={`listing-card reveal reveal-delay-${Math.min(
              index + 1,
              4,
            )}`}
          >
            <div className="listing-media">
              <img
                src={pet.image}
                alt={pet.name}
                className="listing-image"
              />

              {pet.forSale && (
                <span className="listing-badge">For Sale</span>
              )}

              <button
                type="button"
                className="listing-heart"
                aria-label={`Save ${pet.name}`}
              >
                <HeartIcon />
              </button>
            </div>

            <div className="listing-body">
              <h3>{pet.name}</h3>

              <p className="listing-details">{pet.details}</p>

              {pet.priceLines.map((line) => (
                <p key={line.value} className="listing-price">
                  {line.label && <span>{line.label} </span>}
                  {line.value}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}