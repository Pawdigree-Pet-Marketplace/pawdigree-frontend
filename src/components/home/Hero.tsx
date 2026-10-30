import heroimage from "../../assets/images/heroimage.jpg";
import { ClipboardCheck, Heart, ShieldCheck } from "lucide-react";
import { FilterIcon, SearchIcon } from "../icons";
import useScrollReveal from "../../hooks/useScrollReveal";
import "./Hero.css";


export default function Hero() {
  const contentRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo">
        <img
          src={heroimage}
          alt="Pets available on Pawdigree"
          className="hero-photo-fill"
        />
      </div>

      <div ref={contentRef} className="hero-content">
        <h1 id="hero-title" className="reveal">
          Find your next pet from <span>verified sellers</span> near you
        </h1>

        <p className="reveal reveal-delay-1">
          Browse, adopt, buy and book care from verified vendors across Uganda,
          all in one place.
        </p>

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

        <ul className="hero-trust reveal reveal-delay-2" aria-label="Why shop with Pawdigree">
          <li><ShieldCheck size={16} aria-hidden="true" /> Verified vendors</li>
          <li><ClipboardCheck size={16} aria-hidden="true" /> Reviewed listings</li>
          <li><Heart className="hero-trust-heart" size={16} aria-hidden="true" /> Pet care in one place</li>
        </ul>

      </div>


<div className="hero-floaties" aria-hidden="true">
  {/* Paw prints — matching your reference */}
  <svg className="floaty floaty-paw paw-a" viewBox="0 0 100 100" fill="none">
    <g stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
      <ellipse cx="30" cy="29" rx="9" ry="15" transform="rotate(-25 30 29)" />
      <ellipse cx="43" cy="18" rx="9" ry="15" transform="rotate(-8 43 18)" />
      <ellipse cx="60" cy="18" rx="9" ry="15" transform="rotate(8 60 18)" />
      <ellipse cx="73" cy="29" rx="9" ry="15" transform="rotate(25 73 29)" />
      <path d="M23 62 C27 51 36 45 42 36 C46 30 54 30 58 36 C64 45 73 51 77 62 C82 75 72 82 61 78 C54 75 46 75 39 78 C28 82 18 75 23 62Z" />
    </g>
  </svg>

  <svg className="floaty floaty-bone bone-a" viewBox="0 0 100 60" fill="none">
    <path d="M29 19 C23 10 12 12 12 22 C12 27 16 30 20 30 L72 30 C76 30 80 27 80 22 C80 12 69 10 63 19 C55 28 37 28 29 19Z"
      stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      transform="rotate(-25 50 30)" />
  </svg>

  <svg className="floaty floaty-heart heart-a" viewBox="0 0 40 40" fill="none">
    <path d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
      stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>

  <svg className="floaty floaty-sparkle sparkle-a" viewBox="0 0 40 40" fill="none">
    <path d="M20 3 L24 16 L37 20 L24 24 L20 37 L16 24 L3 20 L16 16Z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>

  <svg className="floaty floaty-paw paw-b" viewBox="0 0 100 100" fill="none">
    <g stroke="currentColor" strokeWidth="5" strokeLinejoin="round">
      <ellipse cx="30" cy="29" rx="9" ry="15" transform="rotate(-25 30 29)" />
      <ellipse cx="43" cy="18" rx="9" ry="15" transform="rotate(-8 43 18)" />
      <ellipse cx="60" cy="18" rx="9" ry="15" transform="rotate(8 60 18)" />
      <ellipse cx="73" cy="29" rx="9" ry="15" transform="rotate(25 73 29)" />
      <path d="M23 62 C27 51 36 45 42 36 C46 30 54 30 58 36 C64 45 73 51 77 62 C82 75 72 82 61 78 C54 75 46 75 39 78 C28 82 18 75 23 62Z" />
    </g>
  </svg>

  <svg className="floaty floaty-sparkle sparkle-b" viewBox="0 0 40 40" fill="none">
    <path d="M20 3 L24 16 L37 20 L24 24 L20 37 L16 24 L3 20 L16 16Z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>

  <svg className="floaty floaty-bone bone-b" viewBox="0 0 100 60" fill="none">
    <path d="M29 19 C23 10 12 12 12 22 C12 27 16 30 20 30 L72 30 C76 30 80 27 80 22 C80 12 69 10 63 19 C55 28 37 28 29 19Z"
      stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      transform="rotate(-25 50 30)" />
  </svg>

  <svg className="floaty floaty-heart heart-b" viewBox="0 0 40 40" fill="none">
    <path d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
      stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>

  <svg className="floaty floaty-heart heart-c" viewBox="0 0 40 40" fill="none">
    <path d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
      stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>

  <svg className="floaty floaty-heart heart-d" viewBox="0 0 40 40" fill="none">
    <path d="M20 34 C16 29 5 22 5 13 C5 4 16 2 20 11 C24 2 35 4 35 13 C35 22 24 29 20 34Z"
      stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
</div>  
</section>
  );
}
