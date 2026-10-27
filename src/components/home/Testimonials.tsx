import useScrollReveal from '../../hooks/useScrollReveal'
import './Testimonials.css'

export default function Testimonials() {
  const testimonialsRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="container section" id="reviews">
      <h2 className="section-title">What buyers are saying</h2>
      <div className="testimonials-grid" ref={testimonialsRef}>
        <p className="reviews-unavailable" role="status">
          Customer reviews will appear here when verified review data is available.
        </p>
      </div>
    </section>
  )
}
