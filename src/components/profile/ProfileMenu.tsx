
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Heart,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import './ProfileMenu.css'

const items = [
  { label: 'My orders', icon: ShoppingBag, path: '/customer/orders' },
  { label: 'Adoption applications', icon: FileText },
  { label: 'My bookings', icon: CalendarDays },
  { label: 'Saved pets', icon: Heart },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Security & password', icon: ShieldCheck },
]

export default function ProfileMenu() {
  return (
    <nav aria-label="Account">
      <ul className="profile-menu">
        {items.map(({ label, icon: Icon, path }) => (
          <li key={label}>
            {path ? (
              <Link to={path} className="profile-menu-item">
                <Icon size={22} className="profile-menu-icon" aria-hidden="true" />
                <span>{label}</span>
                <ChevronRight
                  size={20}
                  className="profile-menu-chevron"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <a href="#" className="profile-menu-item">
                <Icon size={22} className="profile-menu-icon" aria-hidden="true" />
                <span>{label}</span>
                <ChevronRight
                  size={20}
                  className="profile-menu-chevron"
                  aria-hidden="true"
                />
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
