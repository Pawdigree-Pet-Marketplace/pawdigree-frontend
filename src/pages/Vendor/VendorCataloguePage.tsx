
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  PawPrint,
  Pencil,
  RefreshCw,
  Image as ImageIcon,
  Power,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { Link, useNavigate } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import { formatAge } from "../../utils/petUtils";
import "./VendorCataloguePage.css";

type PetImage = {
  id?: number;
  image?: string;
  url?: string;
  image_url?: string;
  is_primary?: boolean;
};

type Pet = {
  pet_id: number;
  name: string;
  species: string;
  breed?: string;
  description?: string;
  age: number;
  listing_type: "ADOPTION" | "SALE";
  price?: string | number | null;
  adoption_status?: "AVAILABLE" | "PENDING" | "ADOPTED";
  approved: boolean;
  is_active?: boolean;
  business?: string | number;
  images?: (PetImage | string)[];
};

type PetResponse =
  | Pet[]
  | {
      count?: number;
      next?: string | null;
      previous?: string | null;
      results: Pet[];
    };

type ListingAction = "deactivate";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function imageUrl(image: PetImage | string | undefined): string {
  if (!image) return "";

  const path =
    typeof image === "string"
      ? image
      : image.image || image.url || image.image_url || "";

  if (!path) return "";

  try {
    return new URL(path, API_BASE_URL).href;
  } catch {
    return path;
  }
}

function listingStatus(pet: Pet) {
  if (pet.is_active === false) return "Inactive";
  if (!pet.approved) return "Pending approval";

  if (
    pet.listing_type === "ADOPTION" &&
    pet.adoption_status === "ADOPTED"
  ) {
    return "Adopted";
  }

  if (pet.adoption_status === "PENDING") return "Pending";

  return "Active";
}

export default function VendorCataloguePage() {
  const activeBusiness = useVendorBusiness();
  const navigate = useNavigate();
  const activeBusinessId = activeBusiness ? String(activeBusiness.id) : null;
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pendingAction, setPendingAction] =
    useState<ListingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [cardPhotoIndexes, setCardPhotoIndexes] = useState<Record<number, number>>({});
  const cardTouchStartX = useRef<number | null>(null);
  const ignoreNextCardClick = useRef(false);

  const loadPets = useCallback(async () => {
    const token = getToken();

    if (
      !token ||
      (localStorage.getItem("role") || sessionStorage.getItem("role")) !==
        "VENDOR"
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const businessQuery = activeBusinessId
        ? `?business_id=${encodeURIComponent(activeBusinessId)}`
        : "";
      const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/pets/${businessQuery}`);

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : `Couldn't load your catalogue (${response.status}). Please try again.`,
        );
      }

      const data = (await response.json()) as PetResponse;
      const items = Array.isArray(data) ? data : data.results;
      setPets(activeBusinessId
        ? items.filter((pet) => String(pet.business) === activeBusinessId)
        : items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading your listings.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    document.title = "My Catalogue - Pawdigree";
    const timer = window.setTimeout(() => {
      void loadPets();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPets]);

  function openConfirmation(pet: Pet, action: ListingAction) {
    setSelectedPet(pet);
    setPendingAction(action);
    setActionError("");
    setSuccessMessage("");
  }

  function closeConfirmation() {
    if (isSubmitting) return;

    setSelectedPet(null);
    setPendingAction(null);
    setActionError("");
  }

  async function confirmAction() {
    if (!selectedPet || !pendingAction || isSubmitting) return;

    const token = getToken();

    if (!token) {
      setActionError("Your session has expired. Please log in again.");
      return;
    }

    const petId = selectedPet.pet_id;

    setIsSubmitting(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await vendorAuthenticatedFetch(
        `${API_BASE_URL}/api/pets/${petId}/${activeBusiness ? `?business_id=${encodeURIComponent(String(activeBusiness.id))}` : ""}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          response.status === 401
            ? "Your session has expired. Please log in again."
            : details || `Could not deactivate this listing (${response.status}).`,
        );
      }

      // Reflect the change only after the backend confirms deactivation.
      setPets((currentPets) =>
        currentPets.map((pet) =>
          pet.pet_id === petId ? { ...pet, is_active: false } : pet,
        ),
      );
      setSuccessMessage(`${selectedPet.name} was deactivated successfully.`);

      setSelectedPet(null);
      setPendingAction(null);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <VendorLayout
      title="My catalogue"
      description="Manage the pets you've listed on Pawdigree."
      vendorWorkspace
    >
      <div className="dashboard-content vendor-catalogue">
        <div className="catalogue-toolbar">
          <div>
            <h2>Your pet listings</h2>
            <p>
              {loading
                ? "Loading your listings..."
                : `${pets.length} ${pets.length === 1 ? "listing" : "listings"}`}
            </p>
          </div>

          <Link className="catalogue-add-button" to={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "listings/new") : "/vendor/listings/new"}>
            <Plus size={18} />
            Add pet listing
          </Link>
        </div>

        {error && (
          <div className="catalogue-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadPets()}>
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {successMessage && (
          <div className="catalogue-success" role="status">
            {successMessage}
            <button
              type="button"
              aria-label="Dismiss success message"
              onClick={() => setSuccessMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {loading && (
          <div className="catalogue-state">
            <RefreshCw size={22} className="catalogue-spinner" />
            <p>Fetching your pet listings...</p>
          </div>
        )}

        {!loading && !error && pets.length === 0 && (
          <div className="catalogue-empty">
            <span className="catalogue-empty-icon" aria-hidden="true">
              <PawPrint size={30} />
            </span>

            <p className="catalogue-welcome">
              A little space for new beginnings
            </p>

            <h3>Your catalogue is waiting for its first pet!</h3>

            <p>
              Every great pet story starts somewhere. Once your business is
              registered, you can add your first listing and help a pet find its
              next home.
            </p>

            

            <span className="catalogue-footnote">
              Your next listing starts here.
            </span>
          </div>
        )}

        {!loading && !error && pets.length > 0 && (
          <div className="catalogue-grid">
            {pets.map((pet) => {
              const sortedImages = [...(pet.images ?? [])].sort((a, b) => Number(typeof b !== "string" && b.is_primary) - Number(typeof a !== "string" && a.is_primary));
              const cardImages = sortedImages.slice(0, 2);
              const photoIndex = Math.min(cardPhotoIndexes[pet.pet_id] ?? 0, Math.max(0, cardImages.length - 1));
              const status = listingStatus(pet);
              const detailPath = activeBusiness
                ? vendorBusinessPath(String(activeBusiness.id), `listings/${pet.pet_id}`)
                : `/vendor/listings/${pet.pet_id}`;

              return (
                <article
                  className="catalogue-card"
                  key={pet.pet_id}
                  role="link"
                  tabIndex={0}
                  onClick={(event) => {
                    if (ignoreNextCardClick.current) { ignoreNextCardClick.current = false; return; }
                    if ((event.target as HTMLElement).closest("button, a")) return;
                    navigate(detailPath);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(detailPath);
                    }
                  }}
                  aria-label={`View ${pet.name} listing details`}
                >
                  <div className="catalogue-photo"
                    onTouchStart={(event) => { cardTouchStartX.current = event.touches[0]?.clientX ?? null; }}
                    onTouchEnd={(event) => {
                      const startX = cardTouchStartX.current;
                      const endX = event.changedTouches[0]?.clientX;
                      if (startX === null || endX === undefined || Math.abs(endX - startX) < 35 || cardImages.length < 2) return;
                      ignoreNextCardClick.current = true;
                      setCardPhotoIndexes((current) => ({ ...current, [pet.pet_id]: (photoIndex + (endX < startX ? 1 : cardImages.length - 1)) % cardImages.length }));
                      cardTouchStartX.current = null;
                    }}>
                    {cardImages.length ? (
                      <img className="catalogue-card-carousel-image" src={imageUrl(cardImages[photoIndex])} alt={`${pet.name} photo ${photoIndex + 1}`} />
                    ) : (
                      <div className="catalogue-no-photo">
                        <ImageIcon size={30} />
                        <span>No photo available</span>
                      </div>
                    )}

                    <span
                      className={`catalogue-status ${
                        status === "Active"
                          ? "is-active"
                          : status === "Adopted"
                            ? "is-adopted"
                            : status === "Inactive"
                              ? "is-inactive"
                              : "is-pending"
                      }`}
                    >
                      {status}
                    </span>
                    {cardImages.length > 1 && <>
                      <button type="button" className="catalogue-photo-arrow catalogue-photo-prev" aria-label={`Previous ${pet.name} photo`} onClick={(event) => { event.stopPropagation(); setCardPhotoIndexes((current) => ({ ...current, [pet.pet_id]: (photoIndex + cardImages.length - 1) % cardImages.length })); }}><ChevronLeft size={19} /></button>
                      <button type="button" className="catalogue-photo-arrow catalogue-photo-next" aria-label={`Next ${pet.name} photo`} onClick={(event) => { event.stopPropagation(); setCardPhotoIndexes((current) => ({ ...current, [pet.pet_id]: (photoIndex + 1) % cardImages.length })); }}><ChevronRight size={19} /></button>
                      <div className="catalogue-photo-indicators" aria-label={`Photo ${photoIndex + 1} of ${cardImages.length}`}>
                        {cardImages.map((_, index) => <span key={index} className={index === photoIndex ? "active" : ""} />)}
                      </div>
                    </>}
                    {sortedImages.length > 2 && <Link className="catalogue-see-more" to={detailPath} onClick={(event) => event.stopPropagation()}>See More</Link>}
                  </div>

                  <div className="catalogue-card-content">
                    <div className="catalogue-card-heading">
                      <h3>{pet.name}</h3>
                      <span className="catalogue-pet-id">
                        #{pet.pet_id}
                      </span>
                    </div>

                    <p className="catalogue-pet-details">
                      {[pet.breed, pet.species, formatAge(pet.age)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="catalogue-description-preview">{pet.description?.trim() || "No description provided."}</p>

                    <div className="catalogue-card-footer">
                      <span className="catalogue-type">
                        {pet.listing_type === "ADOPTION"
                          ? "For adoption"
                          : "For sale"}
                      </span>

                      {pet.listing_type === "SALE" && pet.price != null && (
                        <strong>
                          UGX {Number(pet.price).toLocaleString("en-UG")}
                        </strong>
                      )}
                    </div>

                    <div className="catalogue-actions">
                      <button
                        type="button"
                        className="catalogue-deactivate-button"
                        disabled={
                          pet.is_active === false || !pet.approved
                        }
                        onClick={() =>
                          openConfirmation(pet, "deactivate")
                        }
                      >
                        <Power size={16} />
                        {pet.is_active === false
                          ? "Inactive"
                          : "Deactivate Listing"}
                      </button>

                      <Link className="catalogue-edit-button" to={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), `edit-pet/${pet.pet_id}`) : "/vendor/edit-pet/" + pet.pet_id}>
                        <Pencil size={16} />
                        Edit listing
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedPet && pendingAction && (
          <div
            className="catalogue-dialog-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeConfirmation();
              }
            }}
          >
            <section
              className="catalogue-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalogue-dialog-title"
              aria-describedby="catalogue-dialog-description"
            >
              <button
                type="button"
                className="catalogue-dialog-close"
                aria-label="Close confirmation dialog"
                disabled={isSubmitting}
                onClick={closeConfirmation}
              >
                <X size={20} />
              </button>

              <div className="catalogue-dialog-icon"><Power size={25} /></div>

              <h2 id="catalogue-dialog-title">Deactivate listing?</h2>

              <p id="catalogue-dialog-description">
                Are you sure you want to deactivate <strong>{selectedPet.name}</strong>?
                Customers will no longer see it as available, and you can keep
                the listing in your catalogue.
              </p>

              {actionError && (
                <div className="catalogue-dialog-error" role="alert">
                  {actionError}
                </div>
              )}

              <div className="catalogue-dialog-actions">
                <button
                  type="button"
                  className="catalogue-cancel-button"
                  disabled={isSubmitting}
                  onClick={closeConfirmation}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="catalogue-confirm-deactivate"
                  disabled={isSubmitting}
                  onClick={() => void confirmAction()}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="catalogue-spinner" />
                      Processing...
                    </>
                  ) : (
                    "Yes, deactivate"
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
