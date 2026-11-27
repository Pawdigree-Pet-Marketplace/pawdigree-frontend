import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  PawPrint,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";
import { useCart, type CartItem } from "../../context/CartContext";

import "./CustomerCheckoutPage.css";

type DeliveryFormData = {
  fullName: string;
  phone: string;
  district: string;
  city: string;
  address: string;
  instructions: string;
};

type DeliveryField = keyof DeliveryFormData;

const requiredFields: DeliveryField[] = [
  "fullName",
  "phone",
  "district",
  "city",
  "address",
];

export default function CustomerCheckoutPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    cartCount,
    cartTotal,
    hasUnavailableItems,
    loading,
    error: cartError,
  } = useCart();

  const petItems = cartItems.filter((item) => item.item_type === "pet");
  const merchandiseItems = cartItems.filter(
    (item) => item.item_type !== "pet"
  );

  const [formData, setFormData] = useState<DeliveryFormData>({
    fullName: "",
    phone: "",
    district: "",
    city: "",
    address: "",
    instructions: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<DeliveryField, string>>
  >({});
  const [formError, setFormError] = useState("");

  const formatPrice = (price: string | number) =>
    `UGX ${Number(price).toLocaleString("en-UG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatSubtotal = (items: CartItem[]) =>
    formatPrice(
      items.reduce((total, item) => total + Number(item.line_total), 0)
    );

  function updateField(field: DeliveryField, value: string) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (fieldErrors[field]) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }

    if (formError) setFormError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<Record<DeliveryField, string>> = {};
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    }
    setFieldErrors(nextErrors);
    setFormError("");

    const firstInvalidField = requiredFields.find(
      (field) => nextErrors[field]
    );
    if (firstInvalidField) {
      document.getElementById(`checkout-${firstInvalidField}`)?.focus();
      return;
    }

    if (hasUnavailableItems) {
      setFormError(
        "Your cart contains unavailable items. Review your cart before continuing."
      );
      return;
    }

    navigate("/customer/payment", {
      state: {
        deliveryInformation: {
          shipping_name: formData.fullName.trim(),
          shipping_phone: formData.phone.trim(),
          shipping_city_district: `${formData.district.trim()}, ${formData.city.trim()}`,
          shipping_address: formData.address.trim(),
          notes: formData.instructions.trim(),
          district: formData.district.trim(),
          city: formData.city.trim(),
        },
      },
    });
  }

  return (
    <div className="customer-checkout-layout">
      <CustomerDashboardNav />

      <main className="customer-checkout-main">
        <header className="customer-checkout-heading">
          <div className="customer-checkout-heading-content">
            <p className="customer-checkout-eyebrow">PAWDIGREE PET STORE</p>
            <h1>Checkout</h1>
            <p>
              Almost there! Confirm your delivery information and review your
              order.
            </p>
          </div>
          <div className="customer-checkout-decoration" aria-hidden="true">
            <Sparkles className="checkout-sparkle" />
            <PawPrint className="checkout-paw" />
          </div>
        </header>

        {cartError && (
          <div className="customer-checkout-error" role="alert">
            {cartError}
          </div>
        )}

        {loading ? (
          <section className="customer-checkout-message" aria-live="polite">
            Loading your cart...
          </section>
        ) : cartItems.length === 0 ? (
          <section className="customer-checkout-message">
            <ShoppingBag size={42} aria-hidden="true" />
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before checking out.</p>
            <Link to="/customer/cart" className="customer-checkout-back-link">
              <ArrowLeft size={16} />
              Back to Cart
            </Link>
          </section>
        ) : (
          <div className="customer-checkout-content">
            <section className="customer-checkout-form-section">
              <div className="customer-checkout-section-heading">
                <MapPin size={21} aria-hidden="true" />
                <div>
                  <h2>Delivery Information</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              {hasUnavailableItems && (
                <div className="customer-checkout-error" role="alert">
                  Your cart contains unavailable items. Review your cart
                  before continuing.
                  <Link to="/customer/cart">Review Cart</Link>
                </div>
              )}

              {formError && (
                <div className="customer-checkout-error" role="alert">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="customer-checkout-form-grid">
                  <div className="customer-checkout-field">
                    <label htmlFor="checkout-fullName">
                      Full Name <span>*</span>
                    </label>
                    <input
                      id="checkout-fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      maxLength={150}
                      required
                      value={formData.fullName}
                      aria-invalid={Boolean(fieldErrors.fullName)}
                      aria-describedby={
                        fieldErrors.fullName
                          ? "checkout-fullName-error"
                          : undefined
                      }
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                    />
                    {fieldErrors.fullName && (
                      <small
                        className="customer-checkout-field-error"
                        id="checkout-fullName-error"
                        role="alert"
                      >
                        {fieldErrors.fullName}
                      </small>
                    )}
                  </div>

                  <div className="customer-checkout-field">
                    <label htmlFor="checkout-phone">
                      Phone Number <span>*</span>
                    </label>
                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+256 7XX XXX XXX"
                      maxLength={20}
                      required
                      value={formData.phone}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={
                        fieldErrors.phone ? "checkout-phone-error" : undefined
                      }
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                    />
                    <small>
                      Enter a phone number where the delivery team can reach
                      you.
                    </small>
                    {fieldErrors.phone && (
                      <small
                        className="customer-checkout-field-error"
                        id="checkout-phone-error"
                        role="alert"
                      >
                        {fieldErrors.phone}
                      </small>
                    )}
                  </div>
                </div>

                <div className="customer-checkout-form-grid">
                  <div className="customer-checkout-field">
                    <label htmlFor="checkout-district">
                      District <span>*</span>
                    </label>
                    <input
                      id="checkout-district"
                      name="district"
                      type="text"
                      autoComplete="address-level1"
                      placeholder="e.g. Kampala"
                      maxLength={100}
                      required
                      value={formData.district}
                      aria-invalid={Boolean(fieldErrors.district)}
                      aria-describedby={
                        fieldErrors.district
                          ? "checkout-district-error"
                          : undefined
                      }
                      onChange={(event) =>
                        updateField("district", event.target.value)
                      }
                    />
                    {fieldErrors.district && (
                      <small
                        className="customer-checkout-field-error"
                        id="checkout-district-error"
                        role="alert"
                      >
                        {fieldErrors.district}
                      </small>
                    )}
                  </div>

                  <div className="customer-checkout-field">
                    <label htmlFor="checkout-city">
                      City / Town <span>*</span>
                    </label>
                    <input
                      id="checkout-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="e.g. Entebbe"
                      maxLength={100}
                      required
                      value={formData.city}
                      aria-invalid={Boolean(fieldErrors.city)}
                      aria-describedby={
                        fieldErrors.city ? "checkout-city-error" : undefined
                      }
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                    />
                    {fieldErrors.city && (
                      <small
                        className="customer-checkout-field-error"
                        id="checkout-city-error"
                        role="alert"
                      >
                        {fieldErrors.city}
                      </small>
                    )}
                  </div>
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="checkout-address">
                    Delivery Address <span>*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    name="address"
                    autoComplete="street-address"
                    placeholder="Street, building, area, or other delivery details"
                    maxLength={255}
                    rows={3}
                    required
                    value={formData.address}
                    aria-invalid={Boolean(fieldErrors.address)}
                    aria-describedby={
                      fieldErrors.address ? "checkout-address-error" : undefined
                    }
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                  />
                  {fieldErrors.address && (
                    <small
                      className="customer-checkout-field-error"
                      id="checkout-address-error"
                      role="alert"
                    >
                      {fieldErrors.address}
                    </small>
                  )}
                </div>

                <div className="customer-checkout-field">
                  <label htmlFor="checkout-instructions">
                    Additional Delivery Instructions
                    <span className="optional-label"> (Optional)</span>
                  </label>
                  <textarea
                    id="checkout-instructions"
                    name="instructions"
                    placeholder="Any additional instructions for your delivery?"
                    rows={3}
                    value={formData.instructions}
                    onChange={(event) =>
                      updateField("instructions", event.target.value)
                    }
                  />
                </div>

                <div className="customer-checkout-actions">
                  <Link
                    to="/customer/cart"
                    className="customer-checkout-back-link"
                  >
                    <ArrowLeft size={16} />
                    Back to Cart
                  </Link>
                  <button
                    type="submit"
                    className="customer-checkout-primary-button"
                    disabled={hasUnavailableItems}
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </section>

            <aside className="customer-checkout-summary">
              <h2>Order Summary</h2>
              <p className="customer-checkout-item-count">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>

              <div className="customer-checkout-products">
                {cartItems.map((item) => {
                  const isPet = item.item_type === "pet";

                  return (
                    <div className="customer-checkout-product" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {isPet
                            ? `${item.business_name} · Pet · Qty: 1`
                            : `${item.business_name} · Merchandise · Qty: ${item.quantity}`}
                        </span>
                      </div>
                      <strong>{formatPrice(item.line_total)}</strong>
                    </div>
                  );
                })}
              </div>

              <div className="customer-checkout-summary-row">
                <span>Pet Sales Subtotal</span>
                <strong>{formatSubtotal(petItems)}</strong>
              </div>
              <div className="customer-checkout-summary-row">
                <span>Merchandise Subtotal</span>
                <strong>{formatSubtotal(merchandiseItems)}</strong>
              </div>
              <div className="customer-checkout-summary-row">
                <span>Delivery Fee</span>
                <strong>Calculated separately</strong>
              </div>
              <div className="customer-checkout-total">
                <span>Combined Cart Total</span>
                <strong>{formatPrice(cartTotal)}</strong>
              </div>
              <p className="customer-checkout-delivery-note">
                Delivery fees, if applicable, will be calculated separately.
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
