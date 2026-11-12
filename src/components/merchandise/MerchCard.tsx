
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Store } from "lucide-react";
import type { CSSProperties } from "react";
import type { Product } from "../../data/merchandise";
import AddToCartButton from "../cart/AddToCartButton";
import "./MerchCard.css";

function ProductImage({ product }: { product: Product }) {
  const src = product.main_image;

  // Remember which URL failed, so a new photo can be tried again.
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);

  if (!src || failedSrc === src) {
    return (
      <div
        className="merch-card__placeholder"
        role="img"
        aria-label="No photo yet"
      >
        <ShoppingBag size={34} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}

interface MerchCardProps {
  product: Product;
  /** Position in a list; drives the staggered entrance. */
  index?: number;
}

export default function MerchCard({ product, index = 0 }: MerchCardProps) {
  const inStock = product.is_available;
  const hasPrice = product.price !== null && product.price !== "";

  const cartProduct = {
    id: product.id,
    name: product.name,
    price: hasPrice ? Number(product.price) : undefined,
    image: product.main_image ?? undefined,
  };

  return (
    <article
      className={`merch-card${inStock ? "" : " is-unavailable"}`}
      style={{ "--n": index } as CSSProperties}
    >
      <div className="merch-card__media">
        <ProductImage product={product} />

        {product.category_name && (
          <span className="merch-card__chip">
            {product.category_name}
          </span>
        )}
      </div>

      <div className="merch-card__body">
        <h3 className="merch-card__title">{product.name}</h3>

        <p className="merch-card__price">
          <span className="merch-card__price-label">Price</span>
          <strong>
            {hasPrice
              ? `UGX ${Number(product.price).toLocaleString("en-UG")}`
              : "Ask vendor"}
          </strong>
        </p>

        <p className={`merch-card__status ${inStock ? "is-in" : "is-out"}`}>
          {inStock ? "In stock" : "Out of stock"}
        </p>

        {product.business_name && (
          <p className="merch-card__vendor">
            <Store size={13} aria-hidden="true" />
            <span className="merch-card__vendor-name">
              {product.business_name}
            </span>
          </p>
        )}

        <AddToCartButton
          product={cartProduct}
          disabled={!inStock || !hasPrice}
        />

        <Link className="merch-card__btn" to={`/merchandise/${product.id}`}>
          View details
        </Link>
      </div>
    </article>
  );
}
