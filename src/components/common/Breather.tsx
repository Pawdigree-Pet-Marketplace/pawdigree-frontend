import { Heart, PawPrint } from "lucide-react";
import type { ReactNode } from "react";
import "./Breather.css";

interface BreatherProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

/** A calm full-width pause between rows of cards. */
export default function Breather({ title, children, icon }: BreatherProps) {
  return (
    <aside className="breather" aria-label={title}>
      <PawPrint className="breather__paw breather__paw--1" size={40} aria-hidden="true" />
      <PawPrint className="breather__paw breather__paw--2" size={26} aria-hidden="true" />
      <span className="breather__icon" aria-hidden="true">
        {icon ?? <Heart size={24} fill="currentColor" />}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}
