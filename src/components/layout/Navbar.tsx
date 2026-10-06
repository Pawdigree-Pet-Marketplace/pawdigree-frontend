import { navLinks } from '../../data/landing'
import { CartIcon, UserIcon } from '../icons'
import './Navbar.css'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <a href="/" className="navbar-logo">
          <span aria-hidden="true">🐾</span> Pawdigree
        </a>

        <nav className="navbar-links" aria-label="Main">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="navbar-actions">
          <button type="button" className="icon-button" aria-label="Shopping cart">
            <CartIcon />
          </button>
          <button type="button" className="icon-button" aria-label="Account">
            <UserIcon />
          </button>
          <button type="button" className="navbar-login">
            Log In
          </button>
        </div>
      </div>
    </header>
  )
}