export interface NavLink {
  label: string
  href: string
}

export interface Stat {
  value: string
  label: string
}

export interface Category {
  name: string
  emoji: string
}

export interface MerchItem {
  name: string
  emoji: string
}

export interface Listing {
  id: number
  name: string
  details: string
  priceLines: { label?: string; value: string; strong?: boolean }[]
  forSale: boolean
  emoji: string
}

export interface Service {
  id: number
  name: string
  vendor: string
  emoji: string
}

export interface Testimonial {
  id: number
  quote: string
  author: string
  rating: number
}

export const navLinks: NavLink[] = [
  { label: 'Pets', href: '#pets' },
  { label: 'Services', href: '#services' },
  { label: 'Merchandise', href: '#merchandise' },
  { label: 'Adoption', href: '#adoption' },
]

export const stats: Stat[] = [
  { value: '3400+', label: 'Listings' },
  { value: '980+', label: 'verified vendors' },
  { value: '4.8', label: 'Average rating' },
]

export const categories: Category[] = [
  { name: 'Dogs', emoji: '🐕' },
  { name: 'Cats', emoji: '🐈' },
  { name: 'Birds', emoji: '🦜' },
  { name: 'Rabbits', emoji: '🐇' },
  { name: 'Aquatic', emoji: '🐠' },
]

export const merchandise: MerchItem[] = [
  { name: 'Consumables', emoji: '🦴' },
  { name: 'Play and Comfort', emoji: '🧸' },
  { name: 'Accessories', emoji: '🦮' },
  { name: 'Beds and Carriers', emoji: '🛏️' },
  { name: 'Grooming Supplies', emoji: '🧴' },
  { name: 'Health and Care', emoji: '💊' },
]

export const listings: Listing[] = [
  {
    id: 1,
    name: 'Bella',
    details: 'Golden Retriever · 8 months',
    priceLines: [
      { label: 'Adoption Fee:', value: 'UGX 80,000', strong: true },
      { label: 'Pet Price:', value: 'Free', strong: true },
    ],
    forSale: false,
    emoji: '🐕',
  },
  {
    id: 2,
    name: 'Milo',
    details: 'Persian Cat · 1 year',
    priceLines: [{ label: 'Price:', value: 'UGX 450,000', strong: true }],
    forSale: true,
    emoji: '🐈',
  },
  {
    id: 3,
    name: 'Kakito',
    details: 'Chinchilla · 8 months',
    priceLines: [{ value: 'UGX 150,000', strong: true }],
    forSale: true,
    emoji: '🐇',
  },
  {
    id: 4,
    name: 'Mimi and Luna',
    details: 'Domestic Shorthair · 8 weeks',
    priceLines: [{ value: 'UGX 0', strong: true }],
    forSale: false,
    emoji: '🐱',
  },
]

export const services: Service[] = [
  {
    id: 1,
    name: 'Grooming & Spa',
    vendor: 'KAMPI DOG CLINIC - ENTEBBE',
    emoji: '🛁',
  },
  {
    id: 2,
    name: 'Pet Walking',
    vendor: "GOD'S MERCY PET SERVICES - MUKONO",
    emoji: '🦮',
  },
]

// Only the first review comes from the design; the others are placeholders.
export const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: 'Found a healthy puppy with full vaccination records within two days.',
    author: 'Grace N.',
    rating: 4,
  },
  {
    id: 2,
    quote: 'Placeholder review text. Replace with a real buyer review.',
    author: 'Placeholder A.',
    rating: 5,
  },
  {
    id: 3,
    quote: 'Placeholder review text. Replace with a real buyer review.',
    author: 'Placeholder B.',
    rating: 5,
  },
]