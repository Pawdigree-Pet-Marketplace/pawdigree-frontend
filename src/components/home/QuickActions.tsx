import { useEffect, useRef, type CSSProperties } from "react";
import { HeartHandshake, Store } from "lucide-react";
import { Link } from "react-router-dom";
import "./QuickActions.css";

const actions = [
  { label: "Meet Vendors", detail: "Trusted pet businesses", href: "/vendors", Icon: Store },
  { label: "Adoption", detail: "Give a pet a home", href: "/explore-pets?listing_type=adoption", Icon: HeartHandshake },
];

export default function QuickActions() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") {
      section.classList.add("quick-actions-visible");
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      section.classList.add("quick-actions-visible");
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="quick-actions" ref={sectionRef} aria-label="Homepage quick actions">
      <nav className="quick-actions-grid" aria-label="Quick actions">
        {actions.map(({ label, detail, href, Icon }, index) => (
          <Link className="quick-action-card" to={href} key={label} style={{ "--quick-action-index": index } as CSSProperties}>
            <span className="quick-action-icon"><Icon size={21} strokeWidth={1.9} aria-hidden="true" /></span>
            <span className="quick-action-copy">
              <strong>{label}</strong>
              <small>{detail}</small>
            </span>
            <span className="quick-action-arrow" aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </section>
  );
}
