import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Services from './Services'
import Merchandise from './Merchandise'
import Testimonials from './Testimonials'
import { fetchProducts } from '../../services/publicMerchandiseApi'
import { fetchServices } from '../../services/publicServicesApi'

vi.mock('../../services/publicMerchandiseApi', () => ({ fetchProducts: vi.fn() }))
vi.mock('../../services/publicServicesApi', () => ({ fetchServices: vi.fn() }))
// Cart actions are outside the homepage listing behavior under test.
vi.mock('../cart/AddToCartButton', () => ({ default: () => null }))

const product = {
  id: 42,
  name: 'Comfort Jumbo Squeaky Plush Dog Toy',
  price: '45000.00',
  category: 3,
  category_name: 'Toys',
  is_available: true,
  business_name: 'Paw Supplies',
  main_image: 'https://media.pawdigree.test/products/comfort-toy.jpg',
}

function renderMerchandiseRoutes() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Merchandise />} />
        <Route path="/merchandise" element={<h1>Merchandise marketplace</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('landing discovery sections', () => {
  it('shows actual public services and links separately to service and vendor discovery', async () => {
    vi.mocked(fetchServices).mockResolvedValue({ count: 1, next: null, previous: null, results: [{
      service_id: 5, name: 'Gentle grooming', service_type: 'Grooming', description: 'Wash and brush.',
      price: '50000.00', duration: 60, availability_status: 'available', category_name: 'Grooming',
      business_name: 'Paws Clinic', city_district: 'Kampala', image: null, average_rating: 4.5, review_count: 2,
    }] })

    render(<MemoryRouter><Services /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Gentle grooming' })).toBeInTheDocument()
    expect(screen.getByText('Paws Clinic')).toBeInTheDocument()
    expect(screen.getByText('UGX 50,000')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See All Services' })).toHaveAttribute('href', '/services')
    expect(screen.getByRole('link', { name: /meet our vendors/i })).toHaveAttribute('href', '/vendors')
    expect(screen.getByRole('link', { name: /gentle grooming/i })).toHaveAttribute('href', '/services/5')
    expect(fetchServices).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
  })

  it('renders products returned by the public merchandise API, including their price and image', async () => {
    vi.mocked(fetchProducts).mockResolvedValue({ count: 1, results: [product] })

    renderMerchandiseRoutes()

    expect(await screen.findByRole('heading', { name: product.name })).toBeInTheDocument()
    expect(screen.getByText('UGX 45,000')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: product.name })).toHaveAttribute('src', product.main_image)
    expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ page: 1, sort: 'newest' }))
  })

  it('shows loading and an empty state while/when the public merchandise API has no products', async () => {
    let resolveProducts!: (response: { count: number; results: never[] }) => void
    vi.mocked(fetchProducts).mockReturnValue(new Promise((resolve) => { resolveProducts = resolve }))

    renderMerchandiseRoutes()

    expect(screen.getByRole('status')).toHaveTextContent('Loading merchandise')
    resolveProducts({ count: 0, results: [] })
    expect(await screen.findByText('No merchandise is available yet. Check back soon.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse all merchandise/i })).toHaveAttribute('href', '/merchandise')
  })

  it('shows an error fallback when the public merchandise request fails', async () => {
    vi.mocked(fetchProducts).mockRejectedValue(new Error('Network unavailable'))

    renderMerchandiseRoutes()

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load merchandise right now.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /browse all merchandise/i })).toHaveAttribute('href', '/merchandise')
  })

  it('navigates to the full marketplace from Browse all merchandise', async () => {
    vi.mocked(fetchProducts).mockResolvedValue({ count: 1, results: [product] })

    renderMerchandiseRoutes()
    fireEvent.click(await screen.findByRole('link', { name: /browse all merchandise/i }))

    expect(await screen.findByRole('heading', { name: 'Merchandise marketplace' })).toBeInTheDocument()
  })

  it('does not present customer reviews as live without verified review data', () => {
    render(<MemoryRouter><Testimonials /></MemoryRouter>)
    expect(screen.getByText(/Customer reviews will appear here when verified review data is available/i)).toBeInTheDocument()
  })
})
