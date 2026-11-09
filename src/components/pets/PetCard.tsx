import { useState, type CSSProperties } from "react";
import { Heart, MapPin, PawPrint, Sparkles, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { SPECIES, type PublicPet } from "../../data/pets";
import {
  formatAge,
  formatPrice,
  isNewListing,
  primaryImage,
  speciesKey,
} from "../../utils/petUtils";
import { SPECIES_ICON } from "./speciesIcons";
import "./speciesColors.css";
import "./PetCard.css";

const GENDER_LABEL: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  UNKNOWN: "",
};

function PetImage({ pet }: { pet: PublicPet }) {
  const src = primaryImage(pet);
  // remember WHICH url failed, so a new photo is tried again without needing an effect
  const [failedSrc, setFailedSrc] = useState<string | undefined>(undefined);

  if (!src || failedSrc === src)
    return (
      <div
        className="pet-card__placeholder"
        role="img"
        aria-label="No photo yet"
      />
    );
  return (
    <img
      src={src}
      alt={`${pet.name}, ${pet.breed ?? pet.species}`}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}

export interface PetCardProps {
  pet: PublicPet;
  isFav: boolean;
  onToggleFav: (id: number) => void;
  /** Position in a list; drives the staggered entrance. */
  index?: number;
  /** When set, shows the "Top pick" ribbon with this reason. */
  reason?: string;
  variant?: "grid" | "feature";
  showAdoptionAction?: boolean;
}

/** Presentational: everything arrives via props, so it works for any list of pets. */
export default function PetCard({
  pet,
  isFav,
  onToggleFav,
  index = 0,
  reason,
  variant = "grid",
  showAdoptionAction = false,
}: PetCardProps) {
  const key = speciesKey(pet.species);
  const SpeciesIcon = key ? SPECIES_ICON[key] : PawPrint;
  const speciesLabel = SPECIES.find((s) => s.key === key)?.label ?? pet.species;
  const price = formatPrice(pet.price);
  const isAdoption = pet.listing_type === "ADOPTION";
  const fresh = isNewListing(pet);

  return (
    <article
      className={`pet-card pet-card--${variant}`}
      data-species={key ?? "other"}
      style={{ "--n": index } as CSSProperties}
    >
      <div className="pet-card__media">
        <PetImage pet={pet} />
        <span className="pet-card__chip pet-card__chip--species">
          <SpeciesIcon size={13} aria-hidden="true" />
          {speciesLabel}
        </span>
        <button
          type="button"
          className={`pet-card__fav${isFav ? " is-fav" : ""}`}
          aria-pressed={isFav}
          aria-label={
            isFav
              ? `Remove ${pet.name} from favourites`
              : `Save ${pet.name} to favourites`
          }
          onClick={() => onToggleFav(pet.pet_id)}
        >
          <Heart
            size={17}
            fill={isFav ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
        {reason ? (
          <span className="pet-card__ribbon">
            <Sparkles size={13} aria-hidden="true" />
            Top pick · {reason}
          </span>
        ) : (
          fresh && (
            <span className="pet-card__chip pet-card__chip--new">New</span>
          )
        )}
      </div>

      <div className="pet-card__body">
        <div className="pet-card__top">
          <h3 className="pet-card__title">{pet.name}</h3>
          <span
            className={`pet-card__tag ${isAdoption ? "pet-card__tag--adopt" : "pet-card__tag--sale"}`}
          >
            {isAdoption ? "Adoption" : "For sale"}
          </span>
        </div>

        <p className="pet-card__meta">
          {[
            pet.breed ?? speciesLabel,
            GENDER_LABEL[pet.gender] ?? "",
            formatAge(pet.age),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {pet.location && (
          <p className="pet-card__loc">
            <MapPin size={13} aria-hidden="true" />
            {pet.location}
          </p>
        )}

        <p className="pet-card__price">
          <span className="pet-card__price-label">
            {isAdoption ? "Adoption fee" : "Price"}
          </span>
          <strong>{price ?? "Ask vendor"}</strong>
        </p>

        {pet.business_name && (
          <p className="pet-card__vendor">
            <Store size={13} aria-hidden="true" />
            <span className="pet-card__vendor-name">{pet.business_name}</span>
          </p>
        )}

        <Link className="pet-card__btn" to={`/pets/${pet.pet_id}`}>
          View details
        </Link>
        {showAdoptionAction && isAdoption &&
          (pet.adoption_status ?? "AVAILABLE") === "AVAILABLE" && (
            <Link className="pet-card__btn pet-card__btn--adopt" to={`/adoption-request?pet_id=${pet.pet_id}`}>
              Apply to adopt
            </Link>
          )}
      </div>
    </article>
  );
}
