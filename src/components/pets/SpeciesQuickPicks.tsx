import { SPECIES, type SpeciesKey } from "../../data/pets";
import { SPECIES_ICON } from "./speciesIcons";
import "./speciesColors.css";
import "./SpeciesQuickPicks.css";

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
        const Icon = SPECIES_ICON[s.key];
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
              <Icon size={26} strokeWidth={1.7} aria-hidden="true" />
            </span>
            {s.plural}
          </button>
        );
      })}
    </div>
  );
}
