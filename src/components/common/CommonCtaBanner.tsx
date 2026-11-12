import { ArrowUpRight, PawPrint } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router-dom";
import "./CommonCtaBanner.css";

interface CommonCtaBannerProps {
  eyebrow: string;
  title: string;
  text: string;
  href: string;
  actionLabel: string;
}

export default function CommonCtaBanner({
  eyebrow,
  title,
  text,
  href,
  actionLabel,
}: CommonCtaBannerProps) {
  const titleId = useId();
  return (
    <section className="common-cta-banner" aria-labelledby={titleId}>
      <PawPrint
        className="common-cta-banner__paw common-cta-banner__paw--1"
        size={54}
        aria-hidden="true"
      />
      <PawPrint
        className="common-cta-banner__paw common-cta-banner__paw--2"
        size={32}
        aria-hidden="true"
      />
      <div className="common-cta-banner__copy">
        <p className="common-cta-banner__eyebrow">{eyebrow}</p>
        <h2 id={titleId}>{title}</h2>
        <p>{text}</p>
      </div>
      <Link className="common-cta-banner__btn" to={href}>
        {actionLabel}
        <ArrowUpRight size={17} aria-hidden="true" />
      </Link>
    </section>
  );
}
