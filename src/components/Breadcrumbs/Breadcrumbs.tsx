import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import "./Breadcrumbs.css";

export type Crumb = { label: string; to?: string };

type Props = {
  items: Crumb[];
  /** "light" for dark photo backgrounds */
  variant?: "default" | "light";
};

export default function Breadcrumbs({ items, variant = "default" }: Props) {
  return (
    <nav
      className={`breadcrumbs breadcrumbs--${variant}`}
      aria-label="Breadcrumb"
    >
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`}>
              {item.to && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={14} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
