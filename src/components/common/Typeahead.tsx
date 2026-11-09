import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Heart, MapPin, PawPrint, Store, type LucideIcon } from "lucide-react";
import type { Suggestion, SuggestionKind } from "../../data/pets";
import "./Typeahead.css";

const KIND_ORDER: Record<SuggestionKind, number> = {
  breed: 0,
  pet: 1,
  location: 2,
  vendor: 3,
};
const KIND_LABEL: Record<SuggestionKind, string> = {
  breed: "Breeds & types",
  pet: "Pets",
  location: "Locations",
  vendor: "Vendors",
};
const KIND_ICON: Record<SuggestionKind, LucideIcon> = {
  breed: PawPrint,
  pet: Heart,
  location: MapPin,
  vendor: Store,
};

interface TypeaheadProps {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  onPick: (suggestion: Suggestion) => void;
  /** Called (debounced) with what the user typed. Return the suggestions to show. */
  loadSuggestions: (query: string) => Promise<Suggestion[]>;
  /** Enter with no highlighted suggestion. If omitted, Enter submits the surrounding form. */
  onSubmit?: (value: string) => void;
  placeholder?: string;
  /** Text when nothing matches. null = hide the panel instead. */
  emptyText?: string | null;
  variant: "pill" | "field";
  icon?: ReactNode;
}

/** Combobox with grouped, typo-tolerant suggestions. Used for the search bar, location and vendor fields. */
export default function Typeahead({
  label,
  hideLabel,
  value,
  onChange,
  onPick,
  loadSuggestions,
  onSubmit,
  placeholder,
  emptyText,
  variant,
  icon,
}: TypeaheadProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const inputId = `${uid}-input`;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function runSearch(next: string) {
    window.clearTimeout(timer.current);
    const q = next.trim();
    if (!q) {
      seq.current++;
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    timer.current = window.setTimeout(async () => {
      const id = ++seq.current;
      try {
        const res = await loadSuggestions(q);
        if (id !== seq.current) return;
        setItems(
          [...res].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
        );
        setActive(-1);
      } catch {
        if (id === seq.current) setItems([]);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 180);
  }

  function pick(s: Suggestion) {
    seq.current++;
    setOpen(false);
    setItems([]);
    setActive(-1);
    onPick(s);
  }

  const noMatchText =
    emptyText === undefined
      ? `Press Enter to search for “${value.trim()}”`
      : emptyText;
  const showPanel =
    open &&
    value.trim().length > 0 &&
    (items.length > 0 || loading || noMatchText !== null);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      if (!showPanel) {
        if (value.trim()) setOpen(true);
        return;
      }
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      if (!showPanel) return;
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    } else if (e.key === "Enter") {
      if (showPanel && active >= 0 && items[active]) {
        e.preventDefault();
        pick(items[active]);
      } else if (onSubmit) {
        e.preventDefault();
        setOpen(false);
        onSubmit(value);
      }
    } else if (e.key === "Escape" && showPanel) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  return (
    <div className={`ta ta--${variant}`}>
      <label className={hideLabel ? "ta__sr" : "ta__label"} htmlFor={inputId}>
        {label}
      </label>
      <div className="ta__wrap">
        {icon}
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            active >= 0 ? `${uid}-opt-${active}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            runSearch(e.target.value);
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>

      {showPanel && (
        <ul
          className="ta__list"
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
        >
          {items.map((s, i) => {
            const head =
              i === 0 || items[i - 1].kind !== s.kind ? (
                <li
                  className="ta__head"
                  role="presentation"
                  key={`h-${s.kind}`}
                >
                  {KIND_LABEL[s.kind]}
                </li>
              ) : null;
            const Icon = KIND_ICON[s.kind];
            return (
              <Fragment key={`${s.kind}-${s.label}`}>
                {head}
                <li
                  id={`${uid}-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className={`ta__item${i === active ? " is-active" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span className="ta__text">
                    {s.fuzzy && <em className="ta__fuzzy">Did you mean</em>}
                    <strong>{s.label}</strong>
                    {s.fuzzy && <em className="ta__fuzzy">?</em>}
                  </span>
                  {s.hint && <span className="ta__hint">{s.hint}</span>}
                </li>
              </Fragment>
            );
          })}
          {items.length === 0 && (
            <li className="ta__empty" role="presentation">
              {loading ? "Looking for matches…" : noMatchText}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
