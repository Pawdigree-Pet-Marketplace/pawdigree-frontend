
import { navLinks } from '../../data/landing';
import { CartIcon, UserIcon } from '../icons';
import './Navbar.css';

export default function Navbar() {
  const currentPath =
    window.location.pathname.replace(/\/+$/, '') || '/';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo">
          <span aria-hidden="true">🐾</span> Pawdigree
        </a>

        <nav className="navbar-links" aria-label="Main">
          {navLinks.map((link) => {
            const linkPath =
              link.href.split('?')[0].replace(/\/+$/, '') || '/';

            const isActive = currentPath === linkPath;

            return (
              <a
                key={link.label}
                href={link.href}
                className={`navbar-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Shopping cart"
          >
            <CartIcon />
          </button>

          <button
            type="button"
            className="icon-button"
            aria-label="Account"
          >
            <UserIcon />
          </button>

          <button type="button" className="navbar-login">
            Log In
          </button>
        </div>
      </div>
    </header>
  );
}
