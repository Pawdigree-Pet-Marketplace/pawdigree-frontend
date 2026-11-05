/**
 * Explore Pets data layer: the ONLY place that knows where pets come from.
 * Calls the Django API (apiRequest adds the base URL and "/api").
 *
 * Live endpoints (all GET, no login):
 *   /pets/public/?search=&breed=&gender=&listing_type=&age_min=&age_max=
 *                &species=dog,cat&vendor=&location=Kampala,Jinja&price_min=&price_max=
 *                &sort=&page=&page_size=12              -> { count, next, previous, results: PublicPet[] }
 *   /pets/public/{id}/                                    -> PublicPet (used by the detail page)
 *   /pets/public/locations/                               -> string[]  (towns that have pets)
 *
 * Not built on the backend yet, so handled here:
 *   Top picks          -> ranked on the client from the newest 30 pets (pickDiverse in utils/petUtils.ts)
 *   Search suggestions -> species + towns, matched on the client (typo tolerant)
 *   Most searched      -> hidden until /pets/trending-searches/ exists (flip TRENDING_READY)
 */
import { PAGE_SIZE, SPECIES, type FeaturedPet, type PagedPets, type PetQuery, type PublicPet, type Suggestion, type SuggestionKind, type TrendingSearch } from "../data/pets";
import { matchScore, pickDiverse, queryToParams } from "../utils/petUtils";
import API_BASE_URL, { apiRequest } from "./api";

/** Set to true once the backend has GET /api/pets/trending-searches/. */
const TRENDING_READY = false;

type RawPage = PublicPet[] | { count?: number; results: PublicPet[] };

/** If the API returns image paths like "/media/x.jpg", make them absolute. */
function withAbsoluteImages(pet: PublicPet): PublicPet {
  if (!pet.images) return pet;
  return {
    ...pet,
    images: pet.images.map((img) =>
      img.image && img.image.startsWith("/") ? { ...img, image: `${API_BASE_URL}${img.image}` } : img,
    ),
  };
}

function toPaged(res: RawPage, page: number): PagedPets {
  if (Array.isArray(res)) {
    // API not paginated: slice on the client so the page still works.
    const start = (page - 1) * PAGE_SIZE;
    return { count: res.length, results: res.slice(start, start + PAGE_SIZE).map(withAbsoluteImages) };
  }
  return { count: res.count ?? res.results.length, results: res.results.map(withAbsoluteImages) };
}

export async function fetchPets(q: PetQuery): Promise<PagedPets> {
  const res = await apiRequest<RawPage>(`/pets/public/?${queryToParams(q, true).toString()}`);
  return toPaged(res, q.page);
}

/** One pet, for the detail page. */
export async function fetchPet(id: string): Promise<PublicPet> {
  const res = await apiRequest<PublicPet>(`/pets/public/${encodeURIComponent(id)}/`);
  return withAbsoluteImages(res);
}


/**
 * All public pets of one business.
 * The API has no business-id filter, so we search by name (partial match)
 * and keep only the pets that belong to this exact business.
 */
export async function fetchPetsByBusiness(
  businessId: string,
  businessName: string,
): Promise<PublicPet[]> {
  const pageSize = 50; // the API maximum
  const owned = (p: PublicPet) =>
    p.business !== undefined
      ? String(p.business) === businessId
      : p.business_name?.toLowerCase() === businessName.toLowerCase();

  const matches: PublicPet[] = [];
  for (let page = 1; page <= 5; page++) {
    const params = new URLSearchParams({
      vendor: businessName,
      page_size: String(pageSize),
      page: String(page),
    });
    const res = await apiRequest<RawPage>(`/pets/public/?${params.toString()}`);
    const list = Array.isArray(res) ? res : res.results;
    const count = Array.isArray(res) ? res.length : (res.count ?? list.length);

    matches.push(...list.map(withAbsoluteImages).filter(owned));
    if (list.length === 0 || page * pageSize >= count) break;
  }
  return matches;
}



export async function fetchFeatured(): Promise<FeaturedPet[]> {
  const res = await apiRequest<RawPage>("/pets/public/?page_size=30");
  return pickDiverse(toPaged(res, 1).results, 8);
}

export async function fetchTrendingSearches(): Promise<TrendingSearch[]> {
  if (!TRENDING_READY) return [];
  return apiRequest<TrendingSearch[]>("/pets/trending-searches/");
}

let locationsCache: Promise<string[]> | null = null;

/** Towns that currently have pets (fetched once, A to Z). */
function fetchLocations(): Promise<string[]> {
  if (!locationsCache) {
    locationsCache = apiRequest<string[]>("/pets/public/locations/").catch((err) => {
      locationsCache = null; // try again next time
      throw err;
    });
  }
  return locationsCache;
}

/**
 * Suggestions are matched here, on the client:
 *  - "breed" -> the five species
 *  - "location" -> the list from /pets/public/locations/
 * "pet" and "vendor" have no suggestion source yet, so they return nothing.
 */
export async function fetchSuggestions(q: string, kinds: SuggestionKind[]): Promise<Suggestion[]> {
  const single = kinds.length === 1;
  const limit = single ? 6 : 4;
  const out: Suggestion[] = [];

  const take = (kind: SuggestionKind, labels: { label: string; hint?: string }[]) => {
    labels
      .map((c) => ({ c, m: matchScore(q, c.label) }))
      .filter((x): x is { c: { label: string; hint?: string }; m: NonNullable<ReturnType<typeof matchScore>> } => x.m !== null)
      .sort((a, b) => a.m.score - b.m.score)
      .slice(0, limit)
      .forEach(({ c, m }) => out.push({ kind, label: c.label, hint: c.hint, fuzzy: m.fuzzy }));
  };

  if (kinds.includes("breed")) {
    take("breed", SPECIES.map((s) => ({ label: s.plural, hint: "Species" })));
  }
  if (kinds.includes("location")) {
    const towns = await fetchLocations();
    take("location", towns.map((label) => ({ label })));
  }
  return out;
}