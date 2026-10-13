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

// TODO: point each link at its real page once those pages exist.
const items = [
  { label: 'My orders', icon: ShoppingBag },
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
        {items.map(({ label, icon: Icon }) => (
          <li key={label}>
            <a href="#" className="profile-menu-item">
              <Icon size={22} className="profile-menu-icon" aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight
                size={20}
                className="profile-menu-chevron"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}