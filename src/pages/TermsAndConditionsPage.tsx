import "./TermsAndConditionsPage.css";
import { Link } from "react-router-dom";

function TermsAndConditionsPage() {
  return (
    <main className="terms-page">
      <article className="terms-card">
        <Link to="/vendor-registration" className="terms-back-link">
          ← Back to vendor registration
        </Link>

        <h1>Pawdigree Terms and Conditions</h1>
        <p className="terms-updated">Vendor Agreement · Draft for review</p>

        <p>
          Welcome to Pawdigree, a digital marketplace connecting pet owners
          with vendors, veterinary services, pet-care providers, and pet
          merchandise businesses in Uganda. By registering as a vendor, you
          agree to these Terms and Conditions.
        </p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By creating a vendor account, you confirm that you have read and
            agree to these Terms and Conditions. If you do not agree, you
            should not register as a vendor.
          </p>
        </section>

        <section>
          <h2>2. Vendor Registration and Verification</h2>
          <p>
            You must provide accurate and complete information when registering.
            This includes your name, contact details, and any business
            information requested by Pawdigree. You are responsible for keeping
            your information up to date and protecting your account credentials.
          </p>
          <p>
            Pawdigree may request additional information to verify your
            identity or business. Registration does not guarantee approval.
          </p>
        </section>

        <section>
          <h2>3. Listings, Products, and Services</h2>
          <p>
            All listings must be truthful, accurate, and not misleading.
            Vendors must provide correct descriptions, prices, photographs,
            availability, and contact details. You must update or remove
            listings that are no longer available or accurate.
          </p>
        </section>

        <section>
          <h2>4. Animal Welfare and Responsible Practices</h2>
          <p>
            Vendors listing animals must comply with applicable laws and
            animal-welfare requirements in Uganda. Animals must be handled
            responsibly and kept in appropriate conditions.
          </p>
          <p>
            Vendors must not use Pawdigree to promote animal cruelty, unlawful
            wildlife trade, or other illegal activities. Information about an
            animal's age, health, vaccination status, and other relevant
            details must be truthful.
          </p>
        </section>

        <section>
          <h2>5. Customer Communication and Transactions</h2>
          <p>
            Vendors must communicate respectfully with customers, respond
            honestly to enquiries, and honour commitments made about their
            products or services. Prices, availability, cancellations, and
            applicable refund arrangements should be clearly communicated.
          </p>
        </section>

        <section>
          <h2>6. Fees and Payments</h2>
          <p>
            Any applicable vendor fees, commissions, or payment charges must
            be communicated before they apply. Vendors must follow Pawdigree's
            published payment procedures and applicable requirements.
          </p>
        </section>

        <section>
          <h2>7. Prohibited Conduct</h2>
          <p>Vendors must not:</p>
          <ul>
            <li>Provide false registration or verification information.</li>
            <li>Publish fraudulent or misleading listings.</li>
            <li>Offer unlawfully obtained animals or prohibited products.</li>
            <li>Misrepresent professional qualifications or services.</li>
            <li>Harass, threaten, or defraud customers or other vendors.</li>
            <li>Attempt unauthorised access to accounts or platform systems.</li>
          </ul>
        </section>

        <section>
          <h2>8. Privacy and Personal Information</h2>
          <p>
            Vendors must handle customer information responsibly and use it
            only for legitimate purposes connected to enquiries, bookings,
            or transactions. Personal information must be handled in accordance
            with applicable data-protection requirements and Pawdigree's
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2>9. Reviews and Complaints</h2>
          <p>
            Vendors must not manipulate reviews, submit fraudulent feedback,
            or pressure customers to provide misleading ratings. Pawdigree may
            review complaints and take appropriate action under its policies.
          </p>
        </section>

        <section>
          <h2>10. Suspension and Termination</h2>
          <p>
            Pawdigree may restrict or suspend an account where there is
            evidence of fraud, unlawful activity, serious misconduct, or
            repeated violations of platform policies. Any applicable notice
            or response process will be subject to the relevant policies and law.
          </p>
        </section>

        <section>
          <h2>11. Platform Availability</h2>
          <p>
            Pawdigree may occasionally be unavailable due to maintenance,
            security updates, or technical problems. The responsibilities of
            Pawdigree and vendors must be interpreted in accordance with
            applicable law and any relevant platform policies.
          </p>
        </section>

        <section>
          <h2>12. Changes to These Terms</h2>
          <p>
            Pawdigree may update these Terms and Conditions when necessary.
            Material changes should be communicated appropriately, and renewed
            consent will be requested where required.
          </p>
        </section>

        <section>
          <h2>13. Applicable Law</h2>
          <p>
            These terms are intended for a marketplace operating in Uganda.
            The final terms, including legal and dispute-resolution provisions,
            should be reviewed before official publication.
          </p>
        </section>

        <section>
          <h2>14. Contact and Support</h2>
          <p>
            For questions about these terms, contact Pawdigree through the
            official support contact published on the platform.
          </p>
        </section>

        <p className="terms-notice">
          Please note: This is draft content for project development and
          requires review and approval before being used as an official
          legal agreement.
        </p>

        <Link to="/vendor-registration" className="terms-return-button">
          Return to Registration
        </Link>
      </article>
    </main>
  );
}

export default TermsAndConditionsPage;
