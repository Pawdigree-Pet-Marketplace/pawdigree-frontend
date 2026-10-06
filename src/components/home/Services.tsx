import { services } from '../../data/landing'
import ImagePlaceholder from '../ImagePlaceholder'
import { CheckIcon } from '../icons'
import './Services.css'

export default function Services() {
  return (
    <section className="container section" id="services">
      <div className="section-header">
        <h2 className="section-title">Trusted pet services</h2>
        <a href="#services" className="section-link">
          See All
        </a>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <article key={service.id} className="service-card">
            <ImagePlaceholder
              emoji={service.emoji}
              label={service.name}
              className="service-image"
            />
            <div className="service-body">
              <div>
                <h3>{service.name}</h3>
                <p>{service.vendor}</p>
              </div>
              <span className="verified-pill">
                <CheckIcon width={16} height={16} /> Verified
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}