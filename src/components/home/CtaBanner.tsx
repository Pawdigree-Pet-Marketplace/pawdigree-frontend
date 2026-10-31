import useScrollReveal from "../../hooks/useScrollReveal";
import { Link } from "react-router-dom";
import "./CtaBanner.css";

export default function CtaBanner() {
  const ctaRef = useScrollReveal<HTMLDivElement>();

  return (
    <section ref={ctaRef} className="container section cta-banner">
      <h2 className="reveal">Ready to find your new best friend?</h2>

      <p className="reveal reveal-delay-1">
        Join thousands of buyers and sellers across Uganda
      </p>

      <Link to="/registration" className="btn reveal reveal-delay-2">
        Create Account
      </Link>
    </section>
  );
}
