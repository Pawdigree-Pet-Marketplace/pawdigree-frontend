
import { fireEvent, render as rtlRender, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import RegistrationPage from '../pages/Customer/RegistrationPage'

const render = (ui: React.ReactNode) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

describe('Customer Registration Page', () => {
  test('allows the customer to move through the registration steps', async () => {
    render(<RegistrationPage />)

    // Step 1: Personal details
    expect(screen.getByText('Create your account')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('First name'), {
      target: { value: 'Jane' },
    })
    fireEvent.change(screen.getByLabelText('Last name'), {
      target: { value: 'Doe' },
    })
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: '@janedoe' },
    })

    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    // Step 2: Contact details
    expect(await screen.findByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
  })
})
