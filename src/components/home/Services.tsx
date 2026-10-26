import { useEffect, useState } from 'react'
import { apiRequest } from '../../services/api'
import useScrollReveal from '../../hooks/useScrollReveal'
import { CheckIcon } from '../icons'
import './Services.css'

type PublicBusiness = {
  id: string
  name: string
  description: string
  city_district: string
  categories: string[]
  logo: string | null
  cover_image: string | null
}

type ListResponse<T> = T[] | { results?: T[] }

const SERVICE_CATEGORY = /veterinary|vet clinic|groom|boarding|walking|daycare|training|pet care|pet sitting/i
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function getResults<T>(data: ListResponse<T>): T[] {
  if (Array.isArray(data)) return data
  return Array.isArray(data.results) ? data.results : []
}

function imageUrl(path: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

export default function Services() {
  const servicesRef = useScrollReveal<HTMLDivElement>()
  const [businesses, setBusinesses] = useState<PublicBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiRequest<ListResponse<PublicBusiness>>('/businesses/public/')
      .then((data) => {
        if (!cancelled) {
          setBusinesses(getResults(data).filter((business) =>
            business.categories?.some((category) => SERVICE_CATEGORY.test(category)),
          ))
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="container section" id="services">
      <div className="section-header">
        <h2 className="section-title">Trusted pet services</h2>
        <a href="#services" className="section-link">See All</a>
      </div>

      {loading ? <p role="status">Loading approved service providers…</p> : null}
      {!loading && failed ? <p role="status">Service providers are unavailable right now.</p> : null}
      {!loading && !failed && businesses.length === 0 ? (
        <p role="status">No approved service providers are listed yet.</p>
      ) : null}
      {!loading && !failed && businesses.length > 0 ? (
        <div className="services-grid" ref={servicesRef}>
          {businesses.map((business, index) => {
            const category = business.categories.find((name) => SERVICE_CATEGORY.test(name)) || 'Pet service'
            const image = imageUrl(business.cover_image || business.logo)
            return (
              <article key={business.id} className={`service-card reveal reveal-delay-${Math.min(index + 1, 4)}`}>
                {image ? <div className="service-media"><img src={image} alt="" className="service-image" /></div> : null}
                <div className="service-body">
                  <div>
                    <h3>{category}</h3>
                    <p>{business.name}{business.city_district ? ` · ${business.city_district}` : ''}</p>
                  </div>
                  <span className="verified-pill"><CheckIcon width={16} height={16} />Verified</span>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
