/**
 * Mock pet data for previewing the Explore Pets page without a backend.
 *
 * Only petsApi.ts imports this file, and only when VITE_USE_MOCK_PETS is not "false",
 * so it is split into its own chunk and never ships once you go live.
 * You can delete this file when your Django endpoints are ready.
 */
import { PAGE_SIZE, SPECIES, type FeaturedPet, type ListingType, type PagedPets, type PetQuery, type PublicPet, type SortKey, type SpeciesKey, type Suggestion, type SuggestionKind, type TrendingSearch } from "../data/pets";
import { engagementRaw, matchScore, pickDiverse, speciesKey, type Match } from "../utils/petUtils";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

interface MockVendor {
  vendor_id: number;
  business_name: string;
  location: string;
}

const MOCK_VENDORS: MockVendor[] = [
  { vendor_id: 1, business_name: "Sunrise Pet Haven", location: "Kampala" },
  { vendor_id: 2, business_name: "Kampala Paws & Co", location: "Kampala" },
  { vendor_id: 3, business_name: "Entebbe Pet Lodge", location: "Entebbe" },
  { vendor_id: 4, business_name: "Nile Valley Kennels", location: "Jinja" },
  { vendor_id: 5, business_name: "Mukono Critter Corner", location: "Mukono" },
  { vendor_id: 6, business_name: "Wakiso Feather & Fin", location: "Wakiso" },
  { vendor_id: 7, business_name: "Mbarara Pet Palace", location: "Mbarara" },
  { vendor_id: 8, business_name: "Gulu Gentle Paws", location: "Gulu" },
];

/** Suggested even when no vendor operates there yet, so typo help still works. */
const ALL_LOCATIONS = [
  "Kampala", "Entebbe", "Jinja", "Mukono", "Wakiso", "Mbarara",
  "Gulu", "Masaka", "Mbale", "Fort Portal", "Lira", "Arua",
];

const BREEDS: Record<SpeciesKey, string[]> = {
  dog: ["Golden Retriever", "Labrador Retriever", "German Shepherd", "Border Collie", "Pug", "Rottweiler", "Boerboel", "Husky"],
  cat: ["Persian", "Siamese", "Maine Coon", "British Shorthair", "Domestic Shorthair", "Bengal"],
  rabbit: ["Chinchilla Rabbit", "Holland Lop", "Flemish Giant", "Netherland Dwarf", "Rex Rabbit"],
  bird: ["Blue-and-Gold Macaw", "African Grey Parrot", "Cockatiel", "Budgerigar", "Lovebird"],
  fish: ["Goldfish", "Betta", "Koi", "Guppy", "Angelfish"],
};

const PRICE_RANGE: Record<SpeciesKey, [number, number]> = {
  dog: [300_000, 2_500_000],
  cat: [200_000, 1_500_000],
  rabbit: [40_000, 250_000],
  bird: [80_000, 2_000_000],
  fish: [5_000, 150_000],
};

const AGE_SPAN: Record<SpeciesKey, number> = { dog: 70, cat: 60, rabbit: 36, bird: 60, fish: 22 };

const NAMES = [
  "Rex", "Amber", "Miso", "Coco", "Sunny", "Tiger", "Bruno", "Max", "Snowy", "Luna", "Bella", "Charlie",
  "Milo", "Daisy", "Simba", "Nala", "Pepper", "Ziggy", "Mango", "Biscuit", "Olive", "Teddy", "Poppy", "Ollie",
  "Hazel", "Finn", "Ruby", "Zeus", "Cleo", "Bandit", "Pixel", "Maple", "Rocky", "Willow", "Gizmo", "Peaches",
  "Oreo", "Basil", "Nugget", "Clover", "Pip", "Mocha", "Scout", "Juno", "Waffles", "Kiwi", "Bubbles", "Sparky",
];

// Unsplash preview photos. If any link ever breaks, the card falls back to a plain teal box.
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;
const IMAGE_POOL: Record<SpeciesKey, string[]> = {
  dog: [
    "photo-1543466835-00a7907e9de1", "photo-1587300003388-59208cc962cb", "photo-1583511655857-d19b40a7a54e",
    "photo-1517849845537-4d257902454a", "photo-1552053831-71594a27632d",
  ].map(unsplash),
  cat: [
    "photo-1514888286974-6c03e2ca1dba", "photo-1533738363-b7f9aef128ce", "photo-1573865526739-10659fec78a5",
    "photo-1495360010541-f48722b34f7d",
  ].map(unsplash),
  rabbit: ["photo-1585110396000-c9ffd4e4b308", "photo-1535241749838-299277b6305f", "photo-1452857297128-d9c29adba80b"].map(unsplash),
  bird: ["photo-1552728089-57bdde30beb3", "photo-1444464666168-49d633b86797", "photo-1522926193341-e9ffd686c60f"].map(unsplash),
  fish: ["photo-1522069169874-c58ec4b76be5", "photo-1524704654690-b56c05c78a00", "photo-1520990269108-4f2db5a1e1b3"].map(unsplash),
};

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildMockPets(): PublicPet[] {
  const rand = mulberry32(2026);
  const pattern: SpeciesKey[] = ["dog", "cat", "dog", "rabbit", "bird", "cat", "dog", "fish", "rabbit", "cat", "bird", "fish"];
  const counters: Record<SpeciesKey, number> = { dog: 0, cat: 0, rabbit: 0, bird: 0, fish: 0 };
  const now = Date.now();

  return Array.from({ length: 48 }, (_, i) => {
    const species = pattern[i % pattern.length];
    const breeds = BREEDS[species];
    const breed = breeds[counters[species]++ % breeds.length];
    const vendor = MOCK_VENDORS[Math.floor(rand() * MOCK_VENDORS.length)];
    const listingType: ListingType = rand() < 0.55 ? "ADOPTION" : "SALE";
    const [lo, hi] = PRICE_RANGE[species];
    const salePrice = Math.round((lo + rand() * (hi - lo)) / 5000) * 5000;
    const price =
      listingType === "SALE"
        ? salePrice
        : rand() < 0.8
          ? Math.max(5000, Math.round((salePrice * 0.2) / 5000) * 5000)
          : null;

    const pool = IMAGE_POOL[species];
    const start = Math.floor(rand() * pool.length);
    const imageCount = 1 + Math.floor(rand() * 3);
    const hasImages = rand() > 0.1;
    const daysOld = i < 6 ? rand() * 5 : rand() * 60;

    return {
      pet_id: 1000 + i,
      name: NAMES[i % NAMES.length],
      species: species[0].toUpperCase() + species.slice(1),
      breed,
      age: 2 + Math.floor(rand() * AGE_SPAN[species]),
      gender: rand() < 0.5 ? "MALE" : "FEMALE",
      listing_type: listingType,
      price,
      images: hasImages
        ? Array.from({ length: imageCount }, (_, k) => ({
            image: pool[(start + k) % pool.length],
            is_primary: k === 0,
          }))
        : [],
      location: vendor.location,
      business: vendor.vendor_id,
      business_name: vendor.business_name,
      created_at: new Date(now - daysOld * 86_400_000).toISOString(),
      views: Math.floor(rand() * 900),
      saves: Math.floor(rand() * 80),
      inquiries: Math.floor(rand() * 30),
    } satisfies PublicPet;
  });
}

const MOCK_PETS = buildMockPets();

const MOCK_TRENDING: TrendingSearch[] = [
  { term: "Golden Retriever", count: 412 },
  { term: "Persian Cat", count: 358 },
  { term: "Chinchilla Rabbit", count: 301 },
  { term: "African Grey", count: 244 },
  { term: "Labrador", count: 219 },
  { term: "Betta Fish", count: 176 },
  { term: "Holland Lop", count: 148 },
  { term: "Husky", count: 131 },
];

function tokenMatches(haystack: string, token: string): boolean {
  return haystack.includes(token) || haystack.includes(token.replace(/s$/, ""));
}

function applyMockQuery(pets: PublicPet[], q: PetQuery): PublicPet[] {
  const tokens = q.search.toLowerCase().split(/\s+/).filter(Boolean);
  const locations = q.locations.map((l) => l.toLowerCase());
  const vendorQ = q.vendor.trim().toLowerCase();
  const num = (v: string) => (v === "" ? null : Number(v));
  const [minAge, maxAge, minPrice, maxPrice] = [num(q.minAge), num(q.maxAge), num(q.minPrice), num(q.maxPrice)];

  const filtered = pets.filter((pet) => {
    const key = speciesKey(pet.species);
    if (tokens.length) {
      const hay = [pet.name, pet.breed, pet.species, pet.business_name, pet.location,
        pet.listing_type === "ADOPTION" ? "adoption adopt" : "sale buy"]
        .filter(Boolean).join(" ").toLowerCase();
      if (!tokens.every((t) => tokenMatches(hay, t))) return false;
    }
    if (q.species.length && (!key || !q.species.includes(key))) return false;
    if (q.listingType && pet.listing_type !== q.listingType) return false;
    if (locations.length && !locations.some((l) => (pet.location ?? "").toLowerCase().includes(l))) return false;
    if (vendorQ && !(pet.business_name ?? "").toLowerCase().includes(vendorQ)) return false;
    if (q.gender && pet.gender !== q.gender) return false;
    if (minAge !== null && pet.age < minAge) return false;
    if (maxAge !== null && pet.age > maxAge) return false;
    const price = pet.price == null ? null : Number(pet.price);
    if ((minPrice !== null || maxPrice !== null) && price === null) return false;
    if (price !== null && minPrice !== null && price < minPrice) return false;
    if (price !== null && maxPrice !== null && price > maxPrice) return false;
    return true;
  });

  const time = (p: PublicPet) => (p.created_at ? new Date(p.created_at).getTime() : 0);
  const price = (p: PublicPet, fallback: number) => (p.price == null ? fallback : Number(p.price));
  const sorters: Record<SortKey, (a: PublicPet, b: PublicPet) => number> = {
    newest: (a, b) => time(b) - time(a),
    popular: (a, b) => engagementRaw(b) - engagementRaw(a),
    price_asc: (a, b) => price(a, Infinity) - price(b, Infinity),
    price_desc: (a, b) => price(b, -1) - price(a, -1),
    age_asc: (a, b) => a.age - b.age,
    age_desc: (a, b) => b.age - a.age,
  };
  return filtered.sort(sorters[q.sort]);
}

interface Candidate {
  label: string;
  hint?: string;
}

export async function mockFetchSuggestions(q: string, kinds: SuggestionKind[]): Promise<Suggestion[]> {
  await delay(120);
  const single = kinds.length === 1;
  const out: Suggestion[] = [];

  const take = (kind: SuggestionKind, candidates: Candidate[], limit: number) => {
    candidates
      .map((c) => ({ c, m: matchScore(q, c.label) }))
      .filter((x): x is { c: Candidate; m: Match } => x.m !== null)
      .sort((a, b) => a.m.score - b.m.score)
      .slice(0, single ? limit + 3 : limit)
      .forEach(({ c, m }) => out.push({ kind, label: c.label, hint: c.hint, fuzzy: m.fuzzy }));
  };

  if (kinds.includes("breed")) {
    const breeds: Candidate[] = SPECIES.map((s) => ({ label: s.plural, hint: "Species" }));
    (Object.keys(BREEDS) as SpeciesKey[]).forEach((sp) => {
      BREEDS[sp].forEach((b) => {
        const n = MOCK_PETS.filter((p) => p.breed === b).length;
        breeds.push({ label: b, hint: `${SPECIES.find((s) => s.key === sp)?.label} · ${n} listing${n === 1 ? "" : "s"}` });
      });
    });
    take("breed", breeds, 4);
  }
  if (kinds.includes("pet")) {
    take("pet", MOCK_PETS.map((p) => ({ label: p.name, hint: `${p.breed} · ${p.location}` })), 3);
  }
  if (kinds.includes("location")) {
    take(
      "location",
      ALL_LOCATIONS.map((l) => {
        const n = MOCK_PETS.filter((p) => p.location === l).length;
        return { label: l, hint: n ? `${n} listing${n === 1 ? "" : "s"}` : "No listings yet" };
      }),
      3,
    );
  }
  if (kinds.includes("vendor")) {
    take("vendor", MOCK_VENDORS.map((v) => ({ label: v.business_name, hint: v.location })), 3);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Mock endpoints (same signatures as the real ones in petsApi.ts)     */
/* ------------------------------------------------------------------ */

export async function mockFetchPets(q: PetQuery): Promise<PagedPets> {
  await delay(350);
  const all = applyMockQuery([...MOCK_PETS], q);
  const start = (q.page - 1) * PAGE_SIZE;
  return { count: all.length, results: all.slice(start, start + PAGE_SIZE) };
}

export async function mockFetchFeatured(): Promise<FeaturedPet[]> {
  await delay(250);
  return pickDiverse(MOCK_PETS, 8);
}

export async function mockFetchTrending(): Promise<TrendingSearch[]> {
  await delay(200);
  return MOCK_TRENDING;
}
