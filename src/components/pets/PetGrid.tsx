import { Fragment, type ReactNode } from "react";
import SkeletonCard from "../common/SkeletonCard";
import type { PublicPet } from "../../data/pets";
import PetCard from "./PetCard";
import "./PetGrid.css";

interface PetGridProps {
  pets: PublicPet[];
  loading?: boolean;
  favs: number[];
  onToggleFav: (id: number) => void;
  skeletonCount?: number;
  /** Shown after the card at `breatherAfter` (only when more cards follow it). */
  breather?: ReactNode;
  breatherAfter?: number;
}

export default function PetGrid({
  pets,
  loading = false,
  favs,
  onToggleFav,
  skeletonCount = 6,
  breather,
  breatherAfter = 5,
}: PetGridProps) {
  if (loading) {
    return (
      <div className="pet-grid" role="status" aria-label="Loading pets">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="pet-grid">
      {pets.map((pet, i) => (
        <Fragment key={pet.pet_id}>
          <PetCard pet={pet} index={i} isFav={favs.includes(pet.pet_id)} onToggleFav={onToggleFav} />
          {breather && i === breatherAfter && pets.length > breatherAfter + 1 ? breather : null}
        </Fragment>
      ))}
    </div>
  );
}
