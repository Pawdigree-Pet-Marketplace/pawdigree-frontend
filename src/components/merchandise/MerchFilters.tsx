import { useId, useState, type FormEvent } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Button from "../common/Button";
import {
  MERCH_SORT_OPTIONS,
  type MerchCategory,
  type MerchFilterValues,
  type MerchSort,
} from "../../data/merchandise";
import "./MerchFilters.css";

/** Keeps only the filter fields (the page passes the whole query, which also has page and search). */
function pickFilterValues(v: MerchFilterValues): MerchFilterValues {
  return {
    category: v.category,
    vendor: v.vendor,
    minPrice: v.minPrice,
    maxPrice: v.maxPrice,
    inStock: v.inStock,
    sort: v.sort,
  };
}

/** id the page's "Filters & sort" button points at (aria-controls). */
export const MERCH_FILTERS_ID = "merch-filters";

interface MerchFiltersProps {
  /** The filters currently applied. The panel edits its own draft copy. */
  applied: MerchFilterValues;
  categories: MerchCategory[];
  onApply: (values: MerchFilterValues) => void;
  onClear: () => void;
  onClose: () => void;
  open: boolean;
  canClear: boolean;
}

/** Filters and sort. Edits a draft; the page applies it. Remount (key) to reset the draft. */
export default function MerchFilters({
  applied,
  categories,
  onApply,
  onClear,
  onClose,
  open,
  canClear,
}: MerchFiltersProps) {
  const uid = useId();
  const [draft, setDraft] = useState<MerchFilterValues>(() =>
    pickFilterValues(applied),
  );
  const [error, setError] = useState("");

  function set<K extends keyof MerchFilterValues>(
    key: K,
    value: MerchFilterValues[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      [draft.minPrice, draft.maxPrice].some((v) => v !== "" && !/^\d+$/.test(v))
    ) {
      setError("Enter prices as whole numbers.");
      return;
    }
    if (
      draft.minPrice !== "" &&
      draft.maxPrice !== "" &&
      Number(draft.minPrice) > Number(draft.maxPrice)
    ) {
      setError("Minimum price must be less than or equal to maximum price.");
      return;
    }
    setError("");
    onApply({ ...draft, vendor: draft.vendor.trim() });
  }

  return (
    <form
      id={MERCH_FILTERS_ID}
      className={`merch-filters${open ? " is-open" : ""}`}
      aria-label="Filter and sort merchandise"
      onSubmit={submit}
    >
      <div className="merch-filters__head">
        <h2>
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filters
        </h2>
        <button
          type="button"
          className="merch-filters__close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="merch-filters__scroll">
        <div className="merch-filters__group">
          <label className="merch-filters__title" htmlFor={`${uid}-sort`}>
            Sort by
          </label>
          <select
            id={`${uid}-sort`}
            className="merch-filters__field"
            value={draft.sort}
            onChange={(e) => set("sort", e.target.value as MerchSort)}
          >
            {MERCH_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="merch-filters__group">
          <span className="merch-filters__title" id={`${uid}-stock`}>
            Availability
          </span>
          <div
            className="merch-filters__segment"
            role="group"
            aria-labelledby={`${uid}-stock`}
          >
            {(
              [
                [false, "All"],
                [true, "In stock"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={label}
                className={draft.inStock === value ? "is-on" : ""}
                aria-pressed={draft.inStock === value}
                onClick={() => set("inStock", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="merch-filters__group">
            <label className="merch-filters__title" htmlFor={`${uid}-category`}>
              Category
            </label>
            <select
              id={`${uid}-category`}
              className="merch-filters__field"
              value={draft.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="merch-filters__group">
          <label className="merch-filters__title" htmlFor={`${uid}-vendor`}>
            Vendor
          </label>
          <input
            id={`${uid}-vendor`}
            className="merch-filters__field"
            type="text"
            autoComplete="off"
            placeholder="Search by business name"
            value={draft.vendor}
            onChange={(e) => set("vendor", e.target.value)}
          />
        </div>

        <fieldset className="merch-filters__group merch-filters__fieldset">
          <legend className="merch-filters__title">Price (UGX)</legend>
          <div className="merch-filters__range">
            <input
              className="merch-filters__field"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="Min"
              aria-label="Minimum price in UGX"
              value={draft.minPrice}
              onChange={(e) => set("minPrice", e.target.value)}
            />
            <span aria-hidden="true">to</span>
            <input
              className="merch-filters__field"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder="Max"
              aria-label="Maximum price in UGX"
              value={draft.maxPrice}
              onChange={(e) => set("maxPrice", e.target.value)}
            />
          </div>
        </fieldset>

        {error && (
          <p className="merch-filters__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="merch-filters__actions">
        <Button type="submit">Apply filters</Button>
        {canClear && (
          <Button variant="ghost" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>
    </form>
  );
}
