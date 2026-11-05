import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { parsePhoneNumber, type CountryCode } from "libphonenumber-js";
import { Link } from "react-router-dom";
import CountryFlag from "../CountryFlag/CountryFlag";
import { apiRequest } from "../../services/api";
import { validateProfile } from "../../utils/validateProfile";
import type { ProfileFormValues } from "../../utils/validateProfile";
import "./EditProfileForm.css";

type CountryOption = { country: string; iso_code: string; dial_code: string };
type FieldName = keyof ProfileFormValues;

const fields: {
  name: Exclude<FieldName, "phone">;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
}[] = [
  { name: "fullName", label: "Full name", type: "text", autoComplete: "name", placeholder: "Amina Kyomuhendo" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "name@example.com" },
  { name: "location", label: "Location", type: "text", autoComplete: "address-level2", placeholder: "Kampala" },
];

function getInitialCountry(phone: string): CountryCode {
  try {
    return parsePhoneNumber(phone)?.country ?? "UG";
  } catch {
    return "UG";
  }
}

function getNationalNumber(phone: string, country: CountryCode): string {
  try {
    return parsePhoneNumber(phone, country)?.nationalNumber ?? phone;
  } catch {
    return phone;
  }
}

type EditProfileFormProps = {
  initialValues: ProfileFormValues;
  onSubmit: (values: ProfileFormValues) => void;
  cancelHref: string;
};

export default function EditProfileForm({ initialValues, onSubmit, cancelHref }: EditProfileFormProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [country, setCountry] = useState<CountryCode>(() => getInitialCountry(initialValues.phone));
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countryLoadError, setCountryLoadError] = useState("");
  const [values, setValues] = useState<ProfileFormValues>(() => ({
    ...initialValues,
    phone: getNationalNumber(initialValues.phone, getInitialCountry(initialValues.phone)),
  }));
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiRequest<CountryOption[]>("/country-codes/")
      .then((items) => {
        if (cancelled) return;
        setCountries(items);
        const preferredCountry = getInitialCountry(initialValues.phone);
        const defaultCountry = items.find((item) => item.iso_code === preferredCountry)
          ?? items.find((item) => item.iso_code === "UG")
          ?? items[0];
        if (defaultCountry) setCountry(defaultCountry.iso_code as CountryCode);
        else setCountryLoadError("Country calling codes are currently unavailable.");
      })
      .catch(() => {
        if (!cancelled) setCountryLoadError("Unable to load country calling codes. Please refresh and try again.");
      })
      .finally(() => {
        if (!cancelled) setCountriesLoading(false);
      });
    return () => { cancelled = true; };
  }, [initialValues.phone]);

  const errors = validateProfile(values, country);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalid = fields.find((field) => errors[field.name]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid.name}"]`)?.focus();
      return;
    }
    if (errors.phone) {
      formRef.current?.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    const parsedPhone = parsePhoneNumber(values.phone, country);
    onSubmit({
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: parsedPhone?.number ?? values.phone.trim(),
      location: values.location.trim(),
    });
  };

  return (
    <form className="edit-form" onSubmit={handleSubmit} ref={formRef} noValidate>
      {fields.map((field) => {
        const error = touched[field.name] || submitted ? errors[field.name] : undefined;
        const errorId = `${field.name}-error`;
        return (
          <div className="edit-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name} name={field.name} type={field.type}
              autoComplete={field.autoComplete} placeholder={field.placeholder}
              value={values[field.name]} onChange={handleChange} onBlur={handleBlur}
              className={error ? "has-error" : undefined}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? errorId : undefined}
            />
            {error && <p id={errorId} className="edit-error" role="alert">{error}</p>}
          </div>
        );
      })}

      <div className="edit-field">
        <label htmlFor="country-code">Phone number</label>
        <div className="phone-input-group">
          <div className="edit-country-select">
            <CountryFlag countryCode={country} className="edit-country-flag" />
            <select
              id="country-code" name="countryCode" value={country}
              disabled={countriesLoading || countries.length === 0}
              onChange={(event) => {
                setCountry(event.target.value as CountryCode);
                setTouched((current) => ({ ...current, phone: true }));
              }}
              aria-label="Country calling code"
            >
              {countries.map((item) => (
                <option key={item.iso_code} value={item.iso_code}>{item.dial_code} {item.country}</option>
              ))}
            </select>
          </div>
          <input
            id="phone" name="phone" type="tel" inputMode="tel"
            autoComplete="tel-national" placeholder="Phone number"
            value={values.phone} onChange={handleChange} onBlur={handleBlur}
            aria-label="Phone number without country code"
            aria-invalid={(touched.phone || submitted) && errors.phone ? "true" : "false"}
            aria-describedby={(touched.phone || submitted) && errors.phone ? "phone-error" : undefined}
            className={(touched.phone || submitted) && errors.phone ? "has-error" : undefined}
          />
        </div>
        {countryLoadError && <p className="phone-help" role="status">{countryLoadError}</p>}
        {(touched.phone || submitted) && errors.phone && <p id="phone-error" className="edit-error" role="alert">{errors.phone}</p>}
        <p className="phone-help">Enter your number without the country code. The selected country code will be added when you save.</p>
      </div>

      <div className="edit-actions">
        <Link to={cancelHref} className="edit-cancel">Cancel</Link>
        <button type="submit" className="edit-save">Save changes</button>
      </div>
    </form>
  );
}
