import SkeletonCard from "../common/SkeletonCard";
import type { Product } from "../../data/merchandise";
import MerchCard from "./MerchCard";
import "./MerchGrid.css";

interface MerchGridProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
}

export default function MerchGrid({
  products,
  loading = false,
  skeletonCount = 8,
}: MerchGridProps) {
  if (loading) {
    return (
      <div className="merch-grid" role="status" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="merch-grid">
      {products.map((product, i) => (
        <MerchCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
