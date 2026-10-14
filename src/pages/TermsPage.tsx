import "./LegalPages.css";
import lightLogo from "../assets/logos/lightmode-logo.svg";

function LegalHeader() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/vendor";
    }
  };

  return (
    <header className="legal-navbar">
      <a className="legal-brand" href="#" aria-label="Pawdigree home">
        <img src={lightLogo} alt="Pawdigree" className="legal-logo" />
      </a>

      <button
        className="legal-back-link"
        type="button"
        onClick={handleBack}
      >
        <span aria-hidden="true">←</span>
        Back
      </button>
    </header>
  );
}

function TermsPage() {
  return (
    <main className="legal-page">
      <LegalHeader />

      <article className="legal-content">
        <span className="legal-eyebrow">Legal information</span>
        <h1>Terms and Conditions</h1>

        <p className="legal-updated">
          Effective date: [] · Last updated: []
        </p>

        <p className="legal-intro">
          These Terms and Conditions govern your use of Pawdigree, a marketplace
          designed to connect pet owners, customers, vendors and pet-care
          service providers.
        </p>

        <div className="legal-note">
          <strong>Draft notice:</strong> These Terms are being prepared for
          Pawdigree. The legal entity details, contact information, transaction
          rules and other placeholders must be completed and reviewed before
          publication.
        </div>

        <section>
          <h2>1. About Pawdigree</h2>
          <p>
            Pawdigree is operated by [insert full legal name of operating
            entity], located at [insert address]. The Platform may support
            listings for pets, pet products and pet-related services.
          </p>
        </section>

        <section>
          <h2>2. Accounts and eligibility</h2>
          <p>
            Users must provide accurate account information, protect their
            credentials and use the Platform lawfully. Any age restrictions
            and requirements for parental or guardian involvement must be
            followed.
          </p>
        </section>

        <section>
          <h2>3. Customer responsibilities</h2>
          <p>
            Customers should review listing descriptions, prices, availability,
            delivery or collection arrangements, and applicable cancellation
            and refund conditions before committing to a transaction.
          </p>
        </section>

        <section>
          <h2>4. Vendor responsibilities</h2>
          <p>
            Vendors must publish accurate listings, provide the goods or
            services agreed with customers, disclose applicable charges and
            comply with relevant licensing, consumer-protection and other
            legal requirements.
          </p>
        </section>

        <section>
          <h2>5. Pets and animal welfare</h2>
          <p>
            Pet listings and transfers must comply with applicable law and
            Pawdigree's animal-welfare rules. Users must not facilitate animal
            cruelty, unlawful wildlife trade or transactions they are not
            legally entitled to arrange.
          </p>
        </section>

        <section>
          <h2>6. Orders, bookings and payments</h2>
          <p>
            Some transactions may be processed through Pawdigree, while others
            may be arranged directly between customers and vendors. The
            applicable payment, fee, fulfilment and transaction terms must be
            disclosed before a user commits.
          </p>
          <p>
            Pawdigree must not be understood to guarantee or hold funds in
            escrow unless a specific, disclosed arrangement actually provides
            that service.
          </p>
        </section>

        <section>
          <h2>7. Cancellations, returns and refunds</h2>
          <p>
            The applicable cancellation, return and refund terms must be
            communicated before a transaction is completed. Nothing in these
            Terms removes rights that customers have under applicable law.
          </p>
        </section>

        <section>
          <h2>8. Prohibited activities</h2>
          <p>
            Users must not commit fraud, publish unlawful or misleading
            listings, manipulate reviews, misuse personal data, interfere with
            Platform security or use Pawdigree to facilitate illegal activity.
          </p>
        </section>

        <section>
          <h2>9. Moderation and account restrictions</h2>
          <p>
            Pawdigree may investigate reports, remove prohibited content or
            restrict accounts where reasonably necessary for safety, security,
            legal compliance or enforcement of these Terms.
          </p>
        </section>

        <section>
          <h2>10. Privacy</h2>
          <p>
            Personal data is handled according to the Pawdigree Privacy Policy
            and applicable data-protection law.
          </p>
          <p>
            <a href="/privacy">Read the Privacy Policy</a>
          </p>
        </section>

        <section>
          <h2>11. Governing law and disputes</h2>
          <p>
            These Terms are intended to be governed by the laws of Uganda,
            subject to mandatory legal protections and jurisdictional rules
            that apply to a particular user or transaction.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            For questions or complaints, contact [insert official support
            email], or write to [insert legal entity name and address].
          </p>
        </section>
      </article>

      <footer className="legal-footer">
        <p>
          © 2026 Pawdigree · <a href="/terms">Terms</a> ·{" "}
          <a href="/privacy">Privacy Policy</a>
        </p>
      </footer>
    </main>
  );
}

export default TermsPage;