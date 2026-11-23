import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Listings from './Listings'
import { DEFAULT_QUERY, type PagedPets, type PublicPet } from '../../data/pets'
import { fetchPets } from '../../services/petsApi'

const sessionState = vi.hoisted(() => ({ customerSignedIn: false }))

vi.mock('../../services/petsApi', () => ({ fetchPets: vi.fn() }))
vi.mock('../../hooks/useSession', () => ({ default: () => sessionState.customerSignedIn }))
vi.mock('../../services/customerAuthenticatedFetch', () => ({
  customerAuthenticatedFetch: vi.fn(),
}))

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = []
  readonly observed: Element[] = []
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    TestIntersectionObserver.instances.push(this)
  }

  observe = (element: Element) => { this.observed.push(element) }
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = () => []

  trigger(element: Element, isIntersecting: boolean) {
    this.callback(
      [{ target: element, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

const pet = (id: number): PublicPet => ({
  pet_id: id,
  listing_type: id % 2 ? 'SALE' : 'ADOPTION',
  name: `Buddy ${id}`,
  species: 'Dog',
  breed: 'Mixed breed',
  age: 8,
  gender: 'MALE',
  price: id % 2 ? '250000.00' : null,
  adoption_status: 'AVAILABLE',
  images: [{ image_id: id, image: `/media/pets/${id}.jpg`, is_primary: true }],
})

function renderSection() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Listings />} />
        <Route path="/explore-pets" element={<h1>Explore Pets</h1>} />
        <Route path="/login" element={<h1>Customer login</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sessionState.customerSignedIn = false
  TestIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
  vi.mocked(fetchPets).mockResolvedValue({ count: 0, results: [] })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('homepage pet listings', () => {
  it('renders pets returned from the public API with their image and price', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [pet(1)] })

    renderSection()

    expect(await screen.findByRole('heading', { name: 'Buddy 1' })).toBeInTheDocument()
    expect(screen.getByText('Mixed breed · Dog · 8 months')).toBeInTheDocument()
    expect(screen.getByText(/UGX 250,000/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Buddy 1' })).toHaveAttribute('src', '/media/pets/1.jpg')
    expect(fetchPets).toHaveBeenCalledWith(DEFAULT_QUERY)
  })

  it('observes cards inserted after the initial loading render', async () => {
    let resolvePets!: (response: PagedPets) => void
    vi.mocked(fetchPets).mockReturnValue(new Promise((resolve) => { resolvePets = resolve }))

    renderSection()
    expect(screen.getByRole('status')).toHaveTextContent(/loading pets/i)

    await act(async () => { resolvePets({ count: 1, results: [pet(1)] }) })

    const card = screen.getByRole('heading', { name: 'Buddy 1' }).closest('article')
    expect(card).not.toBeNull()
    expect(TestIntersectionObserver.instances.at(-1)?.observed).toContain(card)

    act(() => TestIntersectionObserver.instances.at(-1)?.trigger(card!, true))
    expect(card).toHaveClass('is-visible')
  })

  it('reveals each card as it scrolls into view', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 4, results: [1, 2, 3, 4].map(pet) })

    renderSection()

    const cards = (await screen.findAllByRole('article'))
    const observer = TestIntersectionObserver.instances.at(-1)
    expect(observer?.observed).toHaveLength(4)

    for (const card of cards) {
      act(() => observer?.trigger(card, true))
      expect(card).toHaveClass('is-visible')
    }
  })

  it('makes cards visible when reduced motion is enabled', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true } as MediaQueryList))
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [pet(1)] })

    renderSection()

    expect(await screen.findByRole('article')).toHaveClass('is-visible')
    expect(TestIntersectionObserver.instances).toHaveLength(0)
  })

  it('makes cards visible if the intersection observer fails', async () => {
    vi.stubGlobal('IntersectionObserver', class { constructor() { throw new Error('unsupported') } })
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [pet(1)] })

    renderSection()

    expect(await screen.findByRole('article')).toHaveClass('is-visible')
  })

  it('displays no more than four pets from the returned page', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 5, results: [1, 2, 3, 4, 5].map(pet) })

    renderSection()

    expect(await screen.findByRole('heading', { name: 'Buddy 1' })).toBeInTheDocument()
    for (let id = 2; id <= 4; id += 1) {
      expect(screen.getByRole('heading', { name: `Buddy ${id}` })).toBeInTheDocument()
    }
    expect(screen.queryByRole('heading', { name: 'Buddy 5' })).not.toBeInTheDocument()
  })

  it('shows a loading state while the request is pending', () => {
    vi.mocked(fetchPets).mockReturnValue(new Promise<PagedPets>(() => {}))

    renderSection()

    expect(screen.getByRole('status')).toHaveTextContent(/loading pets/i)
  })

  it('shows an empty state when no public pets are returned', async () => {
    renderSection()

    expect(await screen.findByText(/no pet listings are available right now/i)).toBeInTheDocument()
  })

  it('shows a distinct error and retries the public request', async () => {
    vi.mocked(fetchPets)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ count: 0, results: [] })

    renderSection()

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t load pet listings/i)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText(/no pet listings are available right now/i)).toBeInTheDocument()
    expect(fetchPets).toHaveBeenCalledTimes(2)
    expect(fetchPets).toHaveBeenNthCalledWith(2, DEFAULT_QUERY)
  })

  it('keeps the See All link pointed at the Explore Pets page', async () => {
    renderSection()

    fireEvent.click(await screen.findByRole('link', { name: 'See All' }))

    expect(await screen.findByRole('heading', { name: 'Explore Pets' })).toBeInTheDocument()
  })

  it('keeps the existing anonymous favourite behaviour and opens sign in', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [pet(1)] })

    renderSection()

    fireEvent.click(await screen.findByRole('button', { name: /save buddy 1 to favourites/i }))

    expect(await screen.findByRole('heading', { name: 'Customer login' })).toBeInTheDocument()
  })

  it('shows the image placeholder when a pet has no saved image', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [{ ...pet(1), images: [] }] })

    renderSection()

    expect(await screen.findByRole('img', { name: 'Buddy 1, no photo available' })).toHaveTextContent('🐾')
  })

  it('replaces a failed pet image with the image placeholder', async () => {
    vi.mocked(fetchPets).mockResolvedValue({ count: 1, results: [pet(1)] })

    renderSection()

    fireEvent.error(await screen.findByRole('img', { name: 'Buddy 1' }))

    expect(screen.getByRole('img', { name: 'Buddy 1, no photo available' })).toHaveTextContent('🐾')
  })
})
