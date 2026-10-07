import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import RegistrationPage from '../pages/RegistrationPage'

describe('Customer Registration Page', () => {
  test('renders the registration form', () => {
    render(<RegistrationPage />)

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create account' }),
    ).toBeInTheDocument()
  })
})