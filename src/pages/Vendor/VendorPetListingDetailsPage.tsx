import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";
import { formatAge } from "../../utils/petUtils";
import BackButton from "../../components/BackButton/BackButton";
import "./VendorPetListingDetailsPage.css";

type PetImage = { image_id?: number; image?: string | null; is_primary?: boolean; position?: number };
type VendorPet = {
  pet_id: number; name: string; species: string; breed?: string; age: number;
  gender: string; size?: string; description?: string; listing_type: "ADOPTION" | "SALE";
  price?: string | number | null; adoption_status?: string; approved: boolean;
  review_status?: string; rejection_reason?: string; is_active?: boolean;
  business?: number | string; images?: PetImage[];
};
type PetResponse = VendorPet[] | { results: VendorPet[] };

function imageUrl(path?: string | null) {
  if (!path) return "";
  try { return new URL(path, API_BASE_URL).href; } catch { return path; }
}

function errorMessage(response: Response) {
  if (response.status === 401) return "Your session has expired. Please log in again.";
  return `Could not load this listing (${response.status}). Please try again.`;
}

export default function VendorPetListingDetailsPage() {
  const { petId = "" } = useParams<{ petId: string }>();
  const activeBusiness = useVendorBusiness();
  const businessId = activeBusiness ? String(activeBusiness.id) : null;
  const [pet, setPet] = useState<VendorPet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPet() {
      setLoading(true);
      setError("");
      try {
        const query = businessId ? `?business_id=${encodeURIComponent(businessId)}` : "";
        const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/pets/${query}`);
        if (!response.ok) throw new Error(errorMessage(response));
        const result = await response.json() as PetResponse;
        const listings = Array.isArray(result) ? result : result.results;
        const listing = listings.find((item) => String(item.pet_id) === petId && (!businessId || String(item.business) === businessId));
        if (!listing) throw new Error("This listing could not be found.");
        if (!cancelled) { setPet(listing); setPhotoIndex(0); }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load this listing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPet();
    return () => { cancelled = true; };
  }, [petId, businessId]);

  const images = [...(pet?.images ?? [])]
    .sort((a, b) => Number(b.is_primary ?? false) - Number(a.is_primary ?? false) || (a.position ?? 0) - (b.position ?? 0))
    .map((image) => imageUrl(image.image))
    .filter(Boolean);
  const changePhoto = (direction: number) => setPhotoIndex((current) => (current + direction + images.length) % images.length);
  const editPath = activeBusiness
    ? vendorBusinessPath(String(activeBusiness.id), `edit-pet/${petId}`)
    : `/vendor/edit-pet/${petId}`;
  const status = pet?.is_active === false ? "Inactive" : pet?.review_status || (pet?.approved ? "Approved" : "Pending approval");

  return (
    <VendorLayout title={pet?.name || "Pet listing details"} description="Review the complete information for this pet listing." vendorWorkspace>
      <main className="dashboard-content vendor-pet-detail-page">
        <BackButton fallback={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "listings") : "/vendor/listings"} label="Back to listings" />
        {loading && <p role="status">Loading listing details…</p>}
        {error && <p className="vendor-pet-detail-error" role="alert">{error}</p>}
        {pet && !loading && <>
          <section className="vendor-pet-detail-grid">
            <div className="vendor-pet-detail-gallery" aria-label={`${pet.name} photo gallery`}>
              {images.length ? <>
                <div className="vendor-pet-detail-main-image"
                  onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
                  onTouchEnd={(event) => { const end = event.changedTouches[0]?.clientX; if (touchStartX.current !== null && end !== undefined && Math.abs(end - touchStartX.current) > 45) changePhoto(end < touchStartX.current ? 1 : -1); touchStartX.current = null; }}>
                  <img src={images[photoIndex]} alt={`${pet.name} photo ${photoIndex + 1} of ${images.length}`} />
                  {images.length > 1 && <>
                    <button type="button" className="vendor-pet-detail-arrow previous" onClick={() => changePhoto(-1)} aria-label="Previous photo"><ChevronLeft /></button>
                    <button type="button" className="vendor-pet-detail-arrow next" onClick={() => changePhoto(1)} aria-label="Next photo"><ChevronRight /></button>
                    <span className="vendor-pet-detail-count">{photoIndex + 1} / {images.length}</span>
                  </>}
                </div>
                {images.length > 1 && <div className="vendor-pet-detail-indicators" aria-label="Choose a photo">{images.map((image, index) => <button key={`${image}-${index}`} type="button" className={index === photoIndex ? "active" : ""} onClick={() => setPhotoIndex(index)} aria-label={`View photo ${index + 1}`} aria-pressed={index === photoIndex} />)}</div>}
              </> : <div className="vendor-pet-detail-no-image"><ImageIcon size={42} /><span>No photos uploaded</span></div>}
            </div>

            <div className="vendor-pet-detail-info">
              <div className="vendor-pet-detail-title"><div><span className="vendor-pet-detail-eyebrow">Listing #{pet.pet_id}</span><h2>{pet.name}</h2></div><span className="vendor-pet-detail-status">{status}</span></div>
              <dl className="vendor-pet-detail-facts">
                <div><dt>Species</dt><dd>{pet.species}</dd></div>
                <div><dt>Breed</dt><dd>{pet.breed || "Not provided"}</dd></div>
                <div><dt>Age</dt><dd>{formatAge(pet.age)}</dd></div>
                <div><dt>Gender</dt><dd>{pet.gender ? pet.gender.toLowerCase() : "Not provided"}</dd></div>
                <div><dt>Size</dt><dd>{pet.size ? pet.size.toLowerCase() : "Not provided"}</dd></div>
                <div><dt>Listing type</dt><dd>{pet.listing_type === "SALE" ? "For sale" : "For adoption"}</dd></div>
                {pet.listing_type === "SALE" && <div><dt>Price</dt><dd>UGX {Number(pet.price ?? 0).toLocaleString("en-UG")}</dd></div>}
                {pet.adoption_status && <div><dt>Adoption status</dt><dd>{pet.adoption_status.toLowerCase()}</dd></div>}
                {pet.business != null && <div><dt>Business</dt><dd>{activeBusiness?.name || `Business #${pet.business}`}</dd></div>}
              </dl>
              <section className="vendor-pet-detail-description"><h3>Description</h3><p>{pet.description?.trim() || "No description provided."}</p></section>
              {pet.rejection_reason && <p className="vendor-pet-detail-rejection"><strong>Review feedback:</strong> {pet.rejection_reason}</p>}
              <Link className="vendor-pet-detail-edit" to={editPath}><Pencil size={17} />Edit Listing</Link>
            </div>
          </section>
        </>}
      </main>
    </VendorLayout>
  );
}
