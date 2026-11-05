import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import BackButton from "../../components/BackButton/BackButton";
import { type Business } from "../../components/VendorBusinessUpdateForm/VendorBusinessUpdateForm";
import { apiRequest } from "../../services/api";
import "./DocumentUpload.css";

type DocumentId =
  | "idFront"
  | "idBack"
  | "license"
  | "certificate"
  | "supporting";

type DocumentItem = {
  id: DocumentId;
  label: string;
  required: boolean;
  wide?: boolean;
};

type SelectedDocument = {
  file: File;
  status: "selected" | "uploading" | "complete" | "failed";
  message: string;
};

type BusinessState = {
  status: "loading" | "ready" | "error";
  business: Business | null;
};

const documents: DocumentItem[] = [
  { id: "idFront", label: "Government ID (front)", required: true },
  { id: "idBack", label: "Government ID (back)", required: true },
  { id: "license", label: "Business license", required: true },
  {
    id: "certificate",
    label: "Vet / breeder / vendor certificate",
    required: true,
    wide: true,
  },
  {
    id: "supporting",
    label: "Any other supporting documents",
    required: false,
    wide: true,
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function DocumentUpload() {
  const [files, setFiles] = useState<
    Partial<Record<DocumentId, SelectedDocument>>
  >({});
  const [confirmed, setConfirmed] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "">("");
  const [saving, setSaving] = useState(false);
  const [businessState, setBusinessState] = useState<BusinessState>({
    status: "loading",
    business: null,
  });

  const inputRefs = useRef<
    Partial<Record<DocumentId, HTMLInputElement | null>>
  >({});

  useEffect(() => {
    let cancelled = false;
    apiRequest<Business[] | { results?: Business[] }>("/businesses/")
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        if (!cancelled) {
          setBusinessState({ status: "ready", business: list[0] ?? null });
        }
      })
      .catch(() => {
        if (!cancelled) setBusinessState({ status: "error", business: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFile = (id: DocumentId, file?: File) => {
    if (!file) return;

    setNotice("");
    setNoticeType("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFiles((previous) => ({
        ...previous,
        [id]: {
          file,
          status: "failed",
          message: "Unsupported file type. Use PDF, JPG, PNG or WEBP.",
        },
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFiles((previous) => ({
        ...previous,
        [id]: {
          file,
          status: "failed",
          message: "File is too large. Maximum size is 10 MB.",
        },
      }));
      return;
    }

    setFiles((previous) => ({
      ...previous,
      [id]: {
        file,
        status: "selected",
        message: "Selected — ready to upload",
      },
    }));
  };

  const handleInputChange = (
    id: DocumentId,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    handleFile(id, event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (id: DocumentId, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(id, event.dataTransfer.files[0]);
  };

  const removeFile = (id: DocumentId) => {
    setFiles((previous) => {
      const updated = { ...previous };
      delete updated[id];
      return updated;
    });
    setNotice("");
  };

  const requiredDocumentsReady = documents
    .filter((document) => document.required)
    .every((document) => {
      const selected = files[document.id];
      return selected && selected.status !== "failed";
    });

  const handleSubmit = async () => {
    if (!requiredDocumentsReady) {
      setNoticeType("error");
      setNotice("Please select a valid file for every required document.");
      return;
    }

    if (!confirmed) {
      setNoticeType("error");
      setNotice(
        "Please confirm that the information belongs to your business.",
      );
      return;
    }

    // Files are selected locally at this stage. Connect your backend's
    // document-upload endpoint here before marking uploads as complete.
    setNoticeType("error");
    setNotice(
      "Your documents are selected, but server upload is not connected yet. Please connect the document-upload API before submitting for verification.",
    );
  };

  const handleSaveExit = () => {
    setNoticeType("success");
    setNotice(
      "Your selected files remain on this page for now. Connect the save-progress API to save them permanently.",
    );
  };

  const business = businessState.business;
  const businessName = business?.name || business?.business_name;
  const category = business?.category_name || business?.vendor_category;
  const location = business?.city_district || business?.location_district;
  const phone = business?.phone || business?.contact;

  return (
    <div className="document-page">
      <main className="document-main">
        <BackButton fallback="/vendor/dashboard" label="Back to dashboard" />

        <div className="document-title-row">
          <div>
            <h1>Verify your business</h1>
            <p className="document-subtitle">
              Step 3 of 3 — Business verification
            </p>
          </div>
          <span className="document-progress">80%</span>
        </div>

        <section className="business-details">
          <h2>Business Details</h2>
          {businessState.status === "loading" ? (
            <p role="status">Loading your business details…</p>
          ) : businessState.status === "error" ? (
            <p role="alert">
              We couldn't load your business details. Please refresh the page.
            </p>
          ) : !business ? (
            <p>No business found yet. Add your business details first.</p>
          ) : (
            <div className="business-details-grid">
              {businessName && (
                <div>
                  <span>Business Name</span>
                  <strong>{businessName}</strong>
                </div>
              )}
              {category && (
                <div>
                  <span>Business Category</span>
                  <strong>{category}</strong>
                </div>
              )}
              {location && (
                <div>
                  <span>Business Location</span>
                  <strong>{location}</strong>
                </div>
              )}
              {phone && (
                <div>
                  <span>Business Phone</span>
                  <strong>{phone}</strong>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="upload-section">
          <h2>Documents Upload</h2>
          <p className="upload-intro">
            Upload clear copies of your business verification documents.
          </p>

          <div className="upload-grid">
            {documents.map((document) => {
              const selected = files[document.id];

              return (
                <div
                  key={document.id}
                  className={`upload-field ${document.wide ? "upload-field-wide" : ""}`}
                >
                  <label className="upload-label">
                    {document.label}
                    {document.required && (
                      <span className="required-star"> *</span>
                    )}
                  </label>

                  <input
                    ref={(element) => {
                      inputRefs.current[document.id] = element;
                    }}
                    className="visually-hidden"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) => handleInputChange(document.id, event)}
                    aria-label={`Choose ${document.label}`}
                  />

                  <div
                    className={`upload-dropzone ${
                      selected?.status === "failed"
                        ? "upload-dropzone-error"
                        : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRefs.current[document.id]?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        inputRefs.current[document.id]?.click();
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(document.id, event)}
                  >
                    {selected ? (
                      <div className="selected-file">
                        <span className="file-symbol" aria-hidden="true">
                          {selected.status === "failed" ? "!" : "✓"}
                        </span>
                        <strong className="selected-file-name">
                          {selected.file.name}
                        </strong>
                        <span className="file-size">
                          {(selected.file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <span
                          className={`file-status status-${selected.status}`}
                          role="status"
                        >
                          {selected.message}
                        </span>
                        <span className="replace-hint">
                          Click to replace file
                        </span>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <span className="upload-icon" aria-hidden="true">
                          ↑
                        </span>
                        <span>Drag &amp; drop or click to upload</span>
                        <small>PDF, JPG, PNG or WEBP · Max 10 MB</small>
                      </div>
                    )}
                  </div>

                  {selected && (
                    <button
                      className="remove-file-button"
                      type="button"
                      onClick={() => removeFile(document.id)}
                    >
                      Remove file
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="confirmation-section">
          <h2>Confirmation</h2>
          <label className="confirmation-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              I confirm that the information provided is accurate and belongs to
              my business.
              <small>Required before you can submit for verification.</small>
            </span>
          </label>
        </section>

        <aside className="next-steps">
          <span className="info-icon" aria-hidden="true">
            i
          </span>
          <div>
            <strong>What happens next?</strong>
            <p>
              Our team will review your information and notify you via email
              once your application has been reviewed.
            </p>
          </div>
        </aside>

        {notice && (
          <div
            className={`document-notice notice-${noticeType}`}
            role="status"
            aria-live="polite"
          >
            {notice}
          </div>
        )}

        <div className="document-actions">
          <button
            className="submit-documents-button"
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await handleSubmit();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Please wait..." : "Submit and Continue"}
          </button>

          <button
            className="save-exit-button"
            type="button"
            onClick={handleSaveExit}
          >
            Save &amp; Exit
          </button>
        </div>
      </main>
    </div>
  );
}
