import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EditProfileForm from './EditProfileForm'

const initialValues = {
  fullName: 'Amina Kyomuhendo',
  email: 'amina@email.com',
  phone: '0772 123 456',
  location: 'Kampala',
}

function setup(values = initialValues) {
  const onSubmit = vi.fn()
  render(
    <EditProfileForm
      initialValues={values}
      onSubmit={onSubmit}
      cancelHref="/profile"
    />,
  )
  return onSubmit
}

describe('EditProfileForm', () => {
  it('saves a valid form with trimmed values', () => {
    const onSubmit = setup()

    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: '  Amina K  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

   expect(onSubmit).toHaveBeenCalledWith({
  ...initialValues,
  fullName: 'Amina K',
  phone: '+256772123456',
})
  })

  it('shows errors and does not save when fields are empty', () => {
    const onSubmit = setup({ fullName: '', email: '', phone: '', location: '' })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getAllByRole('alert')).toHaveLength(4)
    expect(screen.getByLabelText('Full name')).toHaveFocus()
  })

  it('shows an error after leaving an invalid field', () => {
    setup()

    const email = screen.getByLabelText('Email')
    fireEvent.change(email, { target: { value: 'not-an-email' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.blur(email)
    expect(screen.getByRole('alert')).toHaveTextContent('valid email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
  })

  it('links Cancel back to the profile page', () => {
    setup()
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/profile',
    )
  })
})