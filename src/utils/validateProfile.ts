import { isValidPhoneNumber } from 'libphonenumber-js'
import type { CountryCode } from 'libphonenumber-js'

export interface ProfileFormValues {
  fullName: string
  email: string
  phone: string
  location: string
}

export type ProfileErrors = Partial<Record<keyof ProfileFormValues, string>>

const NAME_PATTERN = /^\p{L}[\p{L}\s'.-]*$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateProfile(
  values: ProfileFormValues,
  country: CountryCode = 'UG',
): ProfileErrors {
  const errors: ProfileErrors = {}

  const fullName = values.fullName.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()
  const location = values.location.trim()

  if (!fullName) {
    errors.fullName = 'Enter your full name.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Your name must be at least 2 characters.'
  } else if (fullName.length > 60) {
    errors.fullName = 'Your name must be 60 characters or fewer.'
  } else if (!NAME_PATTERN.test(fullName)) {
    errors.fullName =
      'Use letters only. Spaces, hyphens and apostrophes are fine.'
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email, like name@example.com.'
  }

  if (!phone) {
    errors.phone = 'Enter your phone number.'
  } else {
    try {
      if (!isValidPhoneNumber(phone, country)) {
        errors.phone = 'Enter a valid phone number for the selected country.'
      }
    } catch {
      errors.phone = 'Enter a valid phone number for the selected country.'
    }
  }

  if (!location) {
    errors.location = 'Enter your town or district.'
  } else if (location.length < 2) {
    errors.location = 'Your location must be at least 2 characters.'
  } else if (location.length > 60) {
    errors.location = 'Your location must be 60 characters or fewer.'
  }

  return errors
}
