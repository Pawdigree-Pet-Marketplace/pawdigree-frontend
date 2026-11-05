import adoptionImage from '../../assets/images/adoption.jpg'
import useScrollReveal from '../../hooks/useScrollReveal'
import { CheckIcon } from '../icons'
import { Link } from 'react-router-dom'
import './Adoption.css'

const points = [
  'Pets looking for a home, listed by verified vendors',
  'Adoption fees shown clearly before you commit',
  'Health and vaccination details shared by the vendor',
]

export default function Adoption() {
  const adoptionRef = useScrollReveal<HTMLDivElement>()

  return (
    <section
      ref={adoptionRef}
      className="container section adoption"
      id="adoption"
    >
      <div className="adoption-content">
        <p className="adoption-eyebrow reveal">
          GIVE A PET A HOME
        </p>

        <h2 className="reveal reveal-delay-1">
          Every pet deserves a loving home
        </h2>

        <p className="adoption-text reveal reveal-delay-2">
          Skip the stress and adopt from people you can trust. Meet pets who
          are ready for their forever family.
        </p>

        <ul className="adoption-points reveal reveal-delay-3">
          {points.map((point) => (
            <li key={point}>
              <span className="adoption-check">
                <CheckIcon width={16} height={16} />
              </span>
              {point}
            </li>
          ))}
        </ul>

        <Link
          to="/explore-pets?listing_type=ADOPTION"
          className="btn adoption-btn reveal reveal-delay-4"
        >
          Browse adoptable pets
        </Link>
      </div>

      <div className="adoption-photo reveal reveal-delay-2">
        <img
          src={adoptionImage}
          alt="A puppy ready for adoption"
        />
      </div>
    </section>
  )
}
