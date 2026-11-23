import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import MerchGrid from "../merchandise/MerchGrid";
import type { MerchQuery, Product } from "../../data/merchandise";
import { fetchProducts } from "../../services/publicMerchandiseApi";
import "./Merchandise.css";

const FEATURED_QUERY: MerchQuery = {
  page: 1,
  search: "",
  category: "",
  vendor: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  sort: "newest",
};

const FEATURED_PRODUCT_COUNT = 4;

export default function Merchandise() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchProducts(FEATURED_QUERY)
      .then((response) => {
        if (cancelled) return;
        setProducts(response.results.slice(0, FEATURED_PRODUCT_COUNT));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <section className="container section home-merchandise" id="merchandise">
      <div className="section-header">
        <h2 className="section-title">Shop Pet Merchandise</h2>
      </div>
      <div className="home-merchandise-content">
        {status === "loading" ? (
          <p className="home-merchandise-state" role="status">
            Loading merchandise…
          </p>
        ) : status === "error" ? (
          <div className="home-merchandise-state" role="alert">
            <p>We couldn’t load merchandise right now.</p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setRetryCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <p className="home-merchandise-state" role="status">
            No merchandise is available yet. Check back soon.
          </p>
        ) : (
          <MerchGrid products={products} />
        )}

        <Link className="home-merchandise-link" to="/merchandise">
          Browse all merchandise <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
