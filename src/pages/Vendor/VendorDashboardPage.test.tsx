import { cleanup, render as rtlRender, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { apiRequest } from '../../services/api'
import VendorDashboardPage from './VendorDashboardPage'
import { getMerchandise } from '../../services/merchandiseApi'

const vendorBusinessState = vi.hoisted(() => ({ businesses: [] as Array<{ id: string; name: string; business_type: string; verification_status: string }>, loading: false, error: '' }))

vi.mock('../../services/vendorBusinessStore', () => ({
  useVendorBusiness: () => null,
  useVendorBusinesses: () => vendorBusinessState,
}))

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>()
  return { ...actual, apiRequest: vi.fn() }
})

vi.mock('../../services/merchandiseApi', () => ({ getMerchandise: vi.fn() }))

vi.mock('../../layouts/VendorLayout/VendorLayout', () => ({
  default: ({
    title,
    description,
    children,
  }: {
    title: string
    description: string
    children: React.ReactNode
  }) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  ),
}))

const render = (ui: React.ReactNode) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

describe('VendorDashboardPage', () => {
  beforeEach(() => {
    vendorBusinessState.businesses = []
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('token', 'test-vendor-token')
    localStorage.setItem('role', 'VENDOR')
    vi.mocked(apiRequest).mockResolvedValue({ first_name: 'Faith' })
    vi.mocked(getMerchandise).mockResolvedValue([])
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('greets the vendor by the first name returned by the backend', async () => {
    render(<VendorDashboardPage />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Welcome back, Faith' }),
      ).toBeInTheDocument(),
    )

    expect(apiRequest).toHaveBeenCalledWith('/auth/current-user/', {
      headers: { Authorization: 'Bearer test-vendor-token' },
    })
    expect(
      screen.getByText("Here's how your store is doing today"),
    ).toBeInTheDocument()
  })

  it('uses a safe greeting when the current user request fails', async () => {
    vi.mocked(apiRequest).mockRejectedValue(new Error('Request failed'))

    render(<VendorDashboardPage />)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Welcome back, there' }),
      ).toBeInTheDocument(),
    )
  })

  it('shows all four store metric cards', () => {
    render(<VendorDashboardPage />)

    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Revenue (net)')).toBeInTheDocument()
    expect(screen.getByText('Pending Bookings')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(4)
    expect(screen.queryByText(',480')).not.toBeInTheDocument()
  })

  it('shows vendor merchandise totals and the existing management link', async () => {
    vendorBusinessState.businesses = [{ id: 'seller-1', name: 'Seller', business_type: 'PRODUCT_SELLER', verification_status: 'approved' }]
    vi.mocked(getMerchandise).mockResolvedValue([
      { id: 1, business: 'seller-1', is_active: true, approved: true, rejection_reason: '' },
      { id: 2, business: 'seller-1', is_active: false, approved: false, rejection_reason: '' },
      { id: 3, business: 'seller-1', is_active: true, approved: false, rejection_reason: 'Needs changes' },
    ] as never)

    render(<VendorDashboardPage />)

    expect(await screen.findByText('Awaiting approval')).toBeInTheDocument()
    expect(screen.getByText('Total products').previousElementSibling).toHaveTextContent('3')
    expect(screen.getByText('Active').previousElementSibling).toHaveTextContent('2')
    expect(screen.getByText('Inactive').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByText('Awaiting approval').previousElementSibling).toHaveTextContent('1')
    expect(screen.getByRole('link', { name: /manage merchandise/i })).toHaveAttribute('href', '/vendor/merchandise')
    expect(getMerchandise).toHaveBeenCalledWith()
  })

  it('shows an honest empty state for sales history', () => {
    render(<VendorDashboardPage />)
    expect(screen.getByRole('heading', { name: 'SALES — LAST 7 DAYS' })).toBeInTheDocument()
    expect(screen.getByText('Sales history will appear here when store activity is available.')).toBeInTheDocument()
  })

  it('shows an honest empty state for low stock alerts', () => {
    render(<VendorDashboardPage />)
    expect(screen.getByRole('heading', { name: 'LOW STOCK ALERTS' })).toBeInTheDocument()
    expect(screen.getByText('Stock alerts will appear here when inventory data is available.')).toBeInTheDocument()
    expect(screen.queryByText('Salmon Dry Food 5kg')).not.toBeInTheDocument()
  })

  it('shows an honest empty state for order and booking activity', () => {
    render(<VendorDashboardPage />)
    expect(screen.getByRole('heading', { name: 'RECENT ORDERS & BOOKINGS' })).toBeInTheDocument()
    expect(screen.getByText('Recent order and booking activity will appear here when it is available.')).toBeInTheDocument()
    expect(screen.queryByText('#PD-2291')).not.toBeInTheDocument()
  })

  it('does not render the dashboard when the vendor token is missing', () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')

    const { container } = render(<VendorDashboardPage />)

    expect(container).toBeEmptyDOMElement()
  })

  it('does not render the dashboard for a non-vendor role', () => {
    localStorage.setItem('role', 'CUSTOMER')

    const { container } = render(<VendorDashboardPage />)

    expect(container).toBeEmptyDOMElement()
  })
})

