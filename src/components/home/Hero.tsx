import heroimage from '../../assets/images/heroimage.jpg'
import { FilterIcon, SearchIcon } from '../icons'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo">
        <img
          src={heroimage}
          alt="Pets available on Pawdigree"
          className="hero-photo-fill"
        />
      </div>

      <form className="hero-search" role="search" onSubmit={(e) => e.preventDefault()}>
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

      <div className="hero-content">
        <h1 id="hero-title">
          Find your next pet from <span>verified sellers</span> near you
        </h1>
        <p>
          Browse, adopt, buy and book care from verified vendors across Uganda,
          all in one place.
        </p>
        <button type="button" className="btn">
          Create Account
        </button>
        <p className="hero-login">
          Already have an account? <a href="/login">Log In</a>
        </p>
      </div>
    </section>
  )
}

