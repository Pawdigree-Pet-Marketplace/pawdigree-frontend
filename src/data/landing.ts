import accessoriesImage from '../assets/images/accessories.jpg'
import aquaticImage from '../assets/images/aquatic.jpg'
import bedsImage from '../assets/images/beds.jpg'
import bellaImage from '../assets/images/bella.jpg'
import birdsImage from '../assets/images/birds.jpg'
import catsImage from '../assets/images/cats.jpg'
import consumablesImage from '../assets/images/consumables.jpg'
import dogsImage from '../assets/images/dogs.jpg'
import groomingImage from '../assets/images/grooming.jpg'
import kakitoImage from '../assets/images/kakito.jpg'
import miloImage from '../assets/images/milo.jpg'
import mimiImage from '../assets/images/mimi.jpg'
import petWalkingImage from '../assets/images/pet-walking.jpg'
import playAndComfortImage from '../assets/images/play-and-comfort.jpg'
import rabbitImage from '../assets/images/rabbit.jpg'
import spaImage from '../assets/images/spa.jpg'
import veterinaryImage from '../assets/images/veterinary.jpg'

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
    image: dogsImage,
  },
  {
    name: 'Cats',
    emoji: '🐈',
    image: catsImage,
  },
  {
    name: 'Birds',
    emoji: '🦜',
    image: birdsImage,
  },
  {
    name: 'Rabbits',
    emoji: '🐇',
    image: rabbitImage,
  },
  {
    name: 'Aquatic',
    emoji: '🐠',
    image: aquaticImage,
  },
]

export const merchandise: MerchItem[] = [
  {
    name: 'Consumables',
    emoji: '🦴',
    image: consumablesImage,
  },
  {
    name: 'Play and Comfort',
    emoji: '🧸',
    image: playAndComfortImage,
  },
  {
    name: 'Accessories',
    emoji: '🦮',
    image: accessoriesImage,
  },
  {
    name: 'Beds and Carriers',
    emoji: '🛏️',
    image: bedsImage,
  },
  {
    name: 'Grooming Supplies',
    emoji: '🧴',
    image: groomingImage,
  },
  {
    name: 'Health and Care',
    emoji: '💊',
    image: veterinaryImage,
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
    image: bellaImage,
  },
  {
    id: 2,
    name: 'Milo',
    details: 'Persian Cat · 1 year',
    priceLines: [
      { label: 'Price:', value: 'UGX 450,000', strong: true },
    ],
    forSale: true,
    emoji: '🐈',
    image: miloImage,
  },
  {
    id: 3,
    name: 'Kakito',
    details: 'Chinchilla · 8 months',
    priceLines: [
      { value: 'UGX 150,000', strong: true },
    ],
    forSale: true,
    emoji: '🐇',
    image: kakitoImage,
  },
  {
    id: 4,
    name: 'Mimi and Luna',
    details: 'Domestic Shorthair · 8 weeks',
    priceLines: [
      { value: 'UGX 0', strong: true },
    ],
    forSale: false,
    emoji: '🐱',
    image: mimiImage,
  },
]

export const services: Service[] = [
  {
    id: 1,
    name: 'Grooming & Spa',
    vendor: 'KAMPI DOG CLINIC - ENTEBBE',
    emoji: '🛁',
    image: spaImage,
  },
  {
    id: 2,
    name: 'Pet Walking',
    vendor: "GOD'S MERCY PET SERVICES - MUKONO",
    emoji: '🦮',
    image: petWalkingImage,
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