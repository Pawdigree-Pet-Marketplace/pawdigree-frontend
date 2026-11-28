import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./VendorDashboardTour.css";

type Step = { selector?: string; title: string; description: string };
type Placement = "top" | "bottom" | "left" | "right";
type CardPosition = { top: number; left: number; placement: Placement };
const TOUR_GAP = 12;
const VIEWPORT_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function placeTourCard(target: DOMRect, cardWidth: number, cardHeight: number, viewportWidth: number, viewportHeight: number): CardPosition {
  const maxLeft = viewportWidth - cardWidth - VIEWPORT_MARGIN;
  const maxTop = viewportHeight - cardHeight - VIEWPORT_MARGIN;
  const centeredLeft = clamp(target.left + (target.width - cardWidth) / 2, VIEWPORT_MARGIN, maxLeft);
  const centeredTop = clamp(target.top + (target.height - cardHeight) / 2, VIEWPORT_MARGIN, maxTop);
  const fits = {
    top: target.top - cardHeight - TOUR_GAP >= VIEWPORT_MARGIN,
    bottom: target.bottom + cardHeight + TOUR_GAP <= viewportHeight - VIEWPORT_MARGIN,
    left: target.left - cardWidth - TOUR_GAP >= VIEWPORT_MARGIN,
    right: target.right + cardWidth + TOUR_GAP <= viewportWidth - VIEWPORT_MARGIN,
  };
  const free = {
    top: target.top - VIEWPORT_MARGIN,
    bottom: viewportHeight - target.bottom - VIEWPORT_MARGIN,
    left: target.left - VIEWPORT_MARGIN,
    right: viewportWidth - target.right - VIEWPORT_MARGIN,
  };
  const isSidebarItem = target.width < cardWidth * 1.3 && target.left < viewportWidth * 0.35;
  const choices: Placement[] = isSidebarItem
    ? ["right", "bottom", "top", "left"]
    : (["top", "bottom", "right", "left"] as Placement[]).sort((a, b) => free[b] - free[a]);
  const placement = choices.find((choice) => fits[choice]) ?? choices[0];

  switch (placement) {
    case "top": return { placement, left: centeredLeft, top: clamp(target.top - cardHeight - TOUR_GAP, VIEWPORT_MARGIN, maxTop) };
    case "bottom": return { placement, left: centeredLeft, top: clamp(target.bottom + TOUR_GAP, VIEWPORT_MARGIN, maxTop) };
    case "left": return { placement, left: clamp(target.left - cardWidth - TOUR_GAP, VIEWPORT_MARGIN, maxLeft), top: centeredTop };
    case "right": return { placement, left: clamp(target.right + TOUR_GAP, VIEWPORT_MARGIN, maxLeft), top: centeredTop };
  }
}

const steps: Step[] = [
  { title: "Welcome to Your Dashboard", description: "Your main dashboard is the central place to monitor activity across all your businesses." },
  { selector: "[data-vendor-tour='businesses']", title: "My Businesses", description: "View and register businesses, open an individual business dashboard, or switch between businesses." },
  { selector: "[data-vendor-tour='overview']", title: "Dashboard Statistics", description: "These cards summarize activity across your businesses, including sales, orders, net revenue, and pending bookings. Some financial figures may be unavailable when the current data cannot support an accurate total." },
  { selector: "[data-vendor-tour='recent-orders']", title: "Recent Orders", description: "Monitor recent merchandise orders and pet sales across your businesses." },
  { selector: "[data-vendor-tour='recent-bookings']", title: "Recent Bookings", description: "Review recent customer bookings across businesses without opening each business dashboard." },
  { selector: "[data-vendor-tour='messages']", title: "Customer Messages", description: "This is the central place intended for conversations associated with your businesses. General conversations are not available yet; adoption messages remain in their existing application workflow." },
  { selector: "[data-vendor-tour='reviews']", title: "Recent Reviews", description: "This overview is intended to bring reviews from your businesses together while keeping each review connected to the business and item it concerns. A vendor-wide review feed is not available yet." },
  { selector: "[data-vendor-tour='notifications']", title: "Notifications", description: "Open account-wide notifications to stay informed about activity across your businesses." },
  { selector: "[data-vendor-tour='profile']", title: "My Profile", description: "Access and manage your personal vendor account information here." },
];

export default function VendorDashboardTour({ vendorId }: { vendorId: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [index, setIndex] = useState(-1);
  const [position, setPosition] = useState<CardPosition>({ top: 100, left: 24, placement: "bottom" });
  const cardRef = useRef<HTMLElement | null>(null);
  const visibleSteps = steps;
  const storageKey = vendorId ? `pawdigree:vendor-dashboard-tour:${vendorId}` : "";

  useEffect(() => {
    if (!storageKey) return;
    const replay = new URLSearchParams(location.search).get("tour") === "replay";
    if (replay) {
      const timer = window.setTimeout(() => {
        setIndex(0);
        navigate(location.pathname, { replace: true });
      }, 0);
      return () => window.clearTimeout(timer);
    }
    if (localStorage.getItem(storageKey) !== "complete") {
      const timer = window.setTimeout(() => setIndex(0), 0);
      return () => window.clearTimeout(timer);
    }
  }, [storageKey, location.pathname, location.search, navigate]);

  const step = visibleSteps[index];
  useEffect(() => {
    if (!step) return;
    const target = step.selector ? document.querySelector<HTMLElement>(step.selector) : null;
    if (!target) return;
    target.scrollIntoView?.({ behavior: "auto", block: "center" });
    target.classList.add("vendor-tour-highlight");
    const update = () => {
      const rect = target.getBoundingClientRect();
      const cardRect = cardRef.current?.getBoundingClientRect();
      const cardHeight = cardRect?.height || 190;
      const cardWidth = Math.min(cardRect?.width || 320, window.innerWidth - VIEWPORT_MARGIN * 2);
      setPosition(placeTourCard(rect, cardWidth, cardHeight, window.innerWidth, window.innerHeight));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { target.classList.remove("vendor-tour-highlight"); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [step]);

  const finish = useCallback(() => {
    if (storageKey) localStorage.setItem(storageKey, "complete");
    setIndex(-1);
  }, [storageKey]);

  useEffect(() => {
    if (!step) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") finish(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step, finish]);
  if (!step) return null;
  return <div className="vendor-tour-layer" aria-live="polite">
    <div className="vendor-tour-scrim" />
    <section ref={cardRef} className={`vendor-tour-card${step.selector ? "" : " vendor-tour-card--welcome"}`} data-placement={step.selector ? position.placement : undefined} style={step.selector ? { top: position.top, left: position.left } : undefined} role="dialog" aria-modal="true" aria-label="Vendor dashboard tour">
      <p className="vendor-tour-count">Step {index + 1} of {visibleSteps.length}</p>
      <h2>{step.title}</h2><p>{step.description}</p>
      <div className="vendor-tour-actions">
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>Back</button>
        <button type="button" onClick={finish}>Skip tour</button>
        <button type="button" className="vendor-tour-next" onClick={() => index >= visibleSteps.length - 1 ? finish() : setIndex((current) => current + 1)}>{index >= visibleSteps.length - 1 ? "Finish" : "Next"}</button>
      </div>
    </section>
  </div>;
}
