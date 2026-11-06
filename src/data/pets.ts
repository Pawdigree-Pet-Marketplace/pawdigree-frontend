/**
 * Shared by the Explore Pets page and its components:
 *   1. types      (what the API returns, what the filters hold)
 *   2. constants  (species list, sort options, page size ...)
 * Helper functions live in utils/petUtils.ts.
 */

/* ================================================================== */
/* 1. Types                                                            */
/* ================================================================== */

export type SpeciesKey = "dog" | "cat" | "rabbit" | "bird" | "fish";
export type ListingType = "ADOPTION" | "SALE";
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type SortKey =
  | "newest"
  | "popular"
  | "price_asc"
  | "price_desc"
  | "age_asc"
  | "age_desc";

/** One pet as returned by GET /api/pets/public/. Fields marked ? may be missing. */
export interface PublicPet {
  pet_id: number;
  business?: number | null; // id of the seller's business
  business_name?: string; // seller name, shown on the card
  listing_type: ListingType;
  name: string;
  species: string;
  breed?: string;
  age: number; // months
  gender: Gender;
  size?: "SMALL" | "MEDIUM" | "LARGE";
  description?: string;
  price?: string | number | null; // e.g. "250000.00"; empty for adoption listings
  adoption_status?: "AVAILABLE" | "PENDING" | "ADOPTED";
  images?: { image_id?: number; image?: string | null; is_primary?: boolean; position?: number }[];
  created_at?: string;
  /** Not returned by the API yet. Shown on the card when present. */
  location?: string;
  /** Not returned by the API yet. Used for Top picks when present. */
  views?: number;
  saves?: number;
  inquiries?: number;
}

export interface FeaturedPet extends PublicPet {
  reason: string;
}

export interface PetFilters {
  species: SpeciesKey[];
  listingType: "" | ListingType;
  locations: string[];
  vendor: string;
  gender: "" | Gender;
  minAge: string;
  maxAge: string;
  minPrice: string;
  maxPrice: string;
}

export interface PetQuery extends PetFilters {
  search: string;
  sort: SortKey;
  page: number;
}

export interface PagedPets {
  count: number;
  results: PublicPet[];
}

export interface TrendingSearch {
  term: string;
  count: number;
}

export type SuggestionKind = "breed" | "pet" | "location" | "vendor";

export interface Suggestion {
  kind: SuggestionKind;
  label: string;
  hint?: string;
  /** true when the match came from typo-tolerance ("Did you mean ...?") */
  fuzzy?: boolean;
}

/* ================================================================== */
/* 2. Constants                                                        */
/* ================================================================== */

export const SPECIES: { key: SpeciesKey; label: string; plural: string }[] = [
  { key: "dog", label: "Dog", plural: "Dogs" },
  { key: "cat", label: "Cat", plural: "Cats" },
  { key: "rabbit", label: "Rabbit", plural: "Rabbits" },
  { key: "bird", label: "Bird", plural: "Birds" },
  { key: "fish", label: "Fish", plural: "Fish" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "age_asc", label: "Age: youngest first" },
  { value: "age_desc", label: "Age: oldest first" },
];

export const PAGE_SIZE = 12;

/** One-tap location shortcuts shown under the location field. */
export const POPULAR_LOCATIONS = ["Kampala", "Entebbe", "Jinja", "Mukono"];

export const EMPTY_FILTERS: PetFilters = {
  species: [],
  listingType: "",
  locations: [],
  vendor: "",
  gender: "",
  minAge: "",
  maxAge: "",
  minPrice: "",
  maxPrice: "",
};

export const DEFAULT_QUERY: PetQuery = {
  ...EMPTY_FILTERS,
  search: "",
  sort: "newest",
  page: 1,
};
