
import { useEffect, useMemo, useState } from 'react';
import { Search, Save, ChevronDown, ChevronRight } from 'lucide-react';
import {
  getCategories,
  saveBusinessCategories,
  type Category,
} from '../../services/categoryService';
import './VendorCategorySelector.css';

type Props = {
  businessId?: string;
};
export default function VendorCategorySelector({
  businessId = '',
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load categories from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError('');

      try {
        const data = await getCategories();

        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load categories.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter categories when the user searches.
  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query),
    );
  }, [categories, search]);

  // Select or deselect a category.
  function toggleCategory(id: number) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id],
    );

    setSuccess('');
    setError('');
  }

  // Save selected categories to the backend.
  async function handleSaveCategories() {
    const trimmedBusinessId = businessId?.trim();

    if (!trimmedBusinessId) {
      setError('A business ID is required to save categories.');
      return;
    }

    if (selectedIds.length === 0) {
      setError('Select at least one category before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await saveBusinessCategories(trimmedBusinessId, selectedIds);
      setSuccess('Your business categories have been saved.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save categories. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="vendor-category-page">
      <header className="category-topbar">
        <div className="category-page-heading">
          <span className="category-breadcrumb">
            app.pawdigree.com/vendor/dashboard
          </span>
          <h1>Select a Category</h1>
        </div>

        <label className="category-header-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search categories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </header>

      <section className="category-content">
        <label className="category-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search categories..."
            aria-label="Filter categories"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {loading && (
          <p className="category-status" role="status">
            Loading categories...
          </p>
        )}

        {!loading && error && (
          <p className="category-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <section className="category-card">
            <button
              type="button"
              className="category-card-heading"
              aria-expanded={expanded}
              onClick={() => setExpanded((previous) => !previous)}
            >
              {expanded ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
              <span>Available Categories</span>
            </button>

            {expanded && (
              <div className="category-options">
                {visibleCategories.map((category) => (
                  <label
                    className="category-option"
                    key={category.id}
                    title={category.description || category.name}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />

                    <span
                      className="category-radio"
                      aria-hidden="true"
                    />

                    <span className="category-option-label">
                      {category.name}
                    </span>
                  </label>
                ))}

                {visibleCategories.length === 0 && (
                  <p className="category-empty">
                    No matching categories found.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        <p className="category-selection-count" aria-live="polite">
          {selectedIds.length} categor
          {selectedIds.length === 1 ? 'y' : 'ies'} selected
        </p>

        {success && (
          <p className="category-success" role="status">
            {success}
          </p>
        )}

        <button
          className="category-save-button"
          type="button"
          onClick={handleSaveCategories}
          disabled={loading || saving}
        >
          <Save size={16} aria-hidden="true" />
          {saving ? 'Saving...' : 'Save Categories'}
        </button>
      </section>
    </main>
  );
}
