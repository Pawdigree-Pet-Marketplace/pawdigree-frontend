import { services } from '../../data/landing'
import useScrollReveal from '../../hooks/useScrollReveal'
import { CheckIcon } from '../icons'
import './Services.css'

export default function Services() {
  const servicesRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="container section" id="services">
      <div className="section-header">
        <h2 className="section-title">Trusted pet services</h2>

        <a href="#services" className="section-link">
          See All
        </a>
      </div>

      <div className="services-grid" ref={servicesRef}>
        {services.map((service, index) => (
          <article
            key={service.id}
            className={`service-card reveal reveal-delay-${index + 1}`}
          >
            <div className="service-media">
              <img
                src={service.image}
                alt={service.name}
                className="service-image"
              />
            </div>

            <div className="service-body">
              <div>
                <h3>{service.name}</h3>
                <p>{service.vendor}</p>
              </div>

              <span className="verified-pill">
                <CheckIcon width={16} height={16} />
                Verified
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}