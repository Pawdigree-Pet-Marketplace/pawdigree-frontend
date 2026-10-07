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
  image: string
}

export interface MerchItem {
  name: string
  emoji: string
  image: string
}

export interface Listing {
  id: number
  name: string
  details: string
  priceLines: { label?: string; value: string; strong?: boolean }[]
  forSale: boolean
  emoji: string
  image: string
}

export interface Service {
  id: number
  name: string
  vendor: string
  emoji: string
  image: string
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
  {
    name: 'Dogs',
    emoji: '🐕',
    image: '/src/assets/images/dogs.jpg',
  },
  {
    name: 'Cats',
    emoji: '🐈',
    image: '/src/assets/images/cats.jpg',
  },
  {
    name: 'Birds',
    emoji: '🦜',
    image: '/src/assets/images/birds.jpg',
  },
  {
    name: 'Rabbits',
    emoji: '🐇',
    image: '/src/assets/images/rabbit.jpg',
  },
  {
    name: 'Aquatic',
    emoji: '🐠',
    image: '/src/assets/images/aquatic.jpg',
  },
]

export const merchandise: MerchItem[] = [
  {
    name: 'Consumables',
    emoji: '🦴',
    image: '/src/assets/images/consumables.jpg',
  },
  {
    name: 'Play and Comfort',
    emoji: '🧸',
    image: '/src/assets/images/play-and-comfort.jpg',
  },
  {
    name: 'Accessories',
    emoji: '🦮',
    image: '/src/assets/images/accessories.jpg',
  },
  {
    name: 'Beds and Carriers',
    emoji: '🛏️',
    image: '/src/assets/images/beds.jpg',
  },
  {
    name: 'Grooming Supplies',
    emoji: '🧴',
    image: '/src/assets/images/grooming.jpg',
  },
  {
    name: 'Health and Care',
    emoji: '💊',
    image: '/src/assets/images/veterinary.jpg',
  },
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
    image: '/src/assets/images/bella.jpg',
  },

  {
    id: 2,
    name: 'Milo',
    details: 'Persian Cat · 1 year',
    priceLines: [{ label: 'Price:', value: 'UGX 450,000', strong: true }],
    forSale: true,
    emoji: '🐈',
    image: '/src/assets/images/milo.jpg',
  },

  {
    id: 3,
    name: 'Kakito',
    details: 'Chinchilla · 8 months',
    priceLines: [{ value: 'UGX 150,000', strong: true }],
    forSale: true,
    emoji: '🐇',
    image: '/src/assets/images/kakito.jpg',
  },

  {
    id: 4,
    name: 'Mimi and Luna',
    details: 'Domestic Shorthair · 8 weeks',
    priceLines: [{ value: 'UGX 0', strong: true }],
    forSale: false,
    emoji: '🐱',
    image: '/src/assets/images/mimi.jpg',
  },
]

export const services: Service[] = [
  {
    id: 1,
    name: 'Grooming & Spa',
    vendor: 'KAMPI DOG CLINIC - ENTEBBE',
    emoji: '🛁',
    image: '/src/assets/images/spa.jpg',
  },
  {
    id: 2,
    name: 'Pet Walking',
    vendor: "GOD'S MERCY PET SERVICES - MUKONO",
    emoji: '🦮',
    image: '/src/assets/images/pet-walking.jpg',
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