import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, test } from 'vitest'
import RegistrationPage from '../pages/RegistrationPage'

describe('Customer Registration Page', () => {
  test('renders the registration form', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

<<<<<<< HEAD
    flushSync(() => root.render(<RegistrationPage />))

    const getByText = (text: string) =>
      Array.from(container.querySelectorAll('*')).find(
        (element) => element.textContent?.trim() === text,
      )
    const getByLabelText = (text: string) => {
      const label = Array.from(container.querySelectorAll('label')).find(
        (element) => element.textContent?.trim() === text,
      )
      return label?.htmlFor
        ? container.querySelector(`#${CSS.escape(label.htmlFor)}`)
        : label?.querySelector('input, textarea, select')
    }

    expect(getByText('Create your account')).toBeTruthy()
    expect(getByLabelText('Full name')).toBeTruthy()
    expect(getByLabelText('Email address')).toBeTruthy()
    expect(getByLabelText('Phone number')).toBeTruthy()
    expect(getByLabelText('Password')).toBeTruthy()
    expect(getByLabelText('Confirm password')).toBeTruthy()
=======
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument()
>>>>>>> 424ce576903931a50cdfc1efc5b9e3169409c8e3
    expect(
      container.querySelector('button')?.textContent?.trim() ===
        'Create account',
    ).toBeTruthy()

    root.unmount()
    container.remove()
  })
})