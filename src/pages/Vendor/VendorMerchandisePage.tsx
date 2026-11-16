import { useEffect, useMemo, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ImagePlus,
  X,
  LoaderCircle,
} from "lucide-react";
import {
  getMerchandise,
  createMerchandise,
  updateMerchandise,
  deactivateMerchandise,
} from "../../services/merchandiseApi";
import type {
  Merchandise,
  MerchandisePayload,
} from "../../services/merchandiseApi";

import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import {
  categoryKindForBusinessType,
  getCategories,
  type Category,
} from "../../services/categoryService";
import { useVendorBusiness } from "../../services/vendorBusinessStore";

import type { Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";

import "./VendorMerchandisePage.css";

type BusinessResponse = Business[] | { results?: Business[] };

type FormValues = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category: string;
};

const emptyForm: FormValues = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "0",
  category: "",
};

function businessName(business: { name?: string; business_name?: unknown }) {
  return business.name || (typeof business.business_name === "string" ? business.business_name : "My business");
}

function imageUrl(path?: string) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function VendorMerchandisePage() {
  const activeBusiness = useVendorBusiness();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [products, setProducts] = useState<Merchandise[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<Merchandise | null>(null);
  const [values, setValues] = useState<FormValues>(emptyForm);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const selectedBusiness = activeBusiness ?? businesses.find(
    (business) => String(business.id) === businessId,
  );
  const selectedBusinessId = activeBusinessId ?? businessId;
  const categoryKind = categoryKindForBusinessType(selectedBusiness?.business_type);
  const visibleCategories = categories.filter(
    (category) => category.is_active && category.kind === categoryKind,
  );

  const businessProducts = useMemo(
    () => products.filter((product) => String(product.business) === selectedBusinessId),
    [products, selectedBusinessId],
  );

  async function loadProducts() {
    const items = await getMerchandise(activeBusinessId ?? undefined);
    setProducts(items);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const [businessResponse, productResponse] =
          await Promise.all([
            vendorAuthenticatedFetch(`${API_BASE_URL}/api/businesses/`),
            getMerchandise(activeBusinessId ?? undefined),
          ]);

        if (!businessResponse.ok) {
          throw new Error("Could not load your businesses.");
        }

        const businessData =
          (await businessResponse.json()) as BusinessResponse;

        const businessList = Array.isArray(businessData)
          ? businessData
          : businessData.results ?? [];

        if (cancelled) return;

        setBusinesses(businessList);
        setProducts(productResponse);

        setBusinessId(
          activeBusinessId ?? (businessList[0]?.id ? String(businessList[0].id) : ""),
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load merchandise.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [activeBusinessId]);

  useEffect(() => {
    let cancelled = false;
    if (!categoryKind) {
      void Promise.resolve().then(() => {
        if (cancelled) return;
        setCategories([]);
        setValues((current) => ({ ...current, category: "" }));
        setCategoriesLoading(false);
      });
      return;
    }

    void Promise.resolve().then(() => {
      if (!cancelled) setCategoriesLoading(true);
    });
    getCategories(categoryKind)
      .then((options) => {
        if (cancelled) return;
        setCategories(options);
        setValues((current) => ({
          ...current,
          category: options[0] ? String(options[0].id) : "",
        }));
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load categories.");
        }
      })
      .finally(() => { if (!cancelled) setCategoriesLoading(false); });

    return () => { cancelled = true; };
  }, [selectedBusinessId, categoryKind]);

  function openCreateForm() {
    setEditingProduct(null);
    setValues({ ...emptyForm, category: visibleCategories[0] ? String(visibleCategories[0].id) : "" });
    setPhoto(null);
    setPhotoPreview("");
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEditForm(product: Merchandise) {
    setEditingProduct(product);
    setValues({
      name: product.name,
      description: product.description,
      price: product.price,
      stock_quantity: String(product.stock_quantity),
      category: String(product.category),
    });
    setPhoto(null);
    setPhotoPreview(
      imageUrl(product.images?.[0]?.image),
    );
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setValues(emptyForm);
    setPhoto(null);
    setPhotoPreview("");
  }

  function updateField(
    field: keyof FormValues,
    value: string,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handlePhotoChange(file?: File) {
    setPhoto(file ?? null);

    if (!file) {
      setPhotoPreview("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      setPhoto(null);
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  }

async function handleSubmit() {
    if (!selectedBusinessId) {
      setError("Register a business before adding merchandise.");
      return;
    }

    if (!visibleCategories.some((category) => String(category.id) === values.category)) {
      setError("Please select a product category.");
      return;
    }

    const price = Number(values.price);
    const stock = Number(values.stock_quantity);

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid product price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock quantity must be a whole number.");
      return;
    }

    const payload: MerchandisePayload = {
      business: selectedBusinessId,
      category: Number(values.category),
      name: values.name.trim(),
      description: values.description.trim(),
      price: String(price),
      stock_quantity: stock,
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingProduct) {
        await updateMerchandise(editingProduct.id, payload, selectedBusinessId);
        setSuccess("Product updated successfully.");
      } else {
        await createMerchandise(payload);
        setSuccess("Product added successfully.");
      }

      // Product image upload is not supported by the documented API yet.
      if (photo) {
        setSuccess(
          "Product saved. The selected photo is preview-only until the backend provides an image upload endpoint.",
        );
      }

      await loadProducts();
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save this product.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(product: Merchandise) {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer be active.`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deactivateMerchandise(product.id, selectedBusinessId);
      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? { ...item, is_active: false }
            : item,
        ),
      );
      setSuccess("Product deactivated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not deactivate this product.",
      );
    }
  }

  return (
    <VendorLayout
      title="My Merchandise"
      description="Manage the products your business sells."
      vendorWorkspace
    >
      <div className="dashboard-content vm-page">
        <div className="vm-toolbar">
          <div>
            <h2>Your products</h2>
            <p>Add, update, and manage your merchandise.</p>
          </div>

          <button
            type="button"
            className="vm-primary-button"
            onClick={openCreateForm}
            disabled={!selectedBusinessId}
          >
            <Plus size={18} />
            Add merchandise
          </button>
        </div>

        {!activeBusiness && businesses.length > 1 && (
          <div className="vm-business-picker">
            <label htmlFor="vm-business">Business</label>
            <select
              id="vm-business"
              value={businessId}
              onChange={(event) => setBusinessId(event.target.value)}
            >
              {businesses.map((business) => (
                <option key={String(business.id)} value={String(business.id)}>
                  {businessName(business)}
                </option>
              ))}
            </select>
          </div>
        )}

        {!activeBusiness && !loading && businesses.length === 0 && (
          <div className="vm-notice">
            <h3>You need a registered business first</h3>
            <p>Register your business before adding merchandise.</p>
            <a href="/vendor/business-registration">
              Register a business
            </a>
          </div>
        )}

        {error && (
          <div className="vm-message vm-message--error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="vm-message vm-message--success" role="status">
            {success}
          </div>
        )}

        {showForm && (
          <section className="vm-form-card">
            <div className="vm-form-heading">
              <h3>{editingProduct ? "Edit product" : "Add merchandise"}</h3>
              <button
                type="button"
                className="vm-close-button"
                onClick={closeForm}
                aria-label="Close product form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="vm-form">
              <div className="vm-form-grid">
                <div className="vm-field vm-field--full">
                  <label htmlFor="vm-name">Product name *</label>
                  <input
                    id="vm-name"
                    value={values.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                    maxLength={150}
                    placeholder="e.g. Premium dog food"
                  />
                </div>

                <div className="vm-field vm-field--full">
                  <label htmlFor="vm-description">Description</label>
                  <textarea
                    id="vm-description"
                    value={values.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    rows={3}
                    placeholder="Describe your product..."
                  />
                </div>

                <div className="vm-field">
                  <label htmlFor="vm-price">Price (UGX) *</label>
                  <input
                    id="vm-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={values.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="vm-field">
                  <label htmlFor="vm-stock">Stock quantity *</label>
                  <input
                    id="vm-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={values.stock_quantity}
                    onChange={(event) =>
                      updateField("stock_quantity", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="vm-field vm-field--full">
                  <label htmlFor="vm-category">Category *</label>
                  <select
                    id="vm-category"
                    value={values.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    disabled={categoriesLoading || visibleCategories.length === 0}
                    required
                  >
                    <option value="">
                      {categoriesLoading ? "Loading categories..." : "Choose a category"}
                    </option>
                    {visibleCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="vm-field vm-field--full">
                  <label htmlFor="vm-photo">Product photo</label>
                  <input
                    id="vm-photo"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handlePhotoChange(event.target.files?.[0])
                    }
                  />

                  <small>
                    Photo preview only. Backend image upload is not yet
                    available for products.
                  </small>

                  {photoPreview && (
                    <div className="vm-photo-preview">
                      <img src={photoPreview} alt="Product preview" />
                      <button
                        type="button"
                        onClick={() => handlePhotoChange(undefined)}
                      >
                        Remove photo
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="vm-form-actions">
                <button
                  type="button"
                  className="vm-secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vm-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="vm-spinner" size={18} />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    "Update product"
                  ) : (
                    "Save product"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="vm-products-section">
          <div className="vm-products-heading">
            <h3>
              {selectedBusiness
                ? businessName(selectedBusiness)
                : "Your merchandise"}
            </h3>
            <span>{businessProducts.length} products</span>
          </div>

          {loading ? (
            <div className="vm-empty">
              <LoaderCircle className="vm-spinner" size={24} />
              <p>Loading merchandise...</p>
            </div>
          ) : businessProducts.length === 0 ? (
            <div className="vm-empty">
              <Package size={36} />
              <h3>No merchandise yet</h3>
              <p>Add your first product to your store.</p>
              {selectedBusinessId && (
                <button
                  type="button"
                  className="vm-primary-button"
                  onClick={openCreateForm}
                >
                  <Plus size={18} />
                  Add your first product
                </button>
              )}
            </div>
          ) : (
            <div className="vm-products-grid">
              {businessProducts.map((product) => (
                <article
                  className={`vm-product-card${!product.is_active ? " is-inactive" : ""}`}
                  key={product.id}
                >
                  <div className="vm-product-image">
                    {product.images?.[0]?.image ? (
                      <img
                        src={imageUrl(product.images[0].image)}
                        alt={product.images[0].alt_text || product.name}
                      />
                    ) : (
                      <ImagePlus size={34} />
                    )}
                  </div>

                  <div className="vm-product-details">
                    <span
                      className={`vm-product-status${product.is_active ? " is-active" : ""}`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>

                    <h4>{product.name}</h4>

                    <p className="vm-product-description">
                      {product.description || "No description provided."}
                    </p>

                    <strong className="vm-product-price">
                      UGX {Number(product.price).toLocaleString("en-UG")}
                    </strong>

                    <span className="vm-product-stock">
                      Stock: {product.stock_quantity}
                    </span>

                    <div className="vm-product-actions">
                      <button
                        type="button"
                        className="vm-secondary-button"
                        onClick={() => openEditForm(product)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      {product.is_active && (
                        <button
                          type="button"
                          className="vm-danger-button"
                          onClick={() => void handleDeactivate(product)}
                        >
                          <Trash2 size={15} />
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </VendorLayout>
  );
}

