export interface Profile {
  fullName: string
  email: string
  phone: string
  location: string
  verified: boolean
}

const STORAGE_KEY = 'pawdigree-profile'

// Mock profile until the backend API is connected.
export const defaultProfile: Profile = {
  fullName: 'Amina Kyomuhendo',
  email: 'amina@email.com',
  phone: '0772 123 456',
  location: 'Kampala',
  verified: true,
}

export function loadProfile(): Profile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...defaultProfile, ...JSON.parse(saved) }
  } catch {
    // storage unavailable or corrupted: fall back to the default profile
  }
  return defaultProfile
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // ignore storage errors until the real API exists
  }
}