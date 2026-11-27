import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Heart,
  MapPin,
  PawPrint,
  Scissors,
  ShoppingBag,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { Suggestion, SuggestionKind, SuggestionResponse } from "../../data/pets";
import "./Typeahead.css";

const KIND_ORDER: Record<SuggestionKind, number> = {
  business: 0,
  vendor: 0,
  pet: 1,
  product: 2,
  service: 3,
  breed: 4,
  location: 5,
};
const KIND_LABEL: Record<SuggestionKind, string> = {
  business: "Businesses",
  vendor: "Vendors",
  pet: "Pets",
  product: "Products",
  service: "Services",
  breed: "Breeds & types",
  location: "Locations",
};
const KIND_ICON: Record<SuggestionKind, LucideIcon> = {
  business: Store,
  vendor: Store,
  pet: Heart,
  product: ShoppingBag,
  service: Scissors,
  breed: PawPrint,
  location: MapPin,
};

interface TypeaheadProps {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  onPick: (suggestion: Suggestion) => void;
  /** Called (debounced) with what the user typed. Return the suggestions to show. */
  loadSuggestions: (
    query: string,
    signal?: AbortSignal,
  ) => Promise<Suggestion[] | SuggestionResponse>;
  /** Enter with no highlighted suggestion. If omitted, Enter submits the surrounding form. */
  onSubmit?: (value: string) => void;
  placeholder?: string;
  /** Text when nothing matches. null = hide the panel instead. */
  emptyText?: string | null;
  /** Clarifies the surrounding form's submit behavior when results are shown. */
  submitHint?: string;
  /** Minimum input length required before the suggestion loader is called. */
  minQueryLength?: number;
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
  submitHint,
  minQueryLength = 1,
  variant,
  icon,
}: TypeaheadProps) {
  const uid = useId();
  const listId = `${uid}-list`;
  const inputId = `${uid}-input`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const seq = useRef(0);

  useEffect(() => () => {
    window.clearTimeout(timer.current);
    window.clearTimeout(closeTimer.current);
    request.current?.abort();
  }, []);

  const closePanel = useCallback(() => {
    if (!open && !closing) return;
    window.clearTimeout(timer.current);
    request.current?.abort();
    request.current = null;
    seq.current++;
    setOpen(false);
    setLoading(false);
    setClosing(true);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setClosing(false), 140);
  }, [open, closing]);

  useEffect(() => {
    const closeWhenOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        closePanel();
      }
    };
    document.addEventListener("pointerdown", closeWhenOutside);
    return () => document.removeEventListener("pointerdown", closeWhenOutside);
  }, [closePanel]);

  function runSearch(next: string) {
    window.clearTimeout(timer.current);
    request.current?.abort();
    request.current = null;
    const id = ++seq.current;
    const q = next.trim();
    if (q.length < minQueryLength) {
      setItems([]);
      setOpen(false);
      setClosing(false);
      setLoading(false);
      setError("");
      return;
    }
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setItems([]);
    setActive(-1);
    setOpen(true);
    setLoading(true);
    setError("");
    timer.current = window.setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const res = await loadSuggestions(q, controller.signal);
        if (id !== seq.current) return;
        const list = Array.isArray(res) ? res : res.suggestions;
        setError(Array.isArray(res) ? "" : res.warning || "");
        setItems(
          [...list].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
        );
        setActive(-1);
      } catch (cause) {
        if (id === seq.current && !controller.signal.aborted) {
          setItems([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Suggestions couldn’t load. Please try again.",
          );
        }
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 180);
  }

  function pick(s: Suggestion) {
    seq.current++;
    request.current?.abort();
    request.current = null;
    setOpen(false);
    setClosing(false);
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
    value.trim().length >= minQueryLength &&
    (items.length > 0 || loading || error !== "" || noMatchText !== null);
  const renderPanel =
    showPanel || (closing && value.trim().length >= minQueryLength);

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
    } else if (e.key === "Escape" && (showPanel || closing)) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    }
  }

  return (
    <div className={`ta ta--${variant}`} ref={rootRef}>
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
          aria-busy={loading}
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
            if (value.trim()) {
              setClosing(false);
              setOpen(true);
            }
          }}
          onBlur={closePanel}
          onKeyDown={onKeyDown}
        />
      </div>

      {renderPanel && (
        <ul
          className={`ta__list${closing && !showPanel ? " is-closing" : ""}`}
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
                  aria-label={`${KIND_LABEL[s.kind]}: ${s.label}${s.hint ? `, ${s.hint}` : ""}`}
                  aria-selected={i === active}
                  className={`ta__item${i === active ? " is-active" : ""}`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <Icon className="ta__type-icon" size={16} aria-hidden="true" />
                  <span className="ta__text">
                    {s.fuzzy && <em className="ta__fuzzy">Did you mean</em>}
                    <strong>{highlightMatch(s.label, value)}</strong>
                    {s.fuzzy && <em className="ta__fuzzy">?</em>}
                  </span>
                  {s.hint && <span className="ta__hint">{s.hint}</span>}
                  {s.image && (
                    <img
                      className="ta__thumb"
                      src={s.image}
                      alt=""
                      loading="lazy"
                    />
                  )}
                </li>
              </Fragment>
            );
          })}
          {items.length === 0 && (
            <li className="ta__empty" role="presentation" aria-live="polite">
              {loading ? (
                <>
                  <span className="ta__spinner" aria-hidden="true" />
                  Searching marketplace…
                </>
              ) : (
                error || noMatchText
              )}
            </li>
          )}
          {error && items.length > 0 && (
            <li className="ta__notice" role="presentation">
              {error}
            </li>
          )}
          {items.length > 0 && submitHint && (
            <li className="ta__submit-hint" role="presentation">
              {submitHint}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function highlightMatch(label: string, query: string) {
  const term = query.trim();
  const start = term ? label.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) : -1;
  if (start < 0) return label;
  const end = start + term.length;
  return (
    <>
      {label.slice(0, start)}
      <mark className="ta__match">{label.slice(start, end)}</mark>
      {label.slice(end)}
    </>
  );
}
