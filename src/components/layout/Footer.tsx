import useScrollReveal from '../../hooks/useScrollReveal'
import './Footer.css'

export default function Footer() {
  const footerRef = useScrollReveal<HTMLDivElement>()

  return (
    <footer className="footer">
      <div className="container footer-inner" ref={footerRef}>
        <div className="footer-main">
          <div className="footer-brand reveal">
            <a href="/" className="footer-logo-link" aria-label="Pawdigree home">
              <img
                src="/src/assets/logo.png"
                alt="Pawdigree"
                className="footer-logo"
              />
            </a>

            <p>
              Find your perfect
              <br />
              pet companion.
            </p>
          </div>

          <div className="footer-links reveal reveal-delay-1">
            <div className="footer-column">
              <h3>Marketplace</h3>
              <a href="#pets">Browse Pets</a>
              <a href="#categories">Categories</a>
              <a href="#merchandise">Shop Merchandise</a>
              <a href="#services">Pet Services</a>
            </div>

            <div className="footer-column">
              <h3>Company</h3>
              <a href="#how-it-works">How It Works</a>
              <a href="#reviews">Reviews</a>
              <a href="#adoption">Adoption</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="footer-column">
              <h3>Legal</h3>
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
            </div>
          </div>
        </div>

        <div className="footer-divider reveal reveal-delay-2" />

        <div className="footer-bottom reveal reveal-delay-3">
          <p>© 2026 Pawdigree, Uganda</p>
          <span>Made for pets. Built for people.</span>
        </div>
      </div>
    </footer>
  )
}