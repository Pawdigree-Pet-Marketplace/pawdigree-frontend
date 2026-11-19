
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  MapPin,
  PawPrint,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import BackButton from "../../components/BackButton/BackButton";
import { DEFAULT_QUERY, type PublicPet } from "../../data/pets";
import { useCart } from "../../context/CartContext";
import { fetchPet, fetchPets } from "../../services/petsApi";
import { primaryImage } from "../../utils/petUtils";
import "./PetsDetailPage.css";

type Loaded = {
  id: string;
  pet?: PublicPet;
  similar: PublicPet[];
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  PENDING: "Adoption pending",
  ADOPTED: "Adopted",
};

function photosOf(pet: PublicPet): string[] {
  return [...(pet.images ?? [])]
    .sort(
      (a, b) =>
        Number(b.is_primary ?? false) - Number(a.is_primary ?? false) ||
        (a.position ?? 0) - (b.position ?? 0)
    )
    .map((i) => i.image)
    .filter((src): src is string => Boolean(src));
}

function formatAge(months: number) {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} old`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

const titleCase = (s?: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  const change = (dir: number) =>
    setActive((cur) => (cur + dir + photos.length) % photos.length);

  return (
    <>
      <div className="pd-main-photo">
        {photos.length > 0 ? (
          <img src={photos[active]} alt={alt} />
        ) : (
          <div className="pd-photo-empty" aria-label="No photo available">
            <PawPrint size={64} aria-hidden="true" />
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button
              className="pd-photo-arrow pd-photo-prev"
              onClick={() => change(-1)}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              className="pd-photo-arrow pd-photo-next"
              onClick={() => change(1)}
              aria-label="Next photo"
            >
              <ChevronRight size={22} />
            </button>

            <span className="pd-photo-count">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="pd-thumbnails">
          {photos.map((photo, index) => (
            <button
              key={`${photo}-${index}`}
              className={`pd-thumbnail ${
                active === index ? "active" : ""
              }`}
              onClick={() => setActive(index)}
              aria-label={`View photo ${index + 1}`}
              aria-pressed={active === index}
            >
              <img src={photo} alt="" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function PetDetailsPage() {
  const { petId } = useParams<{ petId: string }>();

  const { addPetToCart } = useCart();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const [cartFeedback, setCartFeedback] = useState<{
    petId: string;
    added: boolean;
    error: string | null;
  }>({
    petId: "",
    added: false,
    error: null,
  });

  const addedToCart = cartFeedback.petId === petId && cartFeedback.added;

  const cartError =
    cartFeedback.petId === petId ? cartFeedback.error : null;

  useEffect(() => {
    if (!petId) return;

    let cancelled = false;

    const petReq = fetchPet(petId);

    const similarReq = fetchPets(DEFAULT_QUERY)
      .then((res) =>
        res.results
          .filter((p) => String(p.pet_id) !== petId)
          .slice(0, 3)
      )
      .catch(() => [] as PublicPet[]);

    Promise.all([petReq, similarReq])
      .then(([pet, similar]) => {
        if (!cancelled) {
          setLoaded({ id: petId, pet, similar });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ id: petId, similar: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [petId]);

  const current = loaded?.id === petId ? loaded : null;
  const pet = current?.pet;

  async function handleAddToCart() {
    if (!pet) return;

    setAddingToCart(true);

    setCartFeedback({
      petId: petId ?? "",
      added: false,
      error: null,
    });

    try {
      await addPetToCart({
        id: pet.pet_id,
        name: pet.name,
        price: pet.price,
        image: primaryImage(pet) ?? undefined,
      });

      setCartFeedback({
        petId: petId ?? "",
        added: true,
        error: null,
      });
    } catch (err) {
      setCartFeedback({
        petId: petId ?? "",
        added: false,
        error:
          err instanceof Error
            ? err.message
            : "Could not add this pet to your cart.",
      });
    } finally {
      setAddingToCart(false);
    }
  }

  if (!current) {
    return (
      <div className="pet-details-page">
        <div className="pd-back">
          <BackButton fallback="/explore-pets" label="Back to pets" />
        </div>

        <main className="pd-main" aria-busy="true">
          <p role="status">Loading pet…</p>
        </main>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="pet-details-page">
        <div className="pd-back">
          <BackButton fallback="/explore-pets" label="Back to pets" />
        </div>

        <main className="pd-main">
          <section role="alert">
            <h1>Pet not found</h1>
            <p>
              This listing may have been removed or is no longer available.
            </p>
            <Link to="/explore-pets">Browse all pets</Link>
          </section>
        </main>
      </div>
    );
  }

  const photos = photosOf(pet);
  const isAdoption = pet.listing_type === "ADOPTION";

  const hasPrice = pet.price != null && pet.price !== "";

  const fee = hasPrice
    ? `${isAdoption ? "Adoption fee: " : ""}UGX ${Number(
        pet.price
      ).toLocaleString("en-UG")}`
    : isAdoption
      ? "Adoption fee: ask the vendor"
      : "Price: ask the vendor";

  const statusLabel =
    STATUS_LABEL[pet.adoption_status ?? "AVAILABLE"] ??
    (isAdoption ? "For adoption" : "For sale");

  const isAvailable =
    (pet.adoption_status ?? "AVAILABLE") === "AVAILABLE";

  return (
    <div className="pet-details-page">
      <div className="pd-back">
        <BackButton fallback="/explore-pets" label="Back to pets" />
      </div>

      <div className="pd-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/explore-pets">Browse Pets</Link>
        <span>/</span>
        <strong>
          {pet.name}
          {pet.breed ? ` — ${pet.breed}` : ""}
        </strong>
      </div>

      <main className="pd-main">
        <div className="pd-detail-card">
          <section
            className="pd-gallery"
            aria-label={`${pet.name} photos`}
          >
            <Gallery
              key={pet.pet_id}
              photos={photos}
              alt={`${pet.name}${pet.breed ? `, ${pet.breed}` : ""}`}
            />
          </section>

          <section
            className="pd-information"
            aria-labelledby="pd-pet-name"
          >
            <h1 id="pd-pet-name">{pet.name}</h1>

            <p className="pd-subtitle">
              {[pet.breed, titleCase(pet.gender)]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <div className="pd-badges">
              <span className="pd-badge pd-badge-status">
                {statusLabel}
              </span>

              {pet.location && (
                <span className="pd-badge pd-badge-location">
                  <MapPin size={13} /> {pet.location}
                </span>
              )}
            </div>

            <h2 className="pd-fee">{fee}</h2>

            {pet.description && (
              <p className="pd-description">{pet.description}</p>
            )}

            {/* Adoption pets keep their application action. */}
            {isAdoption && isAvailable && (
              <Link
                className="pd-button pd-button-primary"
                to={`/adoption-request?pet_id=${pet.pet_id}`}
              >
                Adopt This Pet
              </Link>
            )}

            {/* Only available pets for sale can be added to the cart. */}
            {!isAdoption && isAvailable && (
              <div className="pd-cart-action">
                <button
                  type="button"
                  className="pd-button pd-button-primary"
                  onClick={() => void handleAddToCart()}
                  disabled={addingToCart}
                >
                  <ShoppingCart size={17} aria-hidden="true" />

                  {addingToCart
                    ? "Adding..."
                    : addedToCart
                      ? "Added to cart"
                      : "Add to Cart"}
                </button>

                {cartError && (
                  <p className="pd-cart-error" role="alert">
                    {cartError}
                  </p>
                )}
              </div>
            )}

            <div className="pd-facts" aria-label="Pet details">
              <div>
                <strong>{formatAge(pet.age)}</strong>
                <span>Age</span>
              </div>

              <div>
                <strong>{titleCase(pet.gender)}</strong>
                <span>Gender</span>
              </div>

              {pet.size && (
                <div>
                  <strong>{titleCase(pet.size)}</strong>
                  <span>Size</span>
                </div>
              )}

              <div>
                <strong>{titleCase(pet.species)}</strong>
                <span>Species</span>
              </div>
            </div>

            {pet.business_name && (
              <section
                className="pd-vendor-card"
                aria-label="Vendor information"
              >
                <div className="pd-vendor-copy">
                  <strong>{pet.business_name}</strong>
                  <span>Listed by this vendor</span>
                </div>

                {pet.business != null && (
                  <Link
                    className="pd-button pd-button-outline pd-vendor-button"
                    to={`/vendors/${pet.business}`}
                  >
                    View Profile
                  </Link>
                )}
              </section>
            )}

            <p className="pd-safety-note">
              <ShieldCheck size={14} /> Ask questions and confirm details with
              the vendor before arranging a visit.
            </p>
          </section>
        </div>

        {current.similar.length > 0 && (
          <section className="pd-recommendations">
            <div className="pd-recommendations-heading">
              <p className="pd-section-eyebrow">KEEP EXPLORING</p>
              <h2>More pets you may like</h2>
            </div>

            <div className="pd-suggested-grid">
              {current.similar.map((s) => {
                const img = photosOf(s)[0];

                return (
                  <Link
                    className="pd-suggested-card"
                    to={`/pets/${s.pet_id}`}
                    key={s.pet_id}
                  >
                    <div className="pd-suggested-image">
                      {img ? (
                        <img src={img} alt={s.name} />
                      ) : (
                        <PawPrint size={36} aria-hidden="true" />
                      )}

                      <span>{titleCase(s.species)}</span>
                    </div>

                    <div className="pd-suggested-info">
                      <strong>{s.name}</strong>

                      {s.location && (
                        <small>
                          <MapPin size={12} /> {s.location}
                        </small>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
