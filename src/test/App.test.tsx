import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { describe, expect, test } from 'vitest'
import RegistrationPage from '../pages/RegistrationPage'

describe('Customer Registration Page', () => {
  test('renders the registration form', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

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
    expect(
      container.querySelector('button')?.textContent?.trim() ===
        'Create account',
    ).toBeTruthy()

    root.unmount()
    container.remove()
  })
})