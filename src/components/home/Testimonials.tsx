import { testimonials } from '../../data/landing'
import { StarIcon } from '../icons'
import './Testimonials.css'

export default function Testimonials() {
  return (
    <section className="container section" id="reviews">
      <h2 className="section-title">What buyers are saying</h2>

      <div className="testimonials-grid">
        {testimonials.map((review) => (
          <figure key={review.id} className="testimonial">
            <div className="testimonial-avatar" aria-hidden="true">
              {review.author.charAt(0)}
            </div>
            <div>
              <div
                className="testimonial-stars"
                role="img"
                aria-label={`${review.rating} out of 5 stars`}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} width={18} height={18} filled={n <= review.rating} />
                ))}
              </div>
              <blockquote>“{review.quote}”</blockquote>
              <figcaption>- {review.author}</figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  )
}