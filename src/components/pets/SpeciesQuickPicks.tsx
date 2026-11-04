import { SPECIES, type SpeciesKey } from "../../data/pets";
import dogsImage from "../../assets/images/dogs.jpg";
import catsImage from "../../assets/images/cats.jpg";
import rabbitImage from "../../assets/images/rabbit.jpg";
import birdsImage from "../../assets/images/birds.jpg";
import fishImage from "../../assets/images/aquatic.jpg";
import "./speciesColors.css";
import "./SpeciesQuickPicks.css";

const SPECIES_IMAGE: Record<SpeciesKey, string> = {
  dog: dogsImage,
  cat: catsImage,
  rabbit: rabbitImage,
  bird: birdsImage,
  fish: fishImage,
};

interface SpeciesQuickPicksProps {
  selected: SpeciesKey[];
  onToggle: (key: SpeciesKey) => void;
}

export default function SpeciesQuickPicks({
  selected,
  onToggle,
}: SpeciesQuickPicksProps) {
  return (
    <div className="species-picks" role="group" aria-label="Browse by species">
      {SPECIES.map((s) => {
        const on = selected.includes(s.key);
        return (
          <button
            type="button"
            key={s.key}
            className={`species-picks__btn${on ? " is-on" : ""}`}
            data-species={s.key}
            aria-pressed={on}
            onClick={() => onToggle(s.key)}
          >
            <span className="species-picks__icon">
              <img src={SPECIES_IMAGE[s.key]} alt="" loading="lazy" />
            </span>
            {s.plural}
          </button>
        );
      })}
    </div>
  );
}
