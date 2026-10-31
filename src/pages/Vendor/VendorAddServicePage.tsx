import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, Clock3, Info, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import "./VendorAddServicePage.css";

export default function VendorAddServicePage() {
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    document.title = "Add Service - Pawdigree";

  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <VendorLayout
      title="Add a service"
      description="Tell customers about the care and services your business offers."
      vendorWorkspace
    >
      <div className="dashboard-content vendor-service-page">
        <Link className="service-back-link" to="/vendor/dashboard">
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <form className="service-listing-form" onSubmit={handleSubmit}>
          <section className="service-form-section">
            <div className="service-section-heading">
              <span className="service-section-icon"><BriefcaseBusiness size={20} /></span>
              <div>
                <h2>Service details</h2>
                <p>Give customers the key details they need before booking.</p>
              </div>
            </div>

            <label className="service-field">
              Service name <span aria-hidden="true">*</span>
              <input
                value={serviceName}
                onChange={(event) => setServiceName(event.target.value)}
                maxLength={120}
                placeholder="e.g. Dog grooming"
                autoComplete="off"
                required
              />
            </label>

            <label className="service-field">
              Description <span aria-hidden="true">*</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="Describe what the service includes and who it is for..."
                required
              />
              <small>{description.length}/2000 characters</small>
            </label>

            <div className="service-form-grid">
              <label className="service-field">
                Price (UGX) <span aria-hidden="true">*</span>
                <span className="service-input-wrap">
                  <Wallet size={17} aria-hidden="true" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="e.g. 50000"
                    required
                  />
                </span>
              </label>

              <label className="service-field">
                Duration (minutes) <span aria-hidden="true">*</span>
                <span className="service-input-wrap">
                  <Clock3 size={17} aria-hidden="true" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="e.g. 60"
                    required
                  />
                </span>
              </label>
            </div>
          </section>

          <aside className="service-unavailable-note" role="status">
            <Info size={20} aria-hidden="true" />
            <p>
              Saving services isn’t available just yet. Once setup is complete,
              you’ll be able to publish your service for customers to find.
            </p>
          </aside>

          <div className="service-form-actions">
            <Link to="/vendor/dashboard" className="service-cancel-button">Cancel</Link>
            <button className="service-submit-button" type="submit" disabled>
              Save service
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}
