import "./App.css";

function App() {
  return (
    <div className="app">
      {/* Navigation */}
      <header className="navbar">
        <a href="/" className="logo">
          Pawdigree
        </a>

        <nav className="desktop-nav">
          <a href="#pets">Pets</a>
          <a href="#services">Services</a>
          <a href="#merchandise">Merchandise</a>
          <a href="#adoption">Adoption</a>
        </nav>

        <div className="navbar-actions">
          <button aria-label="Shopping cart">🛒</button>
          <button aria-label="Account">👤</button>
          <button className="login-button">Log In</button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">UGANDA'S PET MARKETPLACE</p>

            <h1>
              Find your next pet
              <br />
              from verified sellers
              <br />
              near you
            </h1>

            <p className="hero-description">
              Discover pets, trusted services, pet products and adoption
              opportunities — all in one place.
            </p>

            <div className="hero-actions">
              <button className="primary-button">
                Create Account
              </button>

              <p>
                Already have an account?{" "}
                <button className="text-button">Log In</button>
              </p>
            </div>
          </div>

          <div className="hero-image">
            <div className="search-bar">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search pets, services, products"
              />

              <button aria-label="Filter">☷</button>
            </div>

            <div className="hero-image-placeholder">
              <span>🐕</span>
              <span>🐈</span>
            </div>
          </div>
        </section>

        {/* Marketplace stats */}
        <section className="stats">
          <div>
            <strong>3400+</strong>
            <span>Listings</span>
          </div>

          <div>
            <strong>980+</strong>
            <span>Verified Vendors</span>
          </div>

          <div>
            <strong>4.8</strong>
            <span>Average Rating</span>
          </div>
        </section>

        {/* More landing-page sections will go here */}
      </main>
    </div>
  );
}

export default App;