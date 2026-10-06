import ImagePlaceholder from '../ImagePlaceholder'
import { CheckIcon } from '../icons'
import './Adoption.css'

const points = [
  'Pets looking for a home, listed by verified vendors',
  'Adoption fees shown clearly before you commit',
  'Health and vaccination details shared by the vendor',
]

export default function Adoption() {
  return (
    <section className="container section adoption" id="adoption">
      <div className="adoption-content">
        <p className="adoption-eyebrow">GIVE A PET A HOME</p>
        <h2>Every pet deserves a loving home</h2>
        <p className="adoption-text">
          Skip the stress and adopt from people you can trust. Meet pets who
          are ready for their forever family.
        </p>

        <ul className="adoption-points">
          {points.map((point) => (
            <li key={point}>
              <span className="adoption-check">
                <CheckIcon width={16} height={16} />
              </span>
              {point}
            </li>
          ))}
        </ul>

        <a href="#pets" className="btn">
          Browse adoptable pets
        </a>
      </div>

      <div className="adoption-photo">
        <ImagePlaceholder emoji="🐶" label="A puppy ready for adoption" />
      </div>
    </section>
  )
}