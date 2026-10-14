import "./LegalPages.css";

function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-navbar">
        <a className="legal-brand" href="/">
          Pawdigree
        </a>
        <a className="legal-back-link" href="/vendor">
          Back to marketplace
        </a>
      </header>

      <article className="legal-content">
        <span className="legal-eyebrow">Your privacy matters</span>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">
          Effective date: [Insert date] · Last updated: [Insert date]
        </p>

        <p className="legal-intro">
          This Privacy Policy explains how Pawdigree collects, uses, stores
          and shares personal data when people visit or use our marketplace.
        </p>

        <div className="legal-note">
          <strong>Draft notice:</strong> This policy must be updated to reflect
          Pawdigree's actual technology providers, data flows, retention
          practices, contact details and legal compliance arrangements before
          publication.
        </div>

        <section>
          <h2>1. Who is responsible for your data?</h2>
          <p>
            The data controller is [insert full legal name of operating
            entity], located at [insert address]. Contact our privacy team at
            [insert privacy email].
          </p>
        </section>

        <section>
          <h2>2. Information we may collect</h2>
          <ul>
            <li>Account details, such as your name, username, email and phone number.</li>
            <li>Vendor and business information needed to manage listings and verification.</li>
            <li>Listing details, photographs, reviews and marketplace communications.</li>
            <li>Order, booking, delivery, payment-status and refund information where those features are enabled.</li>
            <li>Technical logs and device information where collected by the Platform.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use personal data</h2>
          <p>
            We may use information to operate accounts, display listings,
            connect customers and vendors, support transactions, provide
            customer service, maintain security, investigate fraud and comply
            with applicable law.
          </p>
        </section>

        <section>
          <h2>4. Legal grounds for processing</h2>
          <p>
            Depending on the circumstances, processing may be based on valid
            consent, steps taken at your request, performance of a contract,
            compliance with legal obligations or another lawful ground
            recognised by applicable law.
          </p>
        </section>

        <section>
          <h2>5. When information is shared</h2>
          <p>
            Relevant information may be shared with customers and vendors to
            facilitate transactions, with service providers that support the
            Platform, or where disclosure is lawfully required for safety,
            security or legal reasons.
          </p>
          <p>
            Pawdigree does not sell personal data as a product. Third-party
            payment providers may independently process payment information
            under their own privacy notices.
          </p>
        </section>

        <section>
          <h2>6. Data security and retention</h2>
          <p>
            We aim to use appropriate technical and organisational safeguards
            to protect personal data. We retain information only as long as
            reasonably necessary for the purposes described in this Policy and
            applicable legal obligations.
          </p>
        </section>

        <section>
          <h2>7. Transfers outside Uganda</h2>
          <p>
            Some service providers may process or store information outside
            Uganda. Pawdigree must assess applicable legal requirements and
            use required safeguards before such transfers take place.
          </p>
        </section>

        <section>
          <h2>8. Your privacy rights</h2>
          <p>
            Subject to applicable law, you may have rights to be informed
            about processing, access personal data, request correction or
            deletion where available, withdraw consent where applicable, and
            raise a complaint about the handling of your information.
          </p>
          <p>
            Contact [insert privacy email] to submit a request.
          </p>
        </section>

        <section>
          <h2>9. Children’s privacy</h2>
          <p>
            Pawdigree will apply age restrictions and appropriate safeguards
            in accordance with applicable law. Contact [insert privacy email]
            if you have a concern about a child's personal data.
          </p>
        </section>

        <section>
          <h2>10. Cookies and third-party services</h2>
          <p>
            If implemented, cookies and similar technologies may support
            sessions, security, preferences and analytics. The final policy
            must identify the technologies actually used and explain any
            applicable choices or consent requirements.
          </p>
        </section>

        <section>
          <h2>11. Policy updates</h2>
          <p>
            We may update this Policy as our services, technology or legal
            obligations change. We will publish updates and provide any
            additional notice or consent required by law.
          </p>
        </section>

        <section>
          <h2>12. Contact and complaints</h2>
          <p>
            For privacy questions or requests, contact [insert legal entity
            name], [insert address], at [insert privacy email] or [insert
            telephone number].
          </p>
        </section>

        <p>
          <a href="/terms">Read the Terms and Conditions</a>
        </p>
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

export default PrivacyPage;