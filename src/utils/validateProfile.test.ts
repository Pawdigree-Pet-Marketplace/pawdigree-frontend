import { describe, expect, it } from 'vitest'
import { validateProfile } from './validateProfile'

const valid = {
  fullName: 'Amina Kyomuhendo',
  email: 'amina@email.com',
  phone: '0772 123 456',
  location: 'Kampala',
}

describe('validateProfile', () => {
  it('accepts a valid profile', () => {
    expect(validateProfile(valid)).toEqual({})
  })

  it('requires every field', () => {
    const errors = validateProfile({
      fullName: '',
      email: '',
      phone: '',
      location: '',
    })
    expect(Object.keys(errors)).toEqual(['fullName', 'email', 'phone', 'location'])
  })

  it('rejects names with numbers', () => {
    expect(validateProfile({ ...valid, fullName: 'Amina 123' }).fullName).toBeDefined()
  })

  it('rejects an invalid email', () => {
    expect(validateProfile({ ...valid, email: 'amina@email' }).email).toBeDefined()
    expect(validateProfile({ ...valid, email: 'not-an-email' }).email).toBeDefined()
  })

  it('accepts Ugandan phone formats', () => {
    expect(validateProfile({ ...valid, phone: '0772123456' }).phone).toBeUndefined()
    expect(validateProfile({ ...valid, phone: '+256 772 123 456' }).phone).toBeUndefined()
    expect(validateProfile({ ...valid, phone: '0312-345-678' }).phone).toBeUndefined()
  })

  it('rejects other phone numbers', () => {
    expect(validateProfile({ ...valid, phone: '12345' }).phone).toBeDefined()
    expect(validateProfile({ ...valid, phone: '0872123456' }).phone).toBeDefined()
  })
})