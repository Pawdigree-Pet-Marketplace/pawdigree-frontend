import { ShieldCheck, Store, Users } from "lucide-react";
import BackButton from "../../components/BackButton/BackButton";
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs";
import VendorRegistrationForm from "../../components/VendorRegistrationForm/VendorRegistrationForm";
import "./VendorRegistrationPage.css";

function VendorRegistrationPage() {
  return (
    <div className="vendor-registration-page-wrapper">
      <main className="vendor-registration-main">
        <section className="vendor-registration-intro">
          <div className="vendor-registration-nav">
            <BackButton fallback="/vendor" label="Back" />
            <Breadcrumbs
              variant="light"
              items={[
                { label: "Home", to: "/" },
                { label: "Vendors", to: "/vendor" },
                { label: "Register" },
              ]}
            />
          </div>

          <span className="vendor-registration-eyebrow">
            JOIN THE PAWDIGREE COMMUNITY
          </span>

          <h1>
            Grow your business
            <span> with Pawdigree.</span>
          </h1>

          <p className="vendor-registration-description">
            Connect with pet owners, showcase your products and services, and
            grow your business in Uganda&apos;s pet marketplace.
          </p>

          <div className="vendor-registration-benefits">
            <div className="vendor-registration-benefit">
              <span className="vendor-benefit-icon" aria-hidden="true">
                <Store size={20} />
              </span>
              <div>
                <h2>Showcase your business</h2>
                <p>
                  Display your pet products and services to potential customers.
                </p>
              </div>
            </div>

            <div className="vendor-registration-benefit">
              <span className="vendor-benefit-icon" aria-hidden="true">
                <Users size={20} />
              </span>
              <div>
                <h2>Connect with pet owners</h2>
                <p>Reach people who care about pets and need your services.</p>
              </div>
            </div>

            <div className="vendor-registration-benefit">
              <span className="vendor-benefit-icon" aria-hidden="true">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h2>Build trust with verification</h2>
                <p>
                  Strengthen customer confidence through vendor verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="vendor-registration-form-section"
          aria-label="Vendor registration"
        >
          <VendorRegistrationForm />
        </section>
      </main>
    </div>
  );
}

export default VendorRegistrationPage;
