import type { ReactNode } from "react";
import "./EmptyState.css";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  /** Short explanation. Anything else (suggestions, buttons) goes in children. */
  text?: string;
  role?: "alert" | "status";
  children?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  text,
  role,
  children,
}: EmptyStateProps) {
  return (
    <div className="empty-state" role={role}>
      <span className="empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
