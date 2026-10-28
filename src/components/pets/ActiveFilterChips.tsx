import { X } from "lucide-react";
import "./ActiveFilterChips.css";

export interface ActiveChip {
  id: string;
  label: string;
  isSearch?: boolean;
}

interface ActiveFilterChipsProps {
  chips: ActiveChip[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export default function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <ul className="filter-chips" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            type="button"
            className="filter-chips__chip"
            onClick={() => onRemove(chip.id)}
          >
            {chip.label}
            <X size={14} aria-label={`Remove filter ${chip.label}`} />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          className="filter-chips__clear"
          onClick={onClearAll}
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}
