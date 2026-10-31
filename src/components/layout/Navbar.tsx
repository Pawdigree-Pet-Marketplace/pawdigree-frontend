
import { navLinks } from '../../data/landing';
import { CartIcon, UserIcon } from '../icons';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span aria-hidden="true">🐾</span> Pawdigree
        </Link>

        <nav className="navbar-links" aria-label="Main">
          {navLinks.map((link) => {
            const linkPath =
              link.href.split('?')[0].replace(/\/+$/, '') || '/';

            const isActive = currentPath === linkPath;

            return (
              <Link
                key={link.label}
                to={link.href}
                className={`navbar-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
              </Link>
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
