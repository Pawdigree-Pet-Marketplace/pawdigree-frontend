
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
import API_BASE_URL from "../../services/api";

import "./DocumentUpload.css";

type BusinessType = "PRODUCT_SELLER" | "SERVICE_PROVIDER";

type Business = {
  id: string;
  name: string;
  description?: string;
  business_type: BusinessType;
  verification_status: string;
  contact?: string;
  email?: string;
  address?: string;
  city_district?: string;
};

type DocumentType =
  | "REGISTRATION"
  | "TAX"
  | "PROFESSIONAL_CERTIFICATE"
  | "SUPPORTING_DOCUMENT";

type ReviewStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "superseded";

type UploadedDocument = {
  document_id: string;
  document_type: DocumentType;
  review_status: ReviewStatus;
  correction_reason: string | null;
  version: number;
  reviewed_at: string | null;
  created_at: string;
  download_url: string | null;
};

type DocumentDefinition = {
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
};

type SelectedFile = {
  file: File;
  error?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const API_ROOT = `${API_BASE_URL.replace(/\/$/, "")}/api`;

const getErrorMessage = (data: unknown): string => {
  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    const errorData = data as Record<string, unknown>;

    if (typeof errorData.detail === "string") {
      return errorData.detail;
    }

    return Object.entries(errorData)
      .map(([field, messages]) => {
        const message = Array.isArray(messages)
          ? messages.join(" ")
          : String(messages);

        return `${field}: ${message}`;
      })
      .join("\n");
  }

  return "Something went wrong. Please try again.";
};

const getStatusLabel = (status: ReviewStatus): string => {
  switch (status) {
    case "pending":
      return "Awaiting review";
    case "approved":
      return "Approved";
    case "changes_requested":
      return "Changes requested";
    case "superseded":
      return "Replaced";
    default:
      return status;
  }
};

export default function DocumentUpload() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();

  const [business, setBusiness] = useState<Business | null>(null);

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);

  const [selectedFiles, setSelectedFiles] = useState<
    Partial<Record<DocumentType, SelectedFile>>
  >({});

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<
    "success" | "error" | ""
  >("");

  const inputRefs = useRef<
    Partial<Record<DocumentType, HTMLInputElement | null>>
  >({});

  const token = localStorage.getItem("access");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token ?? ""}`,
    }),
    [token],
  );

  // Load the business and its previously uploaded documents.
  const loadOnboardingData = useCallback(async () => {
    if (!businessId) {
      throw new Error("Business ID is missing from the page URL.");
    }

    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const [businessResponse, documentsResponse] = await Promise.all([
      fetch(`${API_ROOT}/businesses/${businessId}/`, {
        headers: authHeaders,
      }),

      fetch(`${API_ROOT}/documents/business/${businessId}/`, {
        headers: authHeaders,
      }),
    ]);

    const businessData = await businessResponse.json().catch(() => null);
    const documentsData = await documentsResponse.json().catch(() => null);

    if (!businessResponse.ok) {
      throw new Error(getErrorMessage(businessData));
    }

    if (!documentsResponse.ok) {
      throw new Error(getErrorMessage(documentsData));
    }

    const documentList: UploadedDocument[] = Array.isArray(documentsData)
      ? documentsData
      : documentsData?.results ?? [];

    const registrationResult = sessionStorage.getItem("onboardingRegistrationResult");
    if (registrationResult) {
      try {
        const result = JSON.parse(registrationResult) as { businessId?: string; verification_status?: string };
        if (String(result.businessId) === String(businessId)) {
          const status = (result.verification_status ?? businessData.verification_status ?? "draft").toLowerCase();
          const confirmation = status === "pending"
            ? "Your business was registered and submitted for admin review."
            : status === "approved" || status === "verified"
              ? "Your business was registered and is approved."
              : `Your business was registered and saved as ${status.replaceAll("_", " ")}. Upload the required documents below to submit it for review.`;
          setNotice(confirmation);
          setNoticeType("success");
          sessionStorage.removeItem("onboardingRegistrationResult");
        }
      } catch {
        sessionStorage.removeItem("onboardingRegistrationResult");
      }
    }

    setBusiness(businessData as Business);
    setUploadedDocuments(documentList);
  }, [businessId, token, authHeaders]);

  // Load onboarding information when the page opens.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        await loadOnboardingData();
      } catch (error) {
        if (!cancelled) {
          setNoticeType("error");

          setNotice(
            error instanceof Error
              ? error.message
              : "We could not load your onboarding information.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [loadOnboardingData]);

  // Determine which documents are required based on business type.
  const documents = useMemo<DocumentDefinition[]>(() => {
    const definitions: DocumentDefinition[] = [
      {
        type: "REGISTRATION",
        label: "Business Trading Licence",
        description: "Upload your business trading licence.",
        required: true,
      },
      {
        type: "TAX",
        label: "Tax Records",
        description: "Upload the required business tax records.",
        required: true,
      },
    ];

    if (business?.business_type === "SERVICE_PROVIDER") {
      definitions.push({
        type: "PROFESSIONAL_CERTIFICATE",
        label: "Professional Certificate",
        description:
          "Upload the relevant professional or service qualification certificate.",
        required: true,
      });
    }

    definitions.push({
      type: "SUPPORTING_DOCUMENT",
      label: "Supporting Documents",
      description:
        "Upload any additional documents that support your application.",
      required: false,
    });

    return definitions;
  }, [business?.business_type]);

  // Find the latest non-superseded document of a particular type.
  const getCurrentDocument = (
    type: DocumentType,
  ): UploadedDocument | undefined => {
    return uploadedDocuments
      .filter(
        (document) =>
          document.document_type === type &&
          document.review_status !== "superseded",
      )
      .sort((a, b) => {
        if (a.version !== b.version) {
          return b.version - a.version;
        }

        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      })[0];
  };

  // Select and validate a file.
  const handleFile = (type: DocumentType, file?: File) => {
    if (!file) return;

    setNotice("");
    setNoticeType("");

    let error = "";

    if (!ACCEPTED_TYPES.includes(file.type)) {
      error = "Unsupported file. Please use PDF, JPG or PNG.";
    } else if (file.size > MAX_FILE_SIZE) {
      error = "The file is too large. The maximum size is 10 MB.";
    }

    setSelectedFiles((previous) => ({
      ...previous,
      [type]: {
        file,
        error: error || undefined,
      },
    }));
  };

  // Handle normal file selection.
  const handleInputChange = (
    type: DocumentType,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    handleFile(type, event.target.files?.[0]);
    event.target.value = "";
  };

  // Handle drag-and-drop file selection.
  const handleDrop = (
    type: DocumentType,
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    handleFile(type, event.dataTransfer.files[0]);
  };

  // Remove a selected file that has not been uploaded.
  const removeFile = (type: DocumentType) => {
    setSelectedFiles((previous) => {
      const updated = { ...previous };
      delete updated[type];
      return updated;
    });

    setNotice("");
    setNoticeType("");
  };

  // Upload a new document or resubmit a document requiring corrections.
  const uploadDocument = async (
    type: DocumentType,
    file: File,
    existingDocument?: UploadedDocument,
  ) => {
    if (!businessId || !token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const formData = new FormData();

    let url: string;

    if (existingDocument?.review_status === "changes_requested") {
      // Resubmission endpoint expects only the replacement file.
      url = `${API_ROOT}/documents/${existingDocument.document_id}/resubmit/`;

      formData.append("file", file);
    } else {
      // New document upload.
      url = `${API_ROOT}/documents/`;

      formData.append("business", businessId);
      formData.append("document_type", type);
      formData.append("file", file);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(getErrorMessage(responseData));
    }
  };

  // Check whether every required document is available.
  const requiredDocumentsReady = (): boolean => {
    return documents
      .filter((document) => document.required)
      .every((document) => {
        const existing = getCurrentDocument(document.type);
        const selected = selectedFiles[document.type];

        if (existing?.review_status === "changes_requested") {
          return Boolean(selected && !selected.error);
        }

        if (existing) {
          return true;
        }

        return Boolean(selected && !selected.error);
      });
  };

  // Upload documents and submit the business application when appropriate.
  const handleSubmit = async () => {
    if (!businessId || !business || !token) {
      setNoticeType("error");
      setNotice("Your business information or login session is missing.");
      return;
    }

    const isDraft = business.verification_status === "draft";

    // A non-draft business can still submit corrected documents.
    const hasCorrectionToResubmit = documents.some((document) => {
      const existing = getCurrentDocument(document.type);
      const selected = selectedFiles[document.type];

      return (
        existing?.review_status === "changes_requested" &&
        Boolean(selected && !selected.error)
      );
    });

    if (!isDraft && !hasCorrectionToResubmit) {
      setNoticeType("error");
      setNotice(
        "There are no requested document corrections to submit.",
      );
      return;
    }

    if (!requiredDocumentsReady()) {
      setNoticeType("error");
      setNotice(
        "Please provide every required document before submitting.",
      );
      return;
    }

    const hasInvalidFile = documents.some(
      (document) => selectedFiles[document.type]?.error,
    );

    if (hasInvalidFile) {
      setNoticeType("error");
      setNotice("Please fix the file errors before continuing.");
      return;
    }

    if (isDraft && !confirmed) {
      setNoticeType("error");
      setNotice(
        "Please confirm that the information belongs to your business.",
      );
      return;
    }

    setSaving(true);
    setNotice("");
    setNoticeType("");

    try {
      // Upload selected files one at a time.
      for (const document of documents) {
        const selected = selectedFiles[document.type];

        if (!selected) continue;

        const existing = getCurrentDocument(document.type);

        // Do not create duplicate uploads for documents already
        // awaiting review or already approved.
        if (
          existing &&
          existing.review_status !== "changes_requested"
        ) {
          continue;
        }

        await uploadDocument(
          document.type,
          selected.file,
          existing,
        );
      }

      // Refresh the document list after uploads.
      await loadOnboardingData();

      if (isDraft) {
        // Only a draft business needs to be submitted for verification.
        const submitResponse = await fetch(
          `${API_ROOT}/businesses/${businessId}/submit/`,
          {
            method: "POST",
            headers: authHeaders,
          },
        );

        const submitData = await submitResponse.json().catch(() => null);

        if (!submitResponse.ok) {
          throw new Error(getErrorMessage(submitData));
        }

        setBusiness((previous) =>
          previous
            ? {
                ...previous,
                verification_status:
                  submitData.verification_status ?? "pending",
              }
            : previous,
        );

        setNotice(
          "Your documents have been uploaded and your business application has been submitted for verification.",
        );
      } else {
        // A correction request only requires document resubmission.
        setNotice(
          "Your corrected documents have been resubmitted successfully.",
        );
      }

      setSelectedFiles({});
      setNoticeType("success");
    } catch (error) {
      setNoticeType("error");

      setNotice(
        error instanceof Error
          ? error.message
          : "We could not complete your submission. Please try again.",
      );

      // Refresh the list in case some uploads succeeded before
      // another upload or the final submission failed.
      try {
        await loadOnboardingData();
      } catch {
        // Keep the original error visible.
      }
    } finally {
      setSaving(false);
    }
  };

  // Uploaded documents are saved on the backend.
  // Selected local files are not saved until uploaded.
  const handleSaveExit = () => {
    const hasUnuploadedFiles = Object.values(selectedFiles).some(
      (selected) => Boolean(selected),
    );

    if (hasUnuploadedFiles) {
      setNoticeType("error");

      setNotice(
        "You have selected files that have not been uploaded. Submit them first, or remove them before leaving. Previously uploaded documents are already saved.",
      );

      return;
    }

    navigate("/vendor/dashboard");
  };

  const businessStatus = business?.verification_status;

  return (
    <VendorLayout
      title="Verify your business"
      description="Step 3 of 3 — Business verification"
      businessName={business?.name ?? "Your store"}
      vendorWorkspace
    >
      <div className="vendor-page-content document-page">
        <main className="document-main">
        
          <section className="business-details">
            <h2>Business Details</h2>

            {loading ? (
              <p role="status">Loading your business details…</p>
            ) : business ? (
              <div className="business-details-grid">
                <div>
                  <span>Business Name</span>
                  <strong>{business.name}</strong>
                </div>

                <div>
                  <span>Business Type</span>
                  <strong>
                    {business.business_type === "SERVICE_PROVIDER"
                      ? "Service Provider"
                      : "Product Seller"}
                  </strong>
                </div>

                {business.city_district && (
                  <div>
                    <span>Business Location</span>
                    <strong>{business.city_district}</strong>
                  </div>
                )}

                {business.contact && (
                  <div>
                    <span>Business Phone</span>
                    <strong>{business.contact}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p role="alert">
                Business details could not be loaded. Please refresh the page.
              </p>
            )}

            {businessStatus && businessStatus !== "draft" && (
              <p className="document-status-message">
                Application status: {businessStatus.replaceAll("_", " ")}
              </p>
            )}
          </section>

          <section className="upload-section">
            <h2>Documents Upload</h2>

            <p className="upload-intro">
              Upload clear copies of the documents required to verify your
              business. Accepted formats: PDF, JPG and PNG. Maximum file size:
              10 MB.
            </p>

            <div className="upload-grid">
              {documents.map((document) => {
                const selected = selectedFiles[document.type];
                const existing = getCurrentDocument(document.type);

                const needsCorrection =
                  existing?.review_status === "changes_requested";

                const canChooseFile =
                  !saving && (!existing || needsCorrection);

                return (
                  <div
                    key={document.type}
                    className={`upload-field ${
                      document.type === "SUPPORTING_DOCUMENT"
                        ? "upload-field-wide"
                        : ""
                    }`}
                  >
                    <label className="upload-label">
                      {document.label}

                      {document.required && (
                        <span className="required-star"> *</span>
                      )}
                    </label>

                    <p className="document-description">
                      {document.description}
                    </p>

                    {existing && (
                      <div className="existing-document">
                        <strong>
                          Version {existing.version} —{" "}
                          {getStatusLabel(existing.review_status)}
                        </strong>

                        {existing.correction_reason && (
                          <p className="correction-reason">
                            <strong>Reason for correction:</strong>{" "}
                            {existing.correction_reason}
                          </p>
                        )}
                      </div>
                    )}

                    <input
                      ref={(element) => {
                        inputRefs.current[document.type] = element;
                      }}
                      className="visually-hidden"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={!canChooseFile}
                      onChange={(event) =>
                        handleInputChange(document.type, event)
                      }
                      aria-label={`Choose ${document.label}`}
                    />

                    {canChooseFile ? (
                      <div
                        className={`upload-dropzone ${
                          selected?.error
                            ? "upload-dropzone-error"
                            : ""
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          inputRefs.current[document.type]?.click()
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            inputRefs.current[document.type]?.click();
                          }
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) =>
                          handleDrop(document.type, event)
                        }
                      >
                        {selected ? (
                          <div className="selected-file">
                            <strong className="selected-file-name">
                              {selected.file.name}
                            </strong>

                            <span className="file-size">
                              {(
                                selected.file.size /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              MB
                            </span>

                            <span
                              className={`file-status ${
                                selected.error
                                  ? "status-failed"
                                  : "status-selected"
                              }`}
                            >
                              {selected.error ??
                                "Selected — ready to upload"}
                            </span>
                          </div>
                        ) : (
                          <div className="upload-prompt">
                            <span
                              className="upload-icon"
                              aria-hidden="true"
                            >
                              ↑
                            </span>

                            <span>
                              Drag &amp; drop or click to upload
                            </span>

                            <small>PDF, JPG or PNG · Max 10 MB</small>
                          </div>
                        )}
                      </div>
                    ) : existing ? (
                      <p className="document-locked-message">
                        {existing.review_status === "approved"
                          ? "This document has been approved."
                          : existing.review_status === "pending"
                            ? "This document is awaiting review."
                            : "This document cannot currently be replaced."}
                      </p>
                    ) : null}

                    {selected && (
                      <button
                        className="remove-file-button"
                        type="button"
                        disabled={saving}
                        onClick={() => removeFile(document.type)}
                      >
                        Remove selected file
                      </button>
                    )}

                    {needsCorrection && (
                      <p className="correction-hint">
                        Upload a corrected file. It will be sent as a
                        resubmission of the existing document.
                      </p>
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
                disabled={saving || businessStatus !== "draft"}
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
              />

              <span>
                I confirm that the information provided is accurate and
                belongs to my business.

                <small>
                  Required before you can submit for verification.
                </small>
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
                Once you submit, our team will review your business
                information and documents. You will be notified when your
                application has been reviewed.
              </p>
            </div>
          </aside>

          {notice && (
            <div
              className={`document-notice notice-${noticeType}`}
              role="alert"
              aria-live="polite"
            >
              {notice}
            </div>
          )}

          <div className="document-actions">
            {businessStatus === "draft" && (
              <button
                className="submit-documents-button"
                type="button"
                disabled={saving || loading || !business}
                onClick={handleSubmit}
              >
                {saving ? "Submitting..." : "Submit for Verification"}
              </button>
            )}

            {businessStatus !== "draft" &&
              documents.some((document) => {
                const existing = getCurrentDocument(document.type);

                return existing?.review_status === "changes_requested";
              }) && (
                <button
                  className="submit-documents-button"
                  type="button"
                  disabled={saving || loading || !business}
                  onClick={handleSubmit}
                >
                  {saving ? "Resubmitting..." : "Resubmit Corrected Documents"}
                </button>
              )}

            <button
              className="save-exit-button"
              type="button"
              disabled={saving}
              onClick={handleSaveExit}
            >
              Save as Draft &amp; Exit
            </button>
          </div>
        </main>
      </div>
    </VendorLayout>
  );
}
