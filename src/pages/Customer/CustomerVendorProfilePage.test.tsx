import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../components/navigation/CustomerTopNavbar/CustomerTopNavbar', () => ({ default: () => <nav /> }))
vi.mock('../../components/navigation/CustomerSideMenu/CustomerSideMenu', () => ({ default: () => <aside /> }))
vi.mock('../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar', () => ({ default: () => <nav /> }))

import CustomerVendorProfilePage from './CustomerVendorProfilePage'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('customer vendor profile API boundaries', () => {
  it('does not request unsupported product, service, review, or favorites APIs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/businesses/')) {
        return new Response(JSON.stringify({ id: 'clinic-1', name: 'Paws Clinic', city_district: 'Kampala', verification_status: 'approved' }), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/vendors/clinic-1']}>
        <Routes>
          <Route path="/vendors/:id" element={<CustomerVendorProfilePage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Paws Clinic')).toBeInTheDocument()
    expect(screen.getByText(/Reviews will appear here when a review API is available/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rate this vendor|add to favorites/i })).not.toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(fetchMock.mock.calls.map(([url]) => String(url)).join('\n')).not.toMatch(/\/products\/|\/services\/|\/reviews\/|\/favorites\//)
  })
})