import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import API_BASE_URL from "../../services/api";
import { getSessionToken } from "../../services/auth/authStorage";
import "./VendorBusinessUpdateForm.css";

export type DayHours = { is_open: boolean; open: string; close: string };
export type BusinessHours = Record<string, DayHours>;

export interface BusinessStats {
  listings_count?: number;
  orders_completed?: number;
  response_rate?: number;
  member_since?: number;
}

export interface Business {
  id?: number | string;
  business_type?: string | null;
  business_name?: string;
  name?: string;
  description?: string;
  category?: number;
  category_id?: number | string;
  category_name?: string;
  vendor_category?: string;
  address?: string;
  city_district?: string;
  location_district?: string;
  city?: string;
  contact?: string;
  phone?: string;
  email?: string;
  business_hours?: BusinessHours;
  working_hours?: unknown;
  created_at?: string;
  reviewed_at?: string;
  verification_status?: string;
  cover_image?: string;
  logo?: string;
  stats?: BusinessStats;
  listings_count?: number;
  orders_completed?: number;
  total_orders?: number;
  response_rate?: number;
}

interface Category {
  id: number;
  name: string;
}

type FormState = {
  businessName: string;
  description: string;
  businessType: string;
  address: string;
  cityDistrict: string;
  businessPhone: string;
  businessEmail: string;
};

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const initialHours: BusinessHours = {
  monday: { is_open: true, open: "09:00", close: "17:00" },
  tuesday: { is_open: true, open: "09:00", close: "17:00" },
  wednesday: { is_open: true, open: "09:00", close: "17:00" },
  thursday: { is_open: true, open: "09:00", close: "17:00" },
  friday: { is_open: true, open: "09:00", close: "17:00" },
  saturday: { is_open: true, open: "09:00", close: "17:00" },
  sunday: { is_open: false, open: "09:00", close: "17:00" },
};

interface Props {
  business?: Business | null;
  onSaved: (business: Business) => void;
  onCancel: () => void;
  showCategory?: boolean;
}

export default function VendorBusinessUpdateForm({
  business,
  onSaved,
  onCancel,
  showCategory = true,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const loadingCategories = showCategory && !categoriesLoaded;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isExistingBusiness =
    Boolean(business?.id) && String(business?.id) !== "1";

  // The form values shown on screen = values derived from `business`
  // (and the loaded categories) + whatever the user has typed so far.
  const baseForm = useMemo<FormState>(() => {
    let categoryId = "";
    if (business?.category) categoryId = String(business.category);
    else if (business?.category_id) categoryId = String(business.category_id);
    else if (business?.category_name || business?.vendor_category) {
      const name = String(
        business.category_name || business.vendor_category || "",
      ).toLowerCase();
      const found = categories.find(
        (c) =>
          c.name.toLowerCase() === name || c.name.toLowerCase().includes(name),
      );
      if (found) categoryId = String(found.id);
    }

    return {
      businessName: business?.business_name || business?.name || "",
      description: business?.description || "",
      businessType: categoryId,
      address: business?.address || "",
      cityDistrict:
        business?.city_district ||
        business?.location_district ||
        business?.city ||
        "",
      businessPhone: business?.contact || business?.phone || "",
      businessEmail: business?.email || "",
    };
  }, [business, categories]);

  const [edits, setEdits] = useState<Partial<FormState>>({});
  const form: FormState = { ...baseForm, ...edits };

  const baseHours = useMemo<BusinessHours>(
    () => ({ ...initialHours, ...(business?.business_hours ?? {}) }),
    [business],
  );
  const [hoursEdits, setHoursEdits] = useState<BusinessHours | null>(null);
  const hours = hoursEdits ?? baseHours;

  // Load the category list only when its field is shown.
  useEffect(() => {
    if (!showCategory) return;
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/categories/`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${getSessionToken()}`,
      },
    })
      .then((r) => r.json())
      .then((d: unknown) => {
        const data = d as { results?: Category[] };
        const list = Array.isArray(d) ? (d as Category[]) : data.results || [];
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        // Leave the category list empty if the request fails
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [showCategory]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setEdits((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
  };

  const handleHoursChange = (
    day: string,
    field: keyof DayHours,
    value: string | boolean,
  ) => {
    setHoursEdits((prev) => {
      const base = prev ?? baseHours;
      return { ...base, [day]: { ...base[day], [field]: value } };
    });
    setErrors((prev) => {
      const n = { ...prev };
      delete n.businessHours;
      return n;
    });
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!form.businessName.trim())
      err.businessName = "Business name is required.";
    if (!form.description.trim()) err.description = "Description is required.";
    else if (form.description.trim().length > 500)
      err.description = "Description max 500 chars.";
    if (showCategory && !form.businessType)
      err.businessType = "Please select a business category.";
    if (!form.address.trim()) err.address = "Address is required.";
    if (!form.cityDistrict.trim())
      err.cityDistrict = "City or district is required.";
    const phone = parsePhoneNumberFromString(form.businessPhone, "UG");
    if (!form.businessPhone.trim()) err.businessPhone = "Phone is required.";
    else if (!phone || !phone.isValid())
      err.businessPhone = "Enter a valid Ugandan phone number.";
    if (!form.businessEmail.trim()) err.businessEmail = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail))
      err.businessEmail = "Enter a valid email.";
    const invalid = weekdays.some(
      (d) =>
        hours[d].is_open &&
        (!hours[d].open || !hours[d].close || hours[d].open >= hours[d].close),
    );
    if (invalid)
      err.businessHours =
        "For each open day, provide valid opening and closing times.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    setMessage("");
    if (!validate()) {
      setMessage("Please correct the highlighted fields.");
      return;
    }
    const token = getSessionToken();
    if (!token) {
      setMessage("Login session expired. Please log in again.");
      return;
    }
    setSaving(true);
    try {
      const phone = parsePhoneNumberFromString(form.businessPhone, "UG");
      const payload: Record<string, unknown> = {
        name: form.businessName.trim(),
        description: form.description.trim(),
        contact: phone?.number,
        email: form.businessEmail.trim(),
        address: form.address.trim(),
        city_district: form.cityDistrict.trim(),
        business_hours: hours,
      };
      if (showCategory) payload.category = Number(form.businessType);
      const url = isExistingBusiness
        ? `${API_BASE_URL}/api/businesses/${business?.id}/`
        : `${API_BASE_URL}/api/businesses/`;
      const method = isExistingBusiness ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!res.ok) {
        const details = Object.entries(data)
          .map(
            ([k, v]) =>
              `${k}: ${Array.isArray(v) ? (v as string[]).join(" ") : String(v)}`,
          )
          .join(" ");
        throw new Error(details || "Save failed.");
      }
      onSaved(data as Business);
    } catch (e) {
      const err = e as Error;
      setMessage(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vendor-business-form-wrapper">
      <div className="vendor-business-form-header">
        <h3>
          {isExistingBusiness
            ? "Update Business Information"
            : "Add Business Information"}
        </h3>
        <p>
          Business name, description, contact details and hours. All changes are
          reviewed by Pawdigree admin.
        </p>
      </div>

      {message && (
        <div className="form-message error" role="alert">
          {message}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="businessName">
          Business name <span className="req-star">*</span>
        </label>
        <input
          id="businessName"
          name="businessName"
          value={form.businessName}
          onChange={handleChange}
          aria-invalid={!!errors.businessName}
        />
        {errors.businessName && (
          <p className="field-error">{errors.businessName}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Business description <span className="req-star">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          maxLength={500}
          rows={4}
          aria-invalid={!!errors.description}
        />
        <small>{form.description.length}/500 characters</small>
        {errors.description && (
          <p className="field-error">{errors.description}</p>
        )}
      </div>

      {showCategory && <div className="form-group">
        <label htmlFor="businessType">
          Business category <span className="req-star">*</span>
        </label>
        <select
          id="businessType"
          name="businessType"
          value={form.businessType}
          onChange={handleChange}
          disabled={loadingCategories}
          aria-invalid={!!errors.businessType}
        >
          <option value="">
            {loadingCategories ? "Loading categories..." : "Select a category"}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.businessType && (
          <p className="field-error">{errors.businessType}</p>
        )}
      </div>}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address">
            Business address <span className="req-star">*</span>
          </label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleChange}
            aria-invalid={!!errors.address}
          />
          {errors.address && <p className="field-error">{errors.address}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="cityDistrict">
            City or district <span className="req-star">*</span>
          </label>
          <input
            id="cityDistrict"
            name="cityDistrict"
            value={form.cityDistrict}
            onChange={handleChange}
            aria-invalid={!!errors.cityDistrict}
          />
          {errors.cityDistrict && (
            <p className="field-error">{errors.cityDistrict}</p>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="businessPhone">
            Business phone <span className="req-star">*</span>
          </label>
          <input
            id="businessPhone"
            name="businessPhone"
            type="tel"
            placeholder="+256..."
            value={form.businessPhone}
            onChange={handleChange}
            aria-invalid={!!errors.businessPhone}
          />
          {errors.businessPhone && (
            <p className="field-error">{errors.businessPhone}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="businessEmail">
            Business email <span className="req-star">*</span>
          </label>
          <input
            id="businessEmail"
            name="businessEmail"
            type="email"
            value={form.businessEmail}
            onChange={handleChange}
            aria-invalid={!!errors.businessEmail}
          />
          {errors.businessEmail && (
            <p className="field-error">{errors.businessEmail}</p>
          )}
        </div>
      </div>

      <fieldset className="business-hours">
        <legend>Business operating hours</legend>
        {weekdays.map((day) => (
          <div className="business-hours-row" key={day}>
            <label htmlFor={`${day}-open`}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </label>
            <input
              id={`${day}-open`}
              type="checkbox"
              checked={hours[day].is_open}
              onChange={(e) =>
                handleHoursChange(day, "is_open", e.target.checked)
              }
            />
            <span>Open</span>
            {hours[day].is_open && (
              <>
                <input
                  type="time"
                  aria-label={`${day} opening time`}
                  value={hours[day].open}
                  onChange={(e) =>
                    handleHoursChange(day, "open", e.target.value)
                  }
                />
                <span>to</span>
                <input
                  type="time"
                  aria-label={`${day} closing time`}
                  value={hours[day].close}
                  onChange={(e) =>
                    handleHoursChange(day, "close", e.target.value)
                  }
                />
              </>
            )}
          </div>
        ))}
        {errors.businessHours && (
          <p className="field-error">{errors.businessHours}</p>
        )}
      </fieldset>

      <div className="form-actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="primary-btn"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : isExistingBusiness
              ? "Update Business"
              : "Register Business"}
        </button>
      </div>
    </div>
  );
}
