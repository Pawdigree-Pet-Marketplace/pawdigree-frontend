import { useRef, useState } from 'react'
import type { ChangeEvent, FocusEvent, FormEvent } from 'react'
import { parsePhoneNumber } from 'libphonenumber-js'
import { validateProfile } from '../../utils/validateProfile'
import type { ProfileFormValues } from '../../utils/validateProfile'
import './EditProfileForm.css'

const countries = [
  { code: 'UG', name: 'Uganda', dialCode: '+256' },
  { code: 'KE', name: 'Kenya', dialCode: '+254' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250' },
  { code: 'BI', name: 'Burundi', dialCode: '+257' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211' },
] as const

type SupportedCountry = (typeof countries)[number]['code']
type FieldName = keyof ProfileFormValues

const fields: {
  name: Exclude<FieldName, 'phone'>
  label: string
  type: string
  autoComplete: string
  placeholder: string
}[] = [
  {
    name: 'fullName',
    label: 'Full name',
    type: 'text',
    autoComplete: 'name',
    placeholder: 'Amina Kyomuhendo',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    autoComplete: 'email',
    placeholder: 'name@example.com',
  },
  {
    name: 'location',
    label: 'Location',
    type: 'text',
    autoComplete: 'address-level2',
    placeholder: 'Kampala',
  },
]

function getInitialCountry(phone: string): SupportedCountry {
  try {
    const parsed = parsePhoneNumber(phone) ?? parsePhoneNumber(phone, 'UG')
    const match = countries.find((country) => country.code === parsed?.country)
    return match?.code ?? 'UG'
  } catch {
    return 'UG'
  }
}

function getNationalNumber(
  phone: string,
  country: SupportedCountry,
): string {
  try {
    const parsed = parsePhoneNumber(phone, country)
    return parsed?.nationalNumber ?? phone
  } catch {
    return phone
  }
}

type EditProfileFormProps = {
  initialValues: ProfileFormValues
  onSubmit: (values: ProfileFormValues) => void
  cancelHref: string
}

export default function EditProfileForm({
  initialValues,
  onSubmit,
  cancelHref,
}: EditProfileFormProps) {
  const [isMenuTouched, setIsMenuTouched] = useState(false)
  const [country, setCountry] = useState<SupportedCountry>(() =>
    getInitialCountry(initialValues.phone),
  )
  const [values, setValues] = useState<ProfileFormValues>(() => ({
    ...initialValues,
    phone: getNationalNumber(
      initialValues.phone,
      getInitialCountry(initialValues.phone),
    ),
  }))
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>(
    {},
  )
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const errors = validateProfile(values, country)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)

    const firstInvalid = fields.find((field) => errors[field.name])

    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${firstInvalid.name}"]`)
        ?.focus()
      return
    }

    if (errors.phone) {
      formRef.current
        ?.querySelector<HTMLInputElement>('[name="phone"]')
        ?.focus()
      return
    }

    const parsedPhone = parsePhoneNumber(values.phone, country)

    onSubmit({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: parsedPhone?.number ?? values.phone.trim(),
      location: values.location.trim(),
    })
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit} ref={formRef} noValidate>
      {fields.map((field) => {
        const error =
          touched[field.name] || submitted ? errors[field.name] : undefined
        const errorId = `${field.name}-error`

        return (
          <div className="edit-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              value={values[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              className={error ? 'has-error' : undefined}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
            />
            {error && (
              <p id={errorId} className="edit-error" role="alert">
                {error}
              </p>
            )}
          </div>
        )
      })}

      <div className="edit-field">
        <label htmlFor="country-code">Phone number</label>
        <div className="phone-input-group">
          <select
            id="country-code"
            name="countryCode"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as SupportedCountry)
              setIsMenuTouched(true)
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
            value={values.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-label="Phone number without country code"
            aria-invalid={
              (touched.phone || submitted) && errors.phone ? 'true' : 'false'
            }
            aria-describedby={
              (touched.phone || submitted) && errors.phone
                ? 'phone-error'
                : undefined
            }
            className={
              (touched.phone || submitted) && errors.phone
                ? 'has-error'
                : undefined
            }
          />
        </div>

        {(touched.phone || submitted || isMenuTouched) && errors.phone && (
          <p id="phone-error" className="edit-error" role="alert">
            {errors.phone}
          </p>
        )}
        <p className="phone-help">
          Enter your number without the country code. For example, 772 123 456
          for Uganda.
        </p>
      </div>

      <div className="edit-actions">
        <a href={cancelHref} className="edit-cancel">
          Cancel
        </a>
        <button type="submit" className="edit-save">
          Save changes
        </button>
      </div>
    </form>
  )
}