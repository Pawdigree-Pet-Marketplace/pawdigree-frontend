import { useEffect, useState } from "react";
import { Plus, PawPrint, RefreshCw, Image as ImageIcon } from "lucide-react";
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
  if (!pet.approved) return "Pending approval";
  if (pet.listing_type === "ADOPTION" && pet.adoption_status === "ADOPTED") {
    return "Adopted";
  }
  if (pet.adoption_status === "PENDING") return "Pending";
  return "Active";
}

export default function VendorCataloguePage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      const response = await fetch(`${API_BASE_URL}/pets/`, {
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
                  (image) => typeof image !== "string" && image.is_primary,
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
                            : "is-pending"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="catalogue-card-content">
                    <div className="catalogue-card-heading">
                      <h3>{pet.name}</h3>
                      <span className="catalogue-pet-id">#{pet.pet_id}</span>
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
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
