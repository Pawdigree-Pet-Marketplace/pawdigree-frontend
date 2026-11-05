import { Heart, ShieldCheck } from "lucide-react";
import BackButton from "../../components/BackButton/BackButton";
import CustomerRegistrationForm from "../../components/CustomerRegistrationForm/CustomerRegistrationForm";
import "./RegistrationPage.css";

export default function RegistrationPage() {
  return (
    <main className="registration-page registration-page--layout">
      <section className="registration-intro">
        <BackButton fallback="/" label="Back" />

        <span className="registration-eyebrow">WELCOME TO PAWDIGREE</span>

        <h1>Your journey to a happier pet life starts here.</h1>

        <p>
          Join our community to discover pets, connect with trusted vendors, and
          explore veterinary and pet-care services.
        </p>

        <div className="registration-benefits">
          <div className="registration-benefit">
            <span className="benefit-icon" aria-hidden="true">
              <Heart size={20} />
            </span>
            <div>
              <h2>A community that cares</h2>
              <p>Connect with people who love pets as much as you do.</p>
            </div>
          </div>

          <div className="registration-benefit">
            <span className="benefit-icon" aria-hidden="true">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h2>Trusted connections</h2>
              <p>Discover pet services and marketplace listings.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="registration-form-container">
        <CustomerRegistrationForm />
      </div>
    </main>
  );
}
