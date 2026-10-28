import { useEffect, useRef, useState, type ReactNode } from "react";
import "./Reveal.css";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/** Fades a block in the first time it scrolls into view. */
export default function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Without IntersectionObserver (very old browsers) show the content straight away.
  const [shown, setShown] = useState(() => !("IntersectionObserver" in window));

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${shown ? " is-visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
