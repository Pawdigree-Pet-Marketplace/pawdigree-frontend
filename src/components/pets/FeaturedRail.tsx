import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FeaturedPet } from "../../data/pets";
import { prefersReducedMotion } from "../../utils/petUtils";
import PetCard from "./PetCard";
import "./FeaturedRail.css";

interface FeaturedRailProps {
  items: FeaturedPet[];
  favs: number[];
  onToggleFav: (id: number) => void;
}

/** Horizontal, swipeable rail of "Top picks". */
export default function FeaturedRail({
  items,
  favs,
  onToggleFav,
}: FeaturedRailProps) {
  const railRef = useRef<HTMLUListElement>(null);

  function scrollRail(direction: 1 | -1) {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  return (
    <div className="featured-rail">
      <button
        type="button"
        className="featured-rail__btn featured-rail__btn--prev"
        onClick={() => scrollRail(-1)}
        aria-label="Scroll top picks left"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <ul className="featured-rail__track" ref={railRef} aria-label="Top picks">
        {items.map((pet, i) => (
          <li key={pet.pet_id}>
            <PetCard
              pet={pet}
              reason={pet.reason}
              variant="feature"
              index={i}
              isFav={favs.includes(pet.pet_id)}
              onToggleFav={onToggleFav}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="featured-rail__btn featured-rail__btn--next"
        onClick={() => scrollRail(1)}
        aria-label="Scroll top picks right"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
