import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageOff, PackageCheck, Store } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AddToCartButton from "../../components/cart/AddToCartButton";
import type { Product } from "../../data/merchandise";
import ReviewsSection from "../../components/reviews/ReviewsSection";
import { fetchProduct } from "../../services/publicMerchandiseApi";
import "./ProductDetailsPage.css";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; product: Product; productId: string }
  | { status: "error"; message: string; notFound: boolean; productId: string };

function formatPrice(price: Product["price"]): string {
  if (price === null || price === "") return "Price unavailable";
  return `UGX ${Number(price).toLocaleString("en-UG")}`;
}

export default function ProductDetailsPage() {
  const { productId = "" } = useParams();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [retryCount, setRetryCount] = useState(0);
  const [activeImage, setActiveImage] = useState("");
  const [failedImages, setFailedImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchProduct(productId)
      .then((product) => {
        if (!cancelled) {
          setFailedImages([]);
          setActiveImage(product.main_image ?? product.images?.[0]?.image ?? "");
          setState({ status: "ready", product, productId });
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Please try again.";
        const notFound = /not found|404/i.test(message);
        setState({
          status: "error",
          message: notFound
            ? "This product may have been removed or is no longer available."
            : "We couldn’t load this product. Check your connection and try again.",
          notFound,
          productId,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [productId, retryCount]);

  const images = useMemo(() => {
    if (state.status !== "ready") return [];
    const candidates = [
      ...(state.product.main_image ? [state.product.main_image] : []),
      ...(state.product.images ?? []).map((image) => image.image),
    ];
    return [...new Set(candidates.filter(Boolean))];
  }, [state]);

  if (state.status === "loading" || state.productId !== productId) {
    return (
      <main className="product-detail-page" aria-busy="true">
        <Link className="product-detail-back" to="/merchandise"><ArrowLeft size={17} /> Back to merchandise</Link>
        <div className="product-detail-loading" role="status" aria-label="Loading product">
          <span /><span /><span />
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="product-detail-page">
        <Link className="product-detail-back" to="/merchandise"><ArrowLeft size={17} /> Back to merchandise</Link>
        <section className="product-detail-state" role={state.notFound ? "status" : "alert"}>
          <ImageOff size={34} aria-hidden="true" />
          <h1>{state.notFound ? "Product not found" : "Unable to load product"}</h1>
          <p>{state.message}</p>
          {!state.notFound && <button type="button" onClick={() => { setState({ status: "loading" }); setRetryCount((count) => count + 1); }}>Try again</button>}
          <Link className="product-detail-state-link" to="/merchandise">Browse merchandise</Link>
        </section>
      </main>
    );
  }

  const { product } = state;
  const available = product.is_available;

  return (
    <main className="product-detail-page">
      <Link className="product-detail-back" to="/merchandise"><ArrowLeft size={17} /> Back to merchandise</Link>
      <article className="product-detail-card">
        <section className="product-detail-gallery" aria-label="Product photos">
          <div className="product-detail-main-image">
            {activeImage && !failedImages.includes(activeImage) ? (
              <img
                src={activeImage}
                alt={product.name}
                onError={() => setFailedImages((current) => [...current, activeImage])}
              />
            ) : (
              <div className="product-detail-image-fallback" role="img" aria-label="Product photo unavailable">
                <ImageOff size={48} /><span>Photo coming soon</span>
              </div>
            )}
            <span className={`product-detail-stock ${available ? "is-available" : "is-unavailable"}`}>
              <PackageCheck size={15} aria-hidden="true" />
              {available ? "In stock" : "Out of stock"}
            </span>
          </div>
          {images.length > 1 && (
            <div className="product-detail-thumbnails" aria-label="Choose a product photo">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={activeImage === image ? "is-active" : ""}
                  onClick={() => setActiveImage(image)}
                  aria-label={`View product photo ${index + 1}`}
                  aria-pressed={activeImage === image}
                >
                  {failedImages.includes(image) ? <ImageOff size={20} /> : <img src={image} alt="" onError={() => setFailedImages((current) => [...current, image])} />}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="product-detail-info">
          <p className="product-detail-eyebrow">PAWDIGREE PET STORE</p>
          {product.category_name && <span className="product-detail-category">{product.category_name}</span>}
          <h1>{product.name}</h1>
          <p className="product-detail-price">{formatPrice(product.price)}</p>
          <p className={`product-detail-availability ${available ? "is-available" : "is-unavailable"}`}>
            {available ? "Available to add to your cart" : "Currently unavailable"}
          </p>

          <div className="product-detail-description">
            <h2>About this product</h2>
            <p>{product.description?.trim() || "The vendor hasn’t added a description for this product yet."}</p>
          </div>

          {product.business_name && (
            <div className="product-detail-vendor">
              <Store size={18} aria-hidden="true" />
              <span><small>Sold by</small><strong>{product.business_name}</strong></span>
            </div>
          )}

          {available ? (
            <AddToCartButton product={{ id: product.id, name: product.name, price: Number(product.price ?? 0), image: product.main_image ?? undefined }} />
          ) : (
            <button className="product-detail-add-button" type="button" disabled aria-disabled="true">Out of stock</button>
          )}
          <p className="product-detail-cart-note">Secure checkout through your Pawdigree cart.</p>
        </section>
      </article>
      <ReviewsSection kind="product" targetId={product.id} />
    </main>
  );
}
