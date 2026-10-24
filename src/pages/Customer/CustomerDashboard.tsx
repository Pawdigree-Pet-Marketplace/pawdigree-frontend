import { type FormEvent, useEffect, useMemo, useState } from "react";
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

type Pet = {
  pet_id: number;
  name: string;
  species: string;
  breed?: string;
  age: number;
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

  useEffect(() => {
    if (!isAuthorized) window.location.replace("/customer-login");
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    let cancelled = false;

    async function loadPets() {
      setIsLoadingPets(true);
      setPetsError("");

      try {
        const response = await apiRequest<Pet[] | { results: Pet[] }>(
          "/pets/public/",
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
  }, [isAuthorized]);

  const filteredPets = useMemo(() => {
    const term = submittedSearch.trim().toLowerCase();

    if (!term) return pets.slice(0, 4);

    return pets.filter((pet) =>
      [pet.name, pet.species, pet.breed, pet.listing_type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [pets, submittedSearch]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(searchTerm);
    document.getElementById("dashboard-listings")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
            <a href="/#pets" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Heart size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Find pets</strong>
                <span>Browse pets for adoption and sale.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </a>

            <a href="/#services" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Stethoscope size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Pet services</strong>
                <span>Explore services for happier, healthier pets.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </a>

            <a href="/#reviews" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Sparkles size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Community reviews</strong>
                <span>Read what people are saying about Pawdigree.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </a>

            <a href="/vendor" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <Store size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>For pet businesses</strong>
                <span>Learn about selling on Pawdigree.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </a>

            <a href="/#pets" className="dashboard-marketplace-card">
              <span className="dashboard-marketplace-icon">
                <ShoppingBag size={22} />
              </span>
              <span className="dashboard-marketplace-card-copy">
                <strong>Explore the marketplace</strong>
                <span>Start browsing the available listings.</span>
              </span>
              <ArrowRight size={18} className="dashboard-marketplace-arrow" />
            </a>
          </div>
        </section>

        <Categories
          sectionId="dashboard-categories"
          title="Browse by category"
          className="dashboard-category-carousel"
          items={dashboardCategories}
          getHref={() => "#dashboard-listings"}
        />

        <section
          id="dashboard-listings"
          className="dashboard-section dashboard-listings"
        >
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">A NEW DISCOVERY AWAITS</p>
              <h2>{submittedSearch ? "Search results" : "Pets to discover"}</h2>
              {submittedSearch && (
                <p className="dashboard-section-description">
                  Results for “{submittedSearch}”
                </p>
              )}
            </div>
            <a href="/#pets" className="dashboard-text-link">
              Explore more <ArrowRight size={16} />
            </a>
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
                {submittedSearch
                  ? "No matching pets found"
                  : "Your next discovery is on its way"}
              </h3>
              <p>
                {submittedSearch
                  ? "Try another pet name, breed or species."
                  : "There are no pet listings available right now. Check back soon."}
              </p>
              {submittedSearch && (
                <button
                  type="button"
                  className="dashboard-clear-search"
                  onClick={() => {
                    setSearchTerm("");
                    setSubmittedSearch("");
                  }}
                >
                  Clear search
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
