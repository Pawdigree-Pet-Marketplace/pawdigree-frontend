import { useId, useState, type FormEvent } from "react";
import { MapPin, SlidersHorizontal, Store, X } from "lucide-react";
import Button from "../common/Button";
import Typeahead from "../common/Typeahead";
import {
  POPULAR_LOCATIONS,
  SORT_OPTIONS,
  SPECIES,
  type PetFilters as Filters,
  type SortKey,
  type SpeciesKey,
  type Suggestion,
  type SuggestionKind,
} from "../../data/pets";
import { SPECIES_ICON } from "./speciesIcons";
import "./speciesColors.css";
import "./PetFilters.css";

/** id the page's "Filters & sort" button points at (aria-controls). */
export const PET_FILTERS_ID = "pet-filters";

interface PetFiltersProps {
  draft: Filters;
  setDraft: (next: Filters) => void;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
  error: string;
  open: boolean;
  canClear: boolean;
  /** Fetches typo-tolerant suggestions for the location and vendor fields. */
  onLoadSuggestions: (
    query: string,
    kinds: SuggestionKind[],
  ) => Promise<Suggestion[]>;
}

/** Filters and sort live together, like the Figma. Edits a draft; the page applies it. */
export default function PetFilters({
  draft,
  setDraft,
  sort,
  onSort,
  onApply,
  onClear,
  onClose,
  error,
  open,
  canClear,
  onLoadSuggestions,
}: PetFiltersProps) {
  const uid = useId();
  const [locationInput, setLocationInput] = useState("");

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setDraft({ ...draft, [key]: value });
  }

  function addLocation(raw: string) {
    const clean = raw.trim();
    setLocationInput("");
    if (!clean) return;
    if (draft.locations.some((l) => l.toLowerCase() === clean.toLowerCase()))
      return;
    set("locations", [...draft.locations, clean]);
  }

  function toggleLocation(loc: string) {
    const exists = draft.locations.some(
      (l) => l.toLowerCase() === loc.toLowerCase(),
    );
    set(
      "locations",
      exists
        ? draft.locations.filter((l) => l.toLowerCase() !== loc.toLowerCase())
        : [...draft.locations, loc],
    );
  }

  function toggleSpecies(key: SpeciesKey) {
    set(
      "species",
      draft.species.includes(key)
        ? draft.species.filter((s) => s !== key)
        : [...draft.species, key],
    );
  }

  return (
    <form
      id={PET_FILTERS_ID}
      className={`pet-filters${open ? " is-open" : ""}`}
      aria-label="Filter and sort pets"
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="pet-filters__head">
        <h2>
          <SlidersHorizontal size={18} aria-hidden="true" />
          Filters
        </h2>
        <button
          type="button"
          className="pet-filters__close"
          onClick={onClose}
          aria-label="Close filters"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="pet-filters__scroll">
        <div className="pet-filters__group">
          <label className="pet-filters__title" htmlFor={`${uid}-sort`}>
            Sort by
          </label>
          <select
            id={`${uid}-sort`}
            className="pet-filters__select"
            value={sort}
            onChange={(e) => onSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="pet-filters__group">
          <span className="pet-filters__title" id={`${uid}-type`}>
            Listing type
          </span>
          <div
            className="pet-filters__segment"
            role="group"
            aria-labelledby={`${uid}-type`}
          >
            {(
              [
                ["", "All"],
                ["ADOPTION", "Adoption"],
                ["SALE", "For sale"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={label}
                className={draft.listingType === value ? "is-on" : ""}
                aria-pressed={draft.listingType === value}
                onClick={() => set("listingType", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="pet-filters__group pet-filters__fieldset">
          <legend className="pet-filters__title">Species</legend>
          {SPECIES.map((s) => {
            const Icon = SPECIES_ICON[s.key];
            return (
              <label
                className="pet-filters__check"
                key={s.key}
                data-species={s.key}
              >
                <input
                  type="checkbox"
                  checked={draft.species.includes(s.key)}
                  onChange={() => toggleSpecies(s.key)}
                />
                <span className="pet-filters__check-icon">
                  <Icon size={15} aria-hidden="true" />
                </span>
                {s.plural}
              </label>
            );
          })}
        </fieldset>

        <div className="pet-filters__group">
          <Typeahead
            variant="field"
            label="Location"
            placeholder="Type a town or district"
            value={locationInput}
            onChange={setLocationInput}
            onPick={(s) => addLocation(s.label)}
            onSubmit={addLocation}
            emptyText="No matching town. Press Enter to use it anyway."
            loadSuggestions={(q) => onLoadSuggestions(q, ["location"])}
            icon={<MapPin size={16} aria-hidden="true" />}
          />
          {draft.locations.length > 0 && (
            <ul
              className="pet-filters__loc-list"
              aria-label="Selected locations"
            >
              {draft.locations.map((loc) => (
                <li key={loc}>
                  <button
                    type="button"
                    className="pet-filters__loc-chip"
                    onClick={() => toggleLocation(loc)}
                  >
                    {loc}
                    <X size={13} aria-label={`Remove ${loc}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div
            className="pet-filters__popular"
            role="group"
            aria-label="Popular locations"
          >
            {POPULAR_LOCATIONS.map((loc) => {
              const on = draft.locations.some(
                (l) => l.toLowerCase() === loc.toLowerCase(),
              );
              return (
                <button
                  type="button"
                  key={loc}
                  className={on ? "is-on" : ""}
                  aria-pressed={on}
                  onClick={() => toggleLocation(loc)}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pet-filters__group">
          <Typeahead
            variant="field"
            label="Vendor"
            placeholder="Search by business name"
            value={draft.vendor}
            onChange={(v) => set("vendor", v)}
            onPick={(s) => set("vendor", s.label)}
            loadSuggestions={(q) => onLoadSuggestions(q, ["vendor"])}
            emptyText={null}
            icon={<Store size={16} aria-hidden="true" />}
          />
        </div>

        <div className="pet-filters__group">
          <span className="pet-filters__title" id={`${uid}-gender`}>
            Gender
          </span>
          <div
            className="pet-filters__segment"
            role="group"
            aria-labelledby={`${uid}-gender`}
          >
            {(
              [
                ["", "Any"],
                ["MALE", "Male"],
                ["FEMALE", "Female"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={label}
                className={draft.gender === value ? "is-on" : ""}
                aria-pressed={draft.gender === value}
                onClick={() => set("gender", value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="pet-filters__group pet-filters__fieldset">
          <legend className="pet-filters__title">Age (months)</legend>
          <div className="pet-filters__range">
            <input
              className="pet-filters__field"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="Min"
              aria-label="Minimum age in months"
              value={draft.minAge}
              onChange={(e) => set("minAge", e.target.value)}
            />
            <span aria-hidden="true">to</span>
            <input
              className="pet-filters__field"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="Max"
              aria-label="Maximum age in months"
              value={draft.maxAge}
              onChange={(e) => set("maxAge", e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="pet-filters__group pet-filters__fieldset">
          <legend className="pet-filters__title">Price (UGX)</legend>
          <div className="pet-filters__range">
            <input
              className="pet-filters__field"
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
              className="pet-filters__field"
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
          <p className="pet-filters__hint">
            Only pets for sale have a price. Adoption pets are hidden when you
            set one.
          </p>
        </fieldset>

        {error && (
          <p className="pet-filters__error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="pet-filters__actions">
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
