
import { useEffect, useState } from "react";
import {
  Plus,
  PawPrint,
  RefreshCw,
  Image as ImageIcon,
  Power,
  Trash2,
  X,
} from "lucide-react";
import API_BASE_URL from "../../services/api";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
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
  age: number;
  listing_type: "ADOPTION" | "SALE";
  price?: string | number | null;
  adoption_status?: "AVAILABLE" | "PENDING" | "ADOPTED";
  approved: boolean;
  is_active?: boolean;
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

type ListingAction = "deactivate" | "remove";

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
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pendingAction, setPendingAction] =
    useState<ListingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPets() {
    const token = getToken();

    if (
      !token ||
      (localStorage.getItem("role") || sessionStorage.getItem("role")) !==
        "VENDOR"
    ) {
      window.location.href = "/vendor/login";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/pets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(
          `Couldn't load your catalogue (${response.status}). Please try again.`,
        );
      }

      const data = (await response.json()) as PetResponse;
      setPets(Array.isArray(data) ? data : data.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong loading your listings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "My Catalogue - Pawdigree";
    void loadPets();
  }, []);

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
    const action = pendingAction;

    setIsSubmitting(true);
    setActionError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pets/${petId}/`,
        {
          method: action === "deactivate" ? "PATCH" : "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            ...(action === "deactivate"
              ? { "Content-Type": "application/json" }
              : {}),
          },
          ...(action === "deactivate"
            ? { body: JSON.stringify({ is_active: false }) }
            : {}),
        },
      );

      if (!response.ok) {
        const details = await response.text();

        throw new Error(
          details ||
            `Couldn't ${action === "deactivate" ? "deactivate" : "remove"} this listing (${response.status}).`,
        );
      }

      // Update the page only after the backend confirms success.
      if (action === "remove") {
        setPets((currentPets) =>
          currentPets.filter((pet) => pet.pet_id !== petId),
        );
        setSuccessMessage(`${selectedPet.name} was removed successfully.`);
      } else {
        setPets((currentPets) =>
          currentPets.map((pet) =>
            pet.pet_id === petId ? { ...pet, is_active: false } : pet,
          ),
        );
        setSuccessMessage(`${selectedPet.name} was deactivated successfully.`);
      }

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
    >
      <div className="vendor-catalogue">
        <div className="catalogue-toolbar">
          <div>
            <h2>Your pet listings</h2>
            <p>
              {loading
                ? "Loading your listings..."
                : `${pets.length} ${pets.length === 1 ? "listing" : "listings"}`}
            </p>
          </div>

          <a className="catalogue-add-button" href="/vendor/listings/new">
            <Plus size={18} />
            Add pet listing
          </a>
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

            <a className="catalogue-add-button" href="/business-registration">
              <Plus size={18} />
              Register your business
            </a>

            <span className="catalogue-footnote">
              Your next listing starts here.
            </span>
          </div>
        )}

        {!loading && !error && pets.length > 0 && (
          <div className="catalogue-grid">
            {pets.map((pet) => {
              const firstImage =
                pet.images?.find(
                  (image) =>
                    typeof image !== "string" && image.is_primary,
                ) || pet.images?.[0];

              const photo = imageUrl(firstImage);
              const status = listingStatus(pet);

              return (
                <article className="catalogue-card" key={pet.pet_id}>
                  <div className="catalogue-photo">
                    {photo ? (
                      <img src={photo} alt={pet.name} />
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
                  </div>

                  <div className="catalogue-card-content">
                    <div className="catalogue-card-heading">
                      <h3>{pet.name}</h3>
                      <span className="catalogue-pet-id">
                        #{pet.pet_id}
                      </span>
                    </div>

                    <p className="catalogue-pet-details">
                      {[pet.breed, pet.species, `${pet.age} months`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

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

                      <button
                        type="button"
                        className="catalogue-remove-button"
                        onClick={() => openConfirmation(pet, "remove")}
                      >
                        <Trash2 size={16} />
                        Remove Listing
                      </button>
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

              <div className="catalogue-dialog-icon">
                {pendingAction === "deactivate" ? (
                  <Power size={25} />
                ) : (
                  <Trash2 size={25} />
                )}
              </div>

              <h2 id="catalogue-dialog-title">
                {pendingAction === "deactivate"
                  ? "Deactivate listing?"
                  : "Remove listing?"}
              </h2>

              <p id="catalogue-dialog-description">
                {pendingAction === "deactivate" ? (
                  <>
                    Are you sure you want to deactivate{" "}
                    <strong>{selectedPet.name}</strong>? Customers should no
                    longer see this pet as available. You can keep the listing
                    in your catalogue.
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently remove{" "}
                    <strong>{selectedPet.name}</strong>? This action may not
                    be reversible.
                  </>
                )}
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
                  className={
                    pendingAction === "remove"
                      ? "catalogue-confirm-remove"
                      : "catalogue-confirm-deactivate"
                  }
                  disabled={isSubmitting}
                  onClick={() => void confirmAction()}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="catalogue-spinner" />
                      Processing...
                    </>
                  ) : pendingAction === "deactivate" ? (
                    "Yes, deactivate"
                  ) : (
                    "Yes, remove"
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
