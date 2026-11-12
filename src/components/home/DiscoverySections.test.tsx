import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Services from './Services'
import Merchandise from './Merchandise'
import Testimonials from './Testimonials'
import { apiRequest } from '../../services/api'

vi.mock('../../services/api', () => ({ apiRequest: vi.fn() }))

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

  it('does not present products or testimonials as live without supporting APIs', () => {
    render(<MemoryRouter><><Merchandise /><Testimonials /></></MemoryRouter>)
    expect(screen.getByText(/Product listings will appear here when the merchandise API is available/i)).toBeInTheDocument()
    expect(screen.getByText(/Customer reviews will appear here when verified review data is available/i)).toBeInTheDocument()
  })
})
