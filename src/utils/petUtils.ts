import {
  PAGE_SIZE,
  SORT_OPTIONS,
  SPECIES,
  type FeaturedPet,
  type PetFilters,
  type PetQuery,
  type PublicPet,
  type SortKey,
  type SpeciesKey,
} from "../data/pets";

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

export function speciesKey(species: string): SpeciesKey | null {
  const s = species.trim().toLowerCase();
  const found = SPECIES.find((x) => x.key === s || x.plural.toLowerCase() === s || `${x.key}s` === s);
  return found ? found.key : null;
}

export function formatAge(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} old`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} year${years === 1 ? "" : "s"}`;
  return rest ? `${y} ${rest} month${rest === 1 ? "" : "s"} old` : `${y} old`;
}

export function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function formatPrice(price: string | number | null | undefined): string | null {
  if (price == null || price === "") return null;
  const n = Number(price);
  return Number.isFinite(n) ? `UGX ${n.toLocaleString("en-UG")}` : null;
}

export function primaryImage(pet: PublicPet): string | undefined {
  return (
    pet.images?.find((i) => i.is_primary && i.image)?.image ||
    pet.images?.find((i) => i.image)?.image ||
    undefined
  );
}

export function isNewListing(pet: PublicPet): boolean {
  if (!pet.created_at) return false;
  return Date.now() - new Date(pet.created_at).getTime() < 7 * 86_400_000;
}

/* ------------------------------------------------------------------ */
/* Query <-> URL helpers                                               */
/* ------------------------------------------------------------------ */

export function queryFilters(q: PetQuery): PetFilters {
  return {
    species: [...q.species],
    listingType: q.listingType,
    locations: [...q.locations],
    vendor: q.vendor,
    gender: q.gender,
    minAge: q.minAge,
    maxAge: q.maxAge,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
  };
}

export function queryToParams(q: PetQuery, includePageSize = false): URLSearchParams {
  const p = new URLSearchParams();
  const search = q.search.trim();
  if (search) p.set("search", search);
  if (q.breed?.trim()) p.set("breed", q.breed.trim());
  if (q.species.length) p.set("species", q.species.join(","));
  if (q.listingType) p.set("listing_type", q.listingType);
  if (q.locations.length) p.set("location", q.locations.join(","));
  if (q.vendor.trim()) p.set("vendor", q.vendor.trim());
  if (q.gender) p.set("gender", q.gender);
  if (q.minAge) p.set("age_min", q.minAge);
  if (q.maxAge) p.set("age_max", q.maxAge);
  if (q.minPrice) p.set("price_min", q.minPrice);
  if (q.maxPrice) p.set("price_max", q.maxPrice);
  if (q.sort !== "newest") p.set("sort", q.sort);
  if (q.page > 1) p.set("page", String(q.page));
  if (includePageSize) p.set("page_size", String(PAGE_SIZE));
  return p;
}

export function paramsToQuery(search: string): PetQuery {
  const p = new URLSearchParams(search);
  const species = (p.get("species") ?? "")
    .split(",")
    .filter((s): s is SpeciesKey => SPECIES.some((x) => x.key === s));
  const listing = p.get("listing_type")?.toUpperCase();
  const gender = p.get("gender");
  const sort = p.get("sort");
  const page = Number(p.get("page"));
  const digits = (v: string | null) => (v && /^\d+$/.test(v) ? v : "");

  return {
    search: p.get("search") ?? "",
    species,
    listingType: listing === "ADOPTION" || listing === "SALE" ? listing : "",
    locations: (p.get("location") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    vendor: p.get("vendor") ?? "",
    gender: gender === "MALE" || gender === "FEMALE" ? gender : "",
    minAge: digits(p.get("age_min")),
    maxAge: digits(p.get("age_max")),
    minPrice: digits(p.get("price_min")),
    maxPrice: digits(p.get("price_max")),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortKey) : "newest",
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* Top picks ranking (used on the client until the API has /featured/) */
/* ------------------------------------------------------------------ */

export const FEATURED_WEIGHTS = {
  recency: 0.4, // newer listings score higher (decays over ~3 weeks)
  engagement: 0.3, // views + 3 x saves + 5 x inquiries, log-scaled (0 until the API sends them)
  listing: 0.3, // photos (up to 4) + price present
} as const;

const REASONS: Record<keyof typeof FEATURED_WEIGHTS, string> = {
  recency: "Just listed",
  engagement: "Loved by pet seekers",
  listing: "Beautifully presented",
};

export function engagementRaw(p: PublicPet): number {
  return Math.log1p((p.views ?? 0) + 3 * (p.saves ?? 0) + 5 * (p.inquiries ?? 0));
}

function scoreForFeatured(pets: PublicPet[]): { pet: PublicPet; score: number; reason: string }[] {
  const maxEng = Math.max(1, ...pets.map(engagementRaw));
  return pets.map((pet) => {
    const days = pet.created_at ? (Date.now() - new Date(pet.created_at).getTime()) / 86_400_000 : 30;
    const parts = {
      recency: Math.exp(-days / 21),
      engagement: engagementRaw(pet) / maxEng,
      listing:
        (Math.min(pet.images?.filter((i) => i.image).length ?? 0, 4) / 4) * 0.7 +
        (pet.price != null && pet.price !== "" ? 0.3 : 0),
    };
    const keys = Object.keys(FEATURED_WEIGHTS) as (keyof typeof FEATURED_WEIGHTS)[];
    let score = 0;
    let top = keys[0];
    let topValue = -1;
    for (const k of keys) {
      const contribution = parts[k] * FEATURED_WEIGHTS[k];
      score += contribution;
      if (contribution > topValue) {
        topValue = contribution;
        top = k;
      }
    }
    return { pet, score, reason: REASONS[top] };
  });
}

/** Pick the best N, but never more than 2 per business and 3 per species (keeps the rail varied). */
export function pickDiverse(pets: PublicPet[], count = 8): FeaturedPet[] {
  const ranked = scoreForFeatured(pets).sort((a, b) => b.score - a.score);
  const perBusiness = new Map<string, number>();
  const perSpecies = new Map<string, number>();
  const out: FeaturedPet[] = [];
  for (const { pet, reason } of ranked) {
    const biz = String(pet.business ?? pet.business_name ?? "?");
    const sp = pet.species.toLowerCase();
    const v = perBusiness.get(biz) ?? 0;
    const s = perSpecies.get(sp) ?? 0;
    if (v >= 2 || s >= 3) continue;
    perBusiness.set(biz, v + 1);
    perSpecies.set(sp, s + 1);
    out.push({ ...pet, reason });
    if (out.length === count) break;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Typo-tolerant matching ("Did you mean ...?")                        */
/* ------------------------------------------------------------------ */

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = temp;
    }
  }
  return prev[b.length];
}

export interface Match {
  score: number;
  fuzzy: boolean;
}

/** Lower score = better. null = no match. fuzzy = matched only thanks to typo tolerance. */
export function matchScore(q: string, label: string): Match | null {
  const query = q.trim().toLowerCase();
  const text = label.toLowerCase();
  if (!query) return null;
  if (text.startsWith(query)) return { score: 0, fuzzy: false };
  const words = text.split(/[\s\-&]+/).filter(Boolean);
  if (words.some((w) => w.startsWith(query))) return { score: 1, fuzzy: false };
  if (text.includes(query)) return { score: 2, fuzzy: false };
  if (query.length < 3) return null;

  const limit = query.length <= 4 ? 1 : 2;
  let best = Infinity;
  for (const w of words) {
    best = Math.min(best, levenshtein(query, w), levenshtein(query, w.slice(0, query.length)));
  }
  best = Math.min(best, levenshtein(query, text) - 1);
  return best <= limit ? { score: 3 + Math.max(best, 0), fuzzy: true } : null;
}
