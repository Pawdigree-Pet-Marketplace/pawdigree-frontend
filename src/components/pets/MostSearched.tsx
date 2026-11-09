import { useId } from "react";
import { Flame } from "lucide-react";
import type { TrendingSearch } from "../../data/pets";
import "./MostSearched.css";

interface MostSearchedProps {
  items: TrendingSearch[];
  onSelect: (term: string) => void;
}

export default function MostSearched({ items, onSelect }: MostSearchedProps) {
  const titleId = useId();
  return (
    <section className="most-searched" aria-labelledby={titleId}>
      <div className="most-searched__head">
        <span className="most-searched__icon" aria-hidden="true">
          <Flame size={22} />
        </span>
        <div>
          <h2 id={titleId} className="most-searched__title">
            Most searched this week
          </h2>
          <p className="most-searched__sub">
            What other pet lovers are looking for. Tap to explore.
          </p>
        </div>
      </div>
      <ol className="most-searched__list">
        {items.map((t, i) => (
          <li key={t.term}>
            <button
              type="button"
              className="most-searched__pill"
              onClick={() => onSelect(t.term)}
            >
              <span className="most-searched__rank">{i + 1}</span>
              <span className="most-searched__term">{t.term}</span>
              <span className="most-searched__count">
                {t.count.toLocaleString("en-UG")}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
