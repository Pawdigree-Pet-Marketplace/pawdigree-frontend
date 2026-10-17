import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VendorDashboardPage from './VendorDashboardPage'

vi.mock('../layouts/VendorLayout/VendorLayout', () => ({
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

describe('VendorDashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('token', 'test-vendor-token')
    localStorage.setItem('role', 'VENDOR')
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows the vendor dashboard heading', () => {
    render(<VendorDashboardPage />)

    expect(
      screen.getByRole('heading', {
        name: 'Welcome back, Happy Paws Kennel',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText("Here's how your store is doing today"),
    ).toBeInTheDocument()
  })

  it('shows all four store metric cards', () => {
    render(<VendorDashboardPage />)

    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Revenue (net)')).toBeInTheDocument()
    expect(screen.getByText('Pending Bookings')).toBeInTheDocument()
  })

  it('shows the sales chart and all seven day labels', () => {
    render(<VendorDashboardPage />)

    expect(
      screen.getByRole('heading', { name: 'SALES — LAST 7 DAYS' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('img', {
        name: 'Illustrative sales trend over seven days',
      }),
    ).toBeInTheDocument()

    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(screen.getByText(day)).toBeInTheDocument()
    }
  })

  it('shows low-stock alerts', () => {
    render(<VendorDashboardPage />)

    expect(
      screen.getByRole('heading', { name: 'LOW STOCK ALERTS' }),
    ).toBeInTheDocument()

    expect(screen.getByText('Salmon Dry Food 5kg')).toBeInTheDocument()
    expect(screen.getByText('Cat Scratch Post')).toBeInTheDocument()
    expect(screen.getByText('Puppy Chew Toy')).toBeInTheDocument()
    expect(screen.getByText('3 left')).toBeInTheDocument()
    expect(screen.getByText('1 left')).toBeInTheDocument()
    expect(screen.getByText('4 left')).toBeInTheDocument()
  })

  it('shows recent orders and their statuses', () => {
    render(<VendorDashboardPage />)

    expect(
      screen.getByRole('heading', { name: 'RECENT ORDERS' }),
    ).toBeInTheDocument()

    expect(screen.getByText('#PD-2291')).toBeInTheDocument()
    expect(screen.getByText('#PD-2290')).toBeInTheDocument()
    expect(screen.getByText('#PD-2288')).toBeInTheDocument()

    expect(screen.getByText('Alina K.')).toBeInTheDocument()
    expect(screen.getByText('Marcus O.')).toBeInTheDocument()
    expect(screen.getByText('Ritah N.')).toBeInTheDocument()

    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
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
