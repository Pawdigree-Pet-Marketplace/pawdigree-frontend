import { listings } from '../../data/landing'
import ImagePlaceholder from '../ImagePlaceholder'
import { HeartIcon } from '../icons'
import './Listings.css'

export default function Listings() {
  return (
    <section className="container section" id="pets">
      <div className="section-header">
        <h2 className="section-title">Popular pet listings</h2>
        <a href="#pets" className="section-link">
          See All
        </a>
      </div>

      <div className="listings-grid">
        {listings.map((pet) => (
          <article key={pet.id} className="listing-card">
            <div className="listing-media">
              <ImagePlaceholder
                emoji={pet.emoji}
                label={pet.name}
                className="listing-image"
              />
              {pet.forSale && <span className="listing-badge">For Sale</span>}
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