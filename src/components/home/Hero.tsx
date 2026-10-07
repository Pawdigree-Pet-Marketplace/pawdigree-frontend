import heroimage from '../../assets/images/heroimage.jpg'
import { FilterIcon, SearchIcon } from '../icons'
import useScrollReveal from '../../hooks/useScrollReveal'
import './Hero.css'

export default function Hero() {
  const contentRef = useScrollReveal<HTMLDivElement>()

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo">
        <img
          src={heroimage}
          alt="Pets available on Pawdigree"
          className="hero-photo-fill"
        />
      </div>

      <form
        className="hero-search"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <SearchIcon />
        <input
          type="search"
          placeholder="Search pets, services, products"
          aria-label="Search pets, services, products"
        />
        <button type="submit" aria-label="Filter and search">
          <FilterIcon />
        </button>
      </form>

    <div ref={contentRef} className="hero-content">
  <h1 id="hero-title" className="reveal">
    Find your next pet from <span>verified sellers</span> near you
  </h1>

  <p className="reveal reveal-delay-1">
    Browse, adopt, buy and book care from verified vendors across Uganda,
    all in one place.
  </p>

  <button type="button" className="btn reveal reveal-delay-2">
    Create Account
  </button>

  <p className="hero-login reveal reveal-delay-3">
    Already have an account? <a href="/login">Log In</a>
  </p>
</div>
    </section>
  )
}