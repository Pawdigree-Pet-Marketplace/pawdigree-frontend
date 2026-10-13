import useScrollReveal from "../../hooks/useScrollReveal";
import "./CtaBanner.css";

type CtaBannerProps = {
  isLoggedIn?: boolean;
};

export default function CtaBanner({ isLoggedIn = false }: CtaBannerProps) {
  const ctaRef = useScrollReveal<HTMLDivElement>();

  return (
    <section ref={ctaRef} className="container section cta-banner">
      <h2 className="reveal">Ready to find your new best friend?</h2>

      <p className="reveal reveal-delay-1">
        Join thousands of buyers and sellers across Uganda
      </p>

      {!isLoggedIn ? (
        <button
          type="button"
          className="btn reveal reveal-delay-2"
          onClick={() => (window.location.href = "/registration")}
        >
          Create Account
        </button>
      ) : (
        <button
          type="button"
          className="btn reveal reveal-delay-2"
          onClick={() => (window.location.href = "/marketplace")}
        >
          Explore Marketplace
        </button>
      )}
    </section>
  );
}
