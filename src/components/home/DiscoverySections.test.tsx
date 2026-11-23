import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Services from './Services'
import Merchandise from './Merchandise'
import Testimonials from './Testimonials'
import { apiRequest } from '../../services/api'
import { fetchProducts } from '../../services/publicMerchandiseApi'

vi.mock('../../services/api', () => ({ apiRequest: vi.fn() }))
vi.mock('../../services/publicMerchandiseApi', () => ({ fetchProducts: vi.fn() }))
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
  it('shows approved businesses only when their backend categories identify a service', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ results: [
      { id: 'clinic-1', name: 'Paws Clinic', city_district: 'Kampala', categories: ['Veterinary'], logo: null, cover_image: null },
      { id: 'shop-1', name: 'Paws Shop', city_district: 'Entebbe', categories: ['Pet Food'], logo: null, cover_image: null },
    ] })

    render(<MemoryRouter><Services /></MemoryRouter>)
    expect(await screen.findByText('Paws Clinic · Kampala')).toBeInTheDocument()
    expect(screen.queryByText('Paws Shop · Entebbe')).not.toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/businesses/public/')
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
