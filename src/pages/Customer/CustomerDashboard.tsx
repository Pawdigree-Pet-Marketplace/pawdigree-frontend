import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  PawPrint,
  Store,
  Stethoscope,
} from "lucide-react";
import dogsImage from "../../assets/images/dogs.jpg";
import catsImage from "../../assets/images/cats.jpg";
import birdsImage from "../../assets/images/birds.jpg";
import livestockImage from "../../assets/images/livestock.jpg";
import rabbitImage from "../../assets/images/rabbit.jpg";
import { apiRequest } from "../../services/api";
import Categories from "../../components/home/Categories";
import "./CustomerDashboard.css";
import CustomerDashboardNav from "../../components/navigation/CustomerDashboardNav/CustomerDashboardNav";

type PetFilters = { purpose: string; gender: string; breed: string; minAge: string; maxAge: string };
const emptyFilters: PetFilters = { purpose: "", gender: "", breed: "", minAge: "", maxAge: "" };

type Pet = {
  pet_id: number;
  name: string;
  species: string;
  breed?: string;
  age: number;
  gender: "MALE" | "FEMALE";
  listing_type: "ADOPTION" | "SALE";
  price?: string | number | null;
  images?: { image?: string | null; is_primary?: boolean }[];
};

const dashboardCategories = [
  { name: "Dogs", image: dogsImage },
  { name: "Cats", image: catsImage },
  { name: "Birds", image: birdsImage },
  { name: "Livestock", image: livestockImage },
  { name: "Other pets", image: rabbitImage },
];
export default function CustomerDashboard() {
  const [isAuthorized] = useState(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    const role = localStorage.getItem("role") || sessionStorage.getItem("role");
    return Boolean(token && role === "CUSTOMER");
  });
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [gender, setGender] = useState("");
  const [breed, setBreed] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<PetFilters>(emptyFilters);
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    async function loadPets() {
      setIsLoadingPets(true);
      setPetsError("");

      try {
        const params = new URLSearchParams();
        if (submittedSearch.trim()) params.set("search", submittedSearch.trim());
        if (appliedFilters.purpose) params.set("listing_type", appliedFilters.purpose);
        if (appliedFilters.gender) params.set("gender", appliedFilters.gender);
        if (appliedFilters.breed.trim()) params.set("breed", appliedFilters.breed.trim());
        if (appliedFilters.minAge) params.set("age_min", appliedFilters.minAge);
        if (appliedFilters.maxAge) params.set("age_max", appliedFilters.maxAge);
        const query = params.toString();
        const response = await apiRequest<Pet[] | { results: Pet[] }>(
          `/pets/public/${query ? `?${query}` : ""}`,
        );
        const results = Array.isArray(response) ? response : response.results;

        if (!cancelled) setPets(results);
      } catch {
        if (!cancelled) {
          setPetsError(
            "We could not load pet listings. Please try again later.",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingPets(false);
      }
    }

    void loadPets();

    return () => {
      cancelled = true;
    };
  }, [isAuthorized, submittedSearch, appliedFilters]);

  const hasActiveCriteria = Boolean(submittedSearch.trim() || Object.values(appliedFilters).some(Boolean));
  const filteredPets = useMemo(() => {
    return hasActiveCriteria ? pets : pets.slice(0, 4);
  }, [pets, hasActiveCriteria]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(searchTerm);
    document.getElementById("dashboard-listings")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ([minAge, maxAge].some((value) => value !== "" && !/^\d+$/.test(value))) {
      setFilterError("Enter ages as nonnegative whole numbers of months.");
      return;
    }
    if (minAge !== "" && maxAge !== "" && Number(minAge) > Number(maxAge)) {
      setFilterError("Minimum age must be less than or equal to maximum age.");
      return;
    }
    setFilterError("");
    setAppliedFilters({ purpose, gender, breed, minAge, maxAge });
    document.getElementById("dashboard-listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearCriteria() {
    setSearchTerm(""); setSubmittedSearch(""); setPurpose(""); setGender("");
    setBreed(""); setMinAge(""); setMaxAge(""); setAppliedFilters(emptyFilters); setFilterError("");
  }

  if (!isAuthorized) return null;

  const storedName =
    localStorage.getItem("first_name") ||
    sessionStorage.getItem("first_name") ||
    localStorage.getItem("username") ||
    sessionStorage.getItem("username");

  const name = storedName?.trim().split(/\s+/)[0] || "Pet Lover";

  return (
    <div className="customer-dashboard-layout">
      <CustomerDashboardNav />

      <main className="customer-dashboard-main customer-dashboard">
        <section className="dashboard-welcome">
          <div className="dashboard-welcome-decor" aria-hidden="true">
            <PawPrint className="decor decor-paw decor-paw-1" size={26} />
            <PawPrint className="decor decor-paw decor-paw-2" size={22} />
            <PawPrint className="decor decor-paw decor-paw-3" size={24} />
            <Heart
              className="decor decor-heart"
              size={22}
              fill="currentColor"
            />
            <Sparkles
              className="decor decor-sparkle decor-sparkle-1"
              size={22}
            />
            <Sparkles
              className="decor decor-sparkle decor-sparkle-2"
              size={15}
            />
            <Sparkles
              className="decor decor-sparkle decor-sparkle-3"
              size={17}
            />
            <svg
              className="decor decor-bowl"
              width="42"
              height="42"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 24h38c0 9-8 16-19 16S5 33 5 24z" />
              <path d="M14 44h20" />
              <circle cx="17" cy="17" r="2.5" />
              <circle cx="25" cy="13" r="2.5" />
              <circle cx="32" cy="18" r="2.5" />
            </svg>
          </div>
          <div className="dashboard-welcome-content">
            <p className="dashboard-eyebrow">YOUR PAWDIGREE SPACE</p>
            <h1>Welcome back, {name}!</h1>
            <p>
              Pets, trusted services and a community that cares for them. What
              would you like to explore today?
            </p>
            <a href="#dashboard-marketplace" className="dashboard-welcome-link">
              Explore Pawdigree <ArrowRight size={17} />
            </a>
          </div>

          <div className="dashboard-welcome-image-wrap">
            <img
              src={dogsImage}
              alt="A dog ready to meet its next friend"
              className="dashboard-welcome-image"
            />
            <span className="dashboard-welcome-image-note">
              <Heart size={15} fill="currentColor" />
              Made for pet lovers
            </span>
          </div>
        </section>

        <form className="dashboard-filters" onSubmit={handleApplyFilters} aria-label="Filter pet listings">
          <div className="dashboard-filter-grid">
            <label>Purpose<select value={purpose} onChange={(event) => setPurpose(event.target.value)}><option value="">Any purpose</option><option value="ADOPTION">Adoption</option><option value="SALE">For sale</option></select></label>
            <label>Gender<select value={gender} onChange={(event) => setGender(event.target.value)}><option value="">Any gender</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select></label>
            <label>Breed<input value={breed} onChange={(event) => setBreed(event.target.value)} placeholder="Any breed" /></label>
            <label>Minimum age (months)<input type="number" min="0" step="1" inputMode="numeric" value={minAge} onChange={(event) => setMinAge(event.target.value)} /></label>
            <label>Maximum age (months)<input type="number" min="0" step="1" inputMode="numeric" value={maxAge} onChange={(event) => setMaxAge(event.target.value)} /></label>
          </div>
          <div className="dashboard-filter-actions"><button type="submit">Apply filters</button>{hasActiveCriteria && <button type="button" className="dashboard-filter-clear" onClick={clearCriteria}>Clear search and filters</button>}</div>
          {filterError && <p className="dashboard-filter-error" role="alert">{filterError}</p>}
        </form>

        <section
          id="dashboard-marketplace"
          className="dashboard-section dashboard-marketplace"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">MORE THAN PET LISTINGS</p>
              <h2>Explore Pawdigree</h2>
              <p className="dashboard-section-description">
                Everything you need to help pets thrive, all in one place.
              </p>
            </div>
          </div>

          <div className="dashboard-marketplace-grid">
            <Link to="/pets" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Heart size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Find pets</strong>
                <span>Browse pets for adoption and sale.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </Link>

            <div className="dashboard-marketplace-card dashboard-marketplace-card--unavailable">
              <span className="dashboard-marketplace-icon">
                <Stethoscope size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Pet services</strong>
                <span>Explore services for happier, healthier pets.</span>
              </span>
            </div>

            <div className="dashboard-marketplace-card dashboard-marketplace-card--unavailable">
              <span className="dashboard-marketplace-icon">
                <Sparkles size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Community reviews</strong>
                <span>Read what people are saying about Pawdigree.</span>
              </span>
            </div>

            <Link to="/vendor" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Store size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>For pet businesses</strong>
                <span>Learn about selling on Pawdigree.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </Link>

            <Link to="/pets" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <ShoppingBag size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Explore the marketplace</strong>
                <span>Start browsing the available listings.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </Link>
          </div>
        </section>

        <Categories
          sectionId="dashboard-categories"
          title="Browse by category"
          className="dashboard-category-carousel"
          items={dashboardCategories}
          getHref={(category) => `/pets?search=${encodeURIComponent(category.name === "Other pets" ? "rabbit" : category.name.replace(/s$/i, ""))}`}
        />

        <form className="dashboard-search" onSubmit={handleSearch}>
          <label
            className="dashboard-search-label"
            htmlFor="dashboard-pet-search"
          >
            Search pet listings
          </label>
          <div className="dashboard-search-row">
            <Search size={22} aria-hidden="true" />
            <input
              id="dashboard-pet-search"
              type="search"
              placeholder="Search pets by name, breed, species or listing type..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button type="submit" aria-label="Search pets" title="Search pets">
              <ArrowRight size={21} aria-hidden="true" />
            </button>
          </div>
        </form>

        <section
          id="dashboard-listings"
          className="dashboard-section dashboard-listings"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">A NEW DISCOVERY AWAITS</p>
              <h2>{hasActiveCriteria ? "Pet listings" : "Pets to discover"}</h2>
              {hasActiveCriteria && <p className="dashboard-section-description">{submittedSearch.trim() ? `Results for “${submittedSearch.trim()}”` : "Filtered pet listings"}</p>}
            </div>
            <Link to={`/pets?${new URLSearchParams({ ...(submittedSearch.trim() ? { search: submittedSearch.trim() } : {}), ...(appliedFilters.purpose ? { listing_type: appliedFilters.purpose } : {}), ...(appliedFilters.gender ? { gender: appliedFilters.gender } : {}), ...(appliedFilters.breed.trim() ? { breed: appliedFilters.breed.trim() } : {}), ...(appliedFilters.minAge ? { age_min: appliedFilters.minAge } : {}), ...(appliedFilters.maxAge ? { age_max: appliedFilters.maxAge } : {}) }).toString()}`} className="dashboard-text-link">
              Explore more <ArrowRight size={16} />
            </Link>
          </div>

          {isLoadingPets ? (
            <div className="dashboard-empty-state" role="status">
              <div className="dashboard-empty-icon" aria-hidden="true">
                <Heart size={34} />
                <Sparkles size={16} />
              </div>
              <p>Finding pets for you...</p>
            </div>
          ) : petsError ? (
            <div className="dashboard-empty-state" role="alert">
              <h3>We couldn’t load the listings</h3>
              <p>{petsError}</p>
            </div>
          ) : filteredPets.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="dashboard-empty-icon" aria-hidden="true">
                <Search size={32} />
              </div>
              <h3>
                {hasActiveCriteria
                  ? "No pets match these criteria"
                  : "Your next discovery is on its way"}
              </h3>
              <p>
                {hasActiveCriteria
                  ? "Try changing or clearing your search and filters."
                  : "There are no pet listings available right now. Check back soon."}
              </p>
              {hasActiveCriteria && (
                <button
                  type="button"
                  className="dashboard-clear-search"
                  onClick={clearCriteria}
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <div className="dashboard-pet-grid">
              {filteredPets.map((pet) => {
                const primaryImage =
                  pet.images?.find((image) => image.is_primary)?.image ||
                  pet.images?.[0]?.image;

                const ageInYears = Math.floor(pet.age / 12);
                const ageLabel =
                  pet.age < 12
                    ? `${pet.age} month${pet.age === 1 ? "" : "s"} old`
                    : `${ageInYears} year${ageInYears === 1 ? "" : "s"} old`;

                return (
                  <article className="dashboard-pet-card" key={pet.pet_id}>
                    {primaryImage ? (
                      <img src={primaryImage} alt={pet.name} loading="lazy" />
                    ) : (
                      <div
                        className="dashboard-pet-image-placeholder"
                        aria-hidden="true"
                      >
                        <Heart size={30} />
                      </div>
                    )}

                    <div className="dashboard-pet-card-content">
                      <p className="dashboard-pet-type">
                        {pet.listing_type === "ADOPTION"
                          ? "For adoption"
                          : "For sale"}
                      </p>
                      <h3>{pet.name}</h3>
                      <p>{pet.breed || pet.species}</p>
                      <p>{ageLabel}</p>
                      {pet.listing_type === "SALE" && pet.price != null && (
                        <p className="dashboard-pet-price">
                          UGX {Number(pet.price).toLocaleString("en-UG")}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
