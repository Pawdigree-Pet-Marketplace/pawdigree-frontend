import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

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
  uploadMerchandiseImage,
  deleteMerchandiseImage,
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
import { getDescriptionErrorFromMessage, getListingDescriptionError, limitListingDescriptionWords, MAX_LISTING_DESCRIPTION_CHARACTERS, MAX_LISTING_DESCRIPTION_WORDS } from "../../utils/descriptionValidation";
import { countWords } from "../../utils/petUtils";

import type { Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";

import "./VendorMerchandisePage.css";

type BusinessResponse = Business[] | { results?: Business[] };

type SelectedImage = {
  id: number;
  file: File;
  preview: string;
};

type FormValues = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  category: string;
};

function ProductImageGallery({ product }: { product: Merchandise }) {
  const images = product.images ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="vm-product-image" aria-label={`${product.name} photos`}>
      <div className="vm-product-image-stage">
        {activeImage?.image ? (
          <img src={imageUrl(activeImage.image)} alt={activeImage.alt_text || product.name} />
        ) : (
          <ImagePlus size={34} aria-hidden="true" />
        )}
      </div>
      {images.length > 1 && (
        <div className="vm-product-image-thumbnails" aria-label="Choose product photo">
          {images.map((image, index) => (
            <button
              type="button"
              key={image.id}
              className={index === activeIndex ? "is-selected" : ""}
              aria-label={`Show photo ${index + 1} of ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img src={imageUrl(image.image)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

function approvalStatus(product: Merchandise) {
  if (product.approved) return "Approved";
  return product.rejection_reason ? "Rejected" : "Awaiting approval";
}

function saveMessage(product: Merchandise, action: string) {
  if (product.rejection_reason) {
    return `${action}. This listing is still rejected: ${product.rejection_reason}`;
  }
  if (!product.approved) {
    return `${action}. This listing is awaiting admin approval before customers can see it.`;
  }
  return action;
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
  const [descriptionError, setDescriptionError] = useState("");

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [uploadProgress, setUploadProgress] = useState<{
    message: string;
    value: number;
    total: number;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const nextImageId = useRef(0);
  const previewUrls = useRef(new Set<string>());

  const selectedBusiness = activeBusiness ?? businesses.find(
    (business) => String(business.id) === businessId,
  );
  const merchandiseBusinesses = businesses.filter((business) => business.business_type === "PRODUCT_SELLER");
  const selectedBusinessId = activeBusinessId ?? businessId;
  const categoryKind = categoryKindForBusinessType(selectedBusiness?.business_type);
  const visibleCategories = categories.filter(
    (category) => category.is_active && category.kind === categoryKind,
  );

  const businessProducts = useMemo(
    () => products.filter((product) => String(product.business) === selectedBusinessId),
    [products, selectedBusinessId],
  );

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    },
    [],
  );

  const savedImages = editingProduct?.images ?? [];
  const visibleSavedImages = savedImages.filter(
    (image) => !removedImageIds.has(image.id),
  );

  function releasePreview(url: string) {
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  }

  function clearSelectedImages() {
    selectedImages.forEach((image) => releasePreview(image.preview));
    setSelectedImages([]);
  }

  function syncProduct(product: Merchandise) {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists
        ? current.map((item) => (item.id === product.id ? product : item))
        : [product, ...current];
    });
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
        const firstMerchandiseBusiness = businessList.find(
          (business) => business.business_type === "PRODUCT_SELLER",
        );

        if (cancelled) return;

        setBusinesses(businessList);
        setProducts(productResponse);

        setBusinessId(
          activeBusinessId ?? (firstMerchandiseBusiness?.id ? String(firstMerchandiseBusiness.id) : ""),
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
    clearSelectedImages();
    setRemovedImageIds(new Set());
    setShowForm(true);
    setError("");
    setSuccess("");
    setDescriptionError("");
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
    clearSelectedImages();
    setRemovedImageIds(new Set());
    setShowForm(true);
    setError("");
    setSuccess("");
    setDescriptionError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
    setValues(emptyForm);
    clearSelectedImages();
    setRemovedImageIds(new Set());
    setDescriptionError("");
  }

  function updateField(
    field: keyof FormValues,
    value: string,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleImageSelection(files: FileList | null) {
    const chosen = Array.from(files ?? []);
    if (!chosen.length) return;

    if (visibleSavedImages.length + selectedImages.length + chosen.length > 5) {
      setError("A product can have at most five photos. Remove a saved photo to add another.");
      return;
    }

    const unsupported = chosen.find(
      (file) => !/\.(jpe?g|png|webp)$/i.test(file.name),
    );
    if (unsupported) {
      setError("Choose JPEG, PNG, or WebP photos only.");
      return;
    }

    const tooLarge = chosen.find((file) => file.size > 5 * 1024 * 1024);
    if (tooLarge) {
      setError("Each photo must be 5 MB or smaller.");
      return;
    }

    const additions = chosen.map((file) => {
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);
      return { id: nextImageId.current++, file, preview };
    });
    setSelectedImages((current) => [...current, ...additions]);
    setError("");
  }

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setDescriptionError("");
    const descriptionValidationError = getListingDescriptionError(values.description);
    if (descriptionValidationError) {
      setDescriptionError(descriptionValidationError);
      return;
    }
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

    if (!Number.isFinite(price) || price <= 0) {
      setError("Product price must be greater than zero.");
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

    const imagesToDelete = savedImages.filter((image) =>
      removedImageIds.has(image.id),
    );
    const imagesToUpload = [...selectedImages];
    const totalImageOperations = imagesToDelete.length + imagesToUpload.length;
    let completedImageOperations = 0;
    let productSaved = false;

    setSaving(true);
    setError("");
    setSuccess("");
    setUploadProgress(
      totalImageOperations
        ? { message: "Saving product details…", value: 0, total: totalImageOperations }
        : null,
    );

    try {
      let savedProduct: Merchandise;
      if (editingProduct) {
        savedProduct = await updateMerchandise(
          editingProduct.id,
          payload,
          selectedBusinessId,
        );
      } else {
        savedProduct = await createMerchandise(payload);
      }
      productSaved = true;
      setEditingProduct(savedProduct);
      syncProduct(savedProduct);

      for (let index = 0; index < imagesToDelete.length; index += 1) {
        const image = imagesToDelete[index];
        setUploadProgress({
          message: `Removing saved photo ${index + 1} of ${imagesToDelete.length}…`,
          value: completedImageOperations,
          total: totalImageOperations,
        });
        await deleteMerchandiseImage(savedProduct.id, image.id);
        completedImageOperations += 1;
        savedProduct = {
          ...savedProduct,
          approved: false,
          rejection_reason: "",
          images: savedProduct.images.filter((saved) => saved.id !== image.id),
        };
        setRemovedImageIds((current) => {
          const next = new Set(current);
          next.delete(image.id);
          return next;
        });
        setEditingProduct(savedProduct);
        syncProduct(savedProduct);
      }

      for (let index = 0; index < imagesToUpload.length; index += 1) {
        const selected = imagesToUpload[index];
        setUploadProgress({
          message: `Uploading photo ${index + 1} of ${imagesToUpload.length}…`,
          value: completedImageOperations,
          total: totalImageOperations,
        });
        const displayOrder = savedProduct.images.reduce(
          (highest, image) => Math.max(highest, image.display_order),
          -1,
        ) + 1;
        const uploaded = await uploadMerchandiseImage(
          savedProduct.id,
          selected.file,
          savedProduct.name,
          displayOrder,
        );
        completedImageOperations += 1;
        savedProduct = {
          ...savedProduct,
          approved: false,
          rejection_reason: "",
          images: [...savedProduct.images, uploaded].sort(
            (first, second) => first.display_order - second.display_order,
          ),
        };
        releasePreview(selected.preview);
        setSelectedImages((current) =>
          current.filter((image) => image.id !== selected.id),
        );
        setEditingProduct(savedProduct);
        syncProduct(savedProduct);
        setUploadProgress({
          message: `Uploaded photo ${index + 1} of ${imagesToUpload.length}.`,
          value: completedImageOperations,
          total: totalImageOperations,
        });
      }

      setSuccess(
        saveMessage(
          savedProduct,
          editingProduct ? "Product updated successfully" : "Product added successfully",
        ),
      );
      closeForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setDescriptionError(getDescriptionErrorFromMessage(message) ?? "");
      if (productSaved) {
        setSuccess("Product details were saved. Resolve the photo issue and submit again to finish.");
      }
      setError(
        err instanceof Error
          ? err.message
          : "Could not save this product.",
      );
    } finally {
      setSaving(false);
      setUploadProgress(null);
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
              {merchandiseBusinesses.map((business) => (
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
                disabled={saving}
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
                      { const limited = limitListingDescriptionWords(event.target.value); updateField("description", limited); setDescriptionError(limited === event.target.value ? "" : "Description is limited to 300 words."); }
                    }
                    maxLength={MAX_LISTING_DESCRIPTION_CHARACTERS}
                    aria-describedby="vm-description-count vm-description-error"
                    aria-invalid={Boolean(descriptionError)}
                    rows={3}
                    placeholder="Describe your product..."
                  />
                  <small id="vm-description-count">{countWords(values.description)} / {MAX_LISTING_DESCRIPTION_WORDS} words</small>
                  {descriptionError && <p id="vm-description-error" className="field-error" role="alert">{descriptionError}</p>}
                </div>

                <div className="vm-field">
                  <label htmlFor="vm-price">Price (UGX) *</label>
                  <input
                    id="vm-price"
                    type="number"
                    min="0.01"
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
                  <label htmlFor="vm-photo">Product photos</label>
                  <input
                    id="vm-photo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    disabled={saving || visibleSavedImages.length + selectedImages.length >= 5}
                    onChange={(event) => {
                      handleImageSelection(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />

                  <small>
                    JPEG, PNG, or WebP; 5 MB maximum per photo and five photos per product.
                  </small>

                  {(savedImages.length > 0 || selectedImages.length > 0) && (
                    <div className="vm-photo-grid" aria-label="Product photos">
                      {savedImages.map((image) => {
                        const markedForRemoval = removedImageIds.has(image.id);
                        return (
                          <div
                            className={`vm-photo-item${markedForRemoval ? " is-marked-for-removal" : ""}`}
                            key={`saved-${image.id}`}
                          >
                            <button
                              type="button"
                              className="vm-photo-preview-button"
                              aria-label={`Preview saved photo: ${image.alt_text || values.name || "Product photo"}`}
                              onClick={() => setPreviewImage({ src: imageUrl(image.image), alt: image.alt_text || values.name || "Saved product photo" })}
                            >
                              <img src={imageUrl(image.image)} alt={image.alt_text || values.name || "Saved product photo"} />
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => setRemovedImageIds((current) => {
                                const next = new Set(current);
                                if (markedForRemoval) next.delete(image.id);
                                else next.add(image.id);
                                return next;
                              })}
                            >
                              {markedForRemoval ? "Undo removal" : "Remove saved photo"}
                            </button>
                            {markedForRemoval && <span>Will be removed when saved</span>}
                          </div>
                        );
                      })}
                      {selectedImages.map((image, index) => (
                        <div className="vm-photo-item" key={`selected-${image.id}`}>
                          <button
                            type="button"
                            className="vm-photo-preview-button"
                            aria-label={`Preview selected photo ${index + 1}`}
                            onClick={() => setPreviewImage({ src: image.preview, alt: `Selected photo ${index + 1}` })}
                          >
                            <img src={image.preview} alt={`Selected photo ${index + 1}`} />
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              releasePreview(image.preview);
                              setSelectedImages((current) => current.filter((item) => item.id !== image.id));
                            }}
                          >
                            Remove selected photo
                          </button>
                          <span>Not uploaded yet</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadProgress && (
                    <div className="vm-upload-progress" role="status">
                      <span>{uploadProgress.message}</span>
                      <progress
                        aria-label={uploadProgress.message}
                        max={uploadProgress.total}
                        value={uploadProgress.value}
                      />
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
                  <ProductImageGallery product={product} />

                  <div className="vm-product-details">
                    <h4>{product.name}</h4>

                    <div className="vm-product-badges" role="group" aria-label="Product status">
                      <span
                        className={`vm-product-status${product.is_active ? " is-active" : ""}`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                      <span
                        className={`vm-product-review-status${product.rejection_reason ? " is-rejected" : product.approved ? " is-approved" : " is-pending"}`}
                      >
                        {approvalStatus(product)}
                      </span>
                    </div>
                    {product.rejection_reason && (
                      <p className="vm-product-review-reason" title={product.rejection_reason}>
                        {product.rejection_reason}
                      </p>
                    )}

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
        {previewImage && (
          <div className="vm-image-preview-backdrop" onClick={() => setPreviewImage(null)}>
            <section
              className="vm-image-preview-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Product photo preview"
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="vm-image-preview-close" aria-label="Close photo preview" onClick={() => setPreviewImage(null)}>
                <X size={20} />
              </button>
              <img src={previewImage.src} alt={previewImage.alt} />
              <p>{previewImage.alt}</p>
            </section>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}

