
import { useRef, useState } from 'react'
import type { FocusEvent, FormEvent } from 'react'
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js'
import '../App.css'

const countries = [
  { code: 'UG', name: 'Uganda', dialCode: '+256' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250' },
  { code: 'BI', name: 'Burundi', dialCode: '+257' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211' },
] as const

type SupportedCountry = (typeof countries)[number]['code']

type RegistrationField =
  | 'first_name'
  | 'last_name'
  | 'username'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'

const fieldOrder: RegistrationField[] = [
  'first_name',
  'last_name',
  'username',
  'email',
  'phone',
  'password',
  'confirmPassword',
]

export default function RegistrationPage() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const [country, setCountry] = useState<SupportedCountry>('UG')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [touched, setTouched] = useState<
    Partial<Record<RegistrationField, boolean>>
  >({})
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState('')

  const formRef = useRef<HTMLFormElement>(null)

  const cleanedPhone = formData.phone.replace(/[\s()-]/g, '')
  const trimmedUsername = formData.username.trim()

  const errors: Record<RegistrationField, string | undefined> = {
    first_name: formData.first_name.trim()
      ? undefined
      : 'Please enter your first name.',

    last_name: formData.last_name.trim()
      ? undefined
      : 'Please enter your last name.',

    username: !trimmedUsername
      ? 'Please choose a username.'
      : !trimmedUsername.startsWith('@')
        ? 'Your username must start with @.'
        : trimmedUsername.length < 2
          ? 'Enter a username after @.'
          : undefined,

    email: !formData.email.trim()
      ? 'Please enter your email address.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
        ? 'Please enter a valid email address.'
        : undefined,

    phone: !formData.phone.trim()
      ? 'Please enter your phone number.'
      : !/^[1-9]\d+$/.test(cleanedPhone)
        ? 'Enter your number without the country code or leading zero.'
        : !isValidPhoneNumber(cleanedPhone, country)
          ? 'Enter a valid phone number for the selected country.'
          : undefined,

    password: !formData.password
      ? 'Please enter a password.'
      : formData.password.length < 8
        ? 'Password must be at least 8 characters.'
        : undefined,

    confirmPassword: !formData.confirmPassword
      ? 'Please confirm your password.'
      : formData.password !== formData.confirmPassword
        ? 'Passwords do not match.'
        : undefined,
  }

  const updateField = (name: RegistrationField, value: string) => {
    setFormData((current) => ({ ...current, [name]: value }))
    setSuccess('')
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as RegistrationField
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    setSuccess('')

    const firstInvalid = fieldOrder.find((field) => errors[field])

    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)
        ?.focus()
      return
    }

    const parsedPhone = parsePhoneNumber(cleanedPhone, country)

    const {
      confirmPassword: _confirmPassword,
      ...accountFields
    } = formData

    const registrationData = {
      ...accountFields,
      username: trimmedUsername,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      phone: parsedPhone.number,
    }

    // Temporary mock until the registration API is connected.
    console.log('Registration data:', registrationData)
    setSuccess('Form validated successfully! Backend registration is not connected yet.')
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <div className="registration-header">
          <h1>Create your account</h1>
          <p>Join Pawdigree and connect with trusted pet services.</p>
        </div>

        <form
          className="registration-form"
          onSubmit={handleSubmit}
          ref={formRef}
          noValidate
        >
          {success && (
            <p className="form-success" role="status">
              {success}
            </p>
          )}

          {/* First name */}
          <div className="form-group">
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              placeholder="Enter your first name"
              value={formData.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              onBlur={handleBlur}
              className={
                (touched.first_name || submitted) && errors.first_name
                  ? 'has-error'
                  : undefined
              }
              aria-invalid={
                (touched.first_name || submitted) && !!errors.first_name
              }
              aria-describedby={
                (touched.first_name || submitted) && errors.first_name
                  ? 'first_name-error'
                  : undefined
              }
            />
            {(touched.first_name || submitted) && errors.first_name && (
              <p id="first_name-error" className="field-error" role="alert">
                {errors.first_name}
              </p>
            )}
          </div>

          {/* Last name */}
          <div className="form-group">
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              placeholder="Enter your last name"
              value={formData.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              onBlur={handleBlur}
              className={
                (touched.last_name || submitted) && errors.last_name
                  ? 'has-error'
                  : undefined
              }
              aria-invalid={
                (touched.last_name || submitted) && !!errors.last_name
              }
              aria-describedby={
                (touched.last_name || submitted) && errors.last_name
                  ? 'last_name-error'
                  : undefined
              }
            />
            {(touched.last_name || submitted) && errors.last_name && (
              <p id="last_name-error" className="field-error" role="alert">
                {errors.last_name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="@yourusername"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              onBlur={handleBlur}
              className={
                (touched.username || submitted) && errors.username
                  ? 'has-error'
                  : undefined
              }
              aria-invalid={
                (touched.username || submitted) && !!errors.username
              }
              aria-describedby={
                (touched.username || submitted) && errors.username
                  ? 'username-error'
                  : 'username-help'
              }
            />
            {(touched.username || submitted) && errors.username ? (
              <p id="username-error" className="field-error" role="alert">
                {errors.username}
              </p>
            ) : (
              <small id="username-help">
                Your username must start with @, for example @aricodes.
              </small>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              onBlur={handleBlur}
              className={
                (touched.email || submitted) && errors.email
                  ? 'has-error'
                  : undefined
              }
              aria-invalid={(touched.email || submitted) && !!errors.email}
              aria-describedby={
                (touched.email || submitted) && errors.email
                  ? 'email-error'
                  : undefined
              }
            />
            {(touched.email || submitted) && errors.email && (
              <p id="email-error" className="field-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone number */}
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>

            <div className="registration-phone-row">
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value as SupportedCountry)
                  setTouched((current) => ({ ...current, phone: true }))
                  setSuccess('')
                }}
                aria-label="Country calling code"
              >
                {countries.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.dialCode})
                  </option>
                ))}
              </select>

              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="772 123 456"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                onBlur={handleBlur}
                className={
                  (touched.phone || submitted) && errors.phone
                    ? 'has-error'
                    : undefined
                }
                aria-label="Phone number without country code"
                aria-invalid={(touched.phone || submitted) && !!errors.phone}
                aria-describedby={
                  (touched.phone || submitted) && errors.phone
                    ? 'phone-error'
                    : 'phone-help'
                }
              />
            </div>

            {(touched.phone || submitted) && errors.phone ? (
              <p id="phone-error" className="field-error" role="alert">
                {errors.phone}
              </p>
            ) : (
              <small id="phone-help">
                Enter your number without the country code or leading zero.
              </small>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                onBlur={handleBlur}
                className={
                  (touched.password || submitted) && errors.password
                    ? 'has-error'
                    : undefined
                }
                aria-invalid={
                  (touched.password || submitted) && !!errors.password
                }
                aria-describedby={
                  (touched.password || submitted) && errors.password
                    ? 'password-error'
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {(touched.password || submitted) && errors.password && (
              <p id="password-error" className="field-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="password-field">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={formData.confirmPassword}
                onChange={(e) =>
                  updateField('confirmPassword', e.target.value)
                }
                onBlur={handleBlur}
                className={
                  (touched.confirmPassword || submitted) &&
                  errors.confirmPassword
                    ? 'has-error'
                    : undefined
                }
                aria-invalid={
                  (touched.confirmPassword || submitted) &&
                  !!errors.confirmPassword
                }
                aria-describedby={
                  (touched.confirmPassword || submitted) &&
                  errors.confirmPassword
                    ? 'confirmPassword-error'
                    : undefined
                }
              />
              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirmation password'
                    : 'Show confirmation password'
                }
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {(touched.confirmPassword || submitted) &&
              errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="field-error"
                  role="alert"
                >
                  {errors.confirmPassword}
                </p>
              )}
          </div>

          <button type="submit" className="register-button">
            Create account
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="#">Log in</a>
        </p>
      </section>
    </main>
  )
}
