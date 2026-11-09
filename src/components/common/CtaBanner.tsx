import { ArrowUpRight, PawPrint } from "lucide-react";
import { useId } from "react";
import "./CtaBanner.css";

interface CtaBannerProps {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  actionLabel: string;
}

export default function CtaBanner({
  eyebrow,
  title,
  text,
  href,
  actionLabel,
}: CtaBannerProps) {
  const titleId = useId();
  return (
    <section className="cta-banner" aria-labelledby={titleId}>
      <PawPrint
        className="cta-banner__paw cta-banner__paw--1"
        size={54}
        aria-hidden="true"
      />
      <PawPrint
        className="cta-banner__paw cta-banner__paw--2"
        size={32}
        aria-hidden="true"
      />
      <div className="cta-banner__copy">
        <p className="cta-banner__eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p>{text}</p>
      </div>
      <a className="cta-banner__btn" href={href}>
        {actionLabel}
        <ArrowUpRight size={17} aria-hidden="true" />
      </a>
    </section>
  );
}
