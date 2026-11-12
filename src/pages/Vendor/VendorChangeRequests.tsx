
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Send,
  Upload,
  Building2,
} from "lucide-react";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import "./VendorChangeRequests.css";
import VendorLayout from "../../layouts/VendorLayout/VendorLayout";
type DocumentType = "REGISTRATION" | "TAX" | "OTHER";

interface BusinessDocument {
  id?: string;
  document_id?: string;
  document_type?: DocumentType;
  status?: string;
  verification_status?: string;
  decision_reason?: string;
  file?: string;
  name?: string;
}

interface Business {
  id?: string;
  business_id?: string;
  name?: string;
  description?: string;
  contact?: string;
  email?: string;
  address?: string;
  city_district?: string;
  business_hours?: string;
  verification_status?: string;
  decision_reason?: string;
  documents?: BusinessDocument[];
  business_documents?: BusinessDocument[];
}

interface BusinessForm {
  name: string;
  description: string;
  contact: string;
  email: string;
  address: string;
  city_district: string;
  business_hours: string;
}

const emptyForm: BusinessForm = {
  name: "",
  description: "",
  contact: "",
  email: "",
  address: "",
  city_district: "",
  business_hours: "",
};

function getBusinessId(business: Business): string {
  return String(business.business_id ?? business.id ?? "");
}

function getDocumentId(document: BusinessDocument): string {
  return String(document.document_id ?? document.id ?? "");
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.message === "string") return record.message;
  }
  return fallback;
}

export default function VendorChangeRequests() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState("");
 
  const [forms, setForms] = useState<Record<string, BusinessForm>>({});
  const [savingBusiness, setSavingBusiness] = useState<string | null>(null);

  const [responses, setResponses] = useState<Record<string, string>>({});
  const [sendingResponse, setSendingResponse] = useState<string | null>(null);

  const [newFiles, setNewFiles] = useState<
    Record<string, { file: File | null; type: DocumentType }>
  >({});
  const [uploadingBusiness, setUploadingBusiness] = useState<string | null>(
    null,
  );

  const [resubmitFiles, setResubmitFiles] = useState<Record<string, File | null>>(
    {},
  );
  const [resubmittingDocument, setResubmittingDocument] = useState<
    string | null
  >(null);

  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [actionSuccess, setActionSuccess] = useState<Record<string, string>>(
    {},
  );

  const loadBusinesses = useCallback(async () => {
    setPageError("");

    try {
      const response = await vendorAuthenticatedFetch(
        "/api/businesses/verification-status/",
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to load admin change requests."),
        );
      }

      let records: Business[] = [];

      if (Array.isArray(data)) {
        records = data as Business[];
      } else if (typeof data === "object" && data !== null) {
        const result = data as {
          results?: Business[];
          businesses?: Business[];
        };

        records = result.results ?? result.businesses ?? [];
      }

      setBusinesses(records);

      setForms((previous) => {
        const updated = { ...previous };

        records.forEach((business) => {
          const id = getBusinessId(business);

          if (!id || updated[id]) return;

          updated[id] = {
            name: business.name ?? "",
            description: business.description ?? "",
            contact: business.contact ?? "",
            email: business.email ?? "",
            address: business.address ?? "",
            city_district: business.city_district ?? "",
            business_hours: business.business_hours ?? "",
          };
        });

        return updated;
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load change requests.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBusinesses().finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBusinesses]);

  async function refreshBusinesses() {
    setRefreshing(true);
    await loadBusinesses();
    setRefreshing(false);
  }

  function updateBusinessForm(
    businessId: string,
    field: keyof BusinessForm,
    value: string,
  ) {
    setForms((previous) => ({
      ...previous,
      [businessId]: {
        ...(previous[businessId] ?? emptyForm),
        [field]: value,
      },
    }));

    clearMessages(businessId);
  }

  function clearMessages(key: string) {
    setActionErrors((previous) => ({ ...previous, [key]: "" }));
    setActionSuccess((previous) => ({ ...previous, [key]: "" }));
  }

  async function handleBusinessUpdate(
    event: FormEvent<HTMLFormElement>,
    businessId: string,
  ) {
    event.preventDefault();

    const form = forms[businessId];

    if (!form) return;

    setSavingBusiness(businessId);
    clearMessages(businessId);

    try {
      const response = await vendorAuthenticatedFetch(
        `/api/businesses/${businessId}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update business information."),
        );
      }

      setActionSuccess((previous) => ({
        ...previous,
        [businessId]: "Business information updated successfully.",
      }));

      await loadBusinesses();
    } catch (error) {
      setActionErrors((previous) => ({
        ...previous,
        [businessId]:
          error instanceof Error
            ? error.message
            : "Unable to update business information.",
      }));
    } finally {
      setSavingBusiness(null);
    }
  }

  async function handleNewDocumentUpload(
    event: FormEvent<HTMLFormElement>,
    businessId: string,
  ) {
    event.preventDefault();

    const selected = newFiles[businessId];

    if (!selected?.file) {
      setActionErrors((previous) => ({
        ...previous,
        [`upload-${businessId}`]: "Please select a document.",
      }));
      return;
    }

    setUploadingBusiness(businessId);
    clearMessages(`upload-${businessId}`);

    try {
      const formData = new FormData();

      formData.append("business", businessId);
      formData.append("document_type", selected.type);
      formData.append("file", selected.file);

      const response = await vendorAuthenticatedFetch("/api/documents/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to upload business document."),
        );
      }

      setActionSuccess((previous) => ({
        ...previous,
        [`upload-${businessId}`]: "Document uploaded successfully.",
      }));

      setNewFiles((previous) => ({
        ...previous,
        [businessId]: { file: null, type: selected.type },
      }));

      await loadBusinesses();
    } catch (error) {
      setActionErrors((previous) => ({
        ...previous,
        [`upload-${businessId}`]:
          error instanceof Error
            ? error.message
            : "Unable to upload document.",
      }));
    } finally {
      setUploadingBusiness(null);
    }
  }

  async function handleDocumentResubmit(
    event: FormEvent<HTMLFormElement>,
    documentId: string,
  ) {
    event.preventDefault();

    const file = resubmitFiles[documentId];

    if (!file) {
      setActionErrors((previous) => ({
        ...previous,
        [`document-${documentId}`]: "Please select a corrected document.",
      }));
      return;
    }

    const formElement = event.currentTarget;

    setResubmittingDocument(documentId);
    clearMessages(`document-${documentId}`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await vendorAuthenticatedFetch(
        `/api/documents/${documentId}/resubmit/`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to resubmit corrected document."),
        );
      }

      setActionSuccess((previous) => ({
        ...previous,
        [`document-${documentId}`]: "Corrected document resubmitted successfully.",
      }));

      setResubmitFiles((previous) => ({
        ...previous,
        [documentId]: null,
      }));

      formElement.reset();

      await loadBusinesses();
    } catch (error) {
      setActionErrors((previous) => ({
        ...previous,
        [`document-${documentId}`]:
          error instanceof Error
            ? error.message
            : "Unable to resubmit corrected document.",
      }));
    } finally {
      setResubmittingDocument(null);
    }
  }

  async function handleVendorResponse(
    event: FormEvent<HTMLFormElement>,
    businessId: string,
  ) {
    event.preventDefault();

    const message = (responses[businessId] ?? "").trim();

    if (!message) {
      setActionErrors((previous) => ({
        ...previous,
        [`response-${businessId}`]: "Please explain the corrections you made.",
      }));
      return;
    }

    setSendingResponse(businessId);
    clearMessages(`response-${businessId}`);

    try {
      const response = await vendorAuthenticatedFetch(
        `/api/businesses/${businessId}/response/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor_response: message }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to submit response to admin."),
        );
      }

      setActionSuccess((previous) => ({
        ...previous,
        [`response-${businessId}`]:
          "Your response has been submitted. Your business is awaiting admin review.",
      }));

      setResponses((previous) => ({ ...previous, [businessId]: "" }));

      await loadBusinesses();
    } catch (error) {
      setActionErrors((previous) => ({
        ...previous,
        [`response-${businessId}`]:
          error instanceof Error
            ? error.message
            : "Unable to submit response.",
      }));
    } finally {
      setSendingResponse(null);
    }
  }

  if (loading) {
    return (
      <VendorLayout
        title="Admin Change Requests"
        description="Review and respond to business verification changes requested by the administrator."
      >
        <main className="vendor-change-page">
          <p>Loading business change requests...</p>
        </main>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout
      title="Admin Change Requests"
      description="Review and respond to business verification changes requested by the administrator."
    >
      <main className="vendor-change-page">
        <header className="vendor-change-header">        

          <button
            type="button"
            className="vendor-change-refresh"
            onClick={refreshBusinesses}
            disabled={refreshing}
          >
            <RefreshCw size={17} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {pageError && (
          <div className="vendor-change-alert vendor-change-alert-error">
            <AlertCircle size={18} />
            <span>{pageError}</span>
          </div>
        )}
        {!pageError && businesses.length === 0 && (
          <section className="vendor-change-empty">
            <CheckCircle size={42} />
            <h2>No business change requests found</h2>
            <p>
              There are currently no business verification requests available.
            </p>
          </section>
        )}

        <div className="vendor-change-business-list">
          {businesses.map((business, index) => {
            const businessId = getBusinessId(business);
            const businessForm = forms[businessId] ?? emptyForm;
            const documents =
              business.documents ?? business.business_documents ?? [];

            return (
              <article
                className="vendor-change-business-card"
                key={businessId || index}
              >
                <div className="vendor-change-business-heading">
                  <div className="vendor-change-business-icon">
                    <Building2 size={24} />
                  </div>

                  <div className="vendor-change-business-title">
                    <h2>{business.name || "Your Business"}</h2>
                    <span className="vendor-change-status">
                      {business.verification_status || "Verification"}
                    </span>
                  </div>
                </div>

                {/* ADMIN'S REQUEST */}
                <section className="vendor-change-request">
                  <h3>
                    <AlertCircle size={18} />
                    Admin's Requested Changes
                  </h3>

                  <p>
                    {business.decision_reason ||
                      "No specific change reason was provided. Please check with the administrator."}
                  </p>
                </section>

                {/* BUSINESS INFORMATION UPDATE */}
                <section className="vendor-change-section">
                  <h3>Update Business Information</h3>
                  <p className="vendor-change-section-description">
                    Correct the information requested by the administrator.
                  </p>

                  <form
                    className="vendor-change-form"
                    onSubmit={(event) =>
                      handleBusinessUpdate(event, businessId)
                    }
                  >
                    <label>
                      Business name
                      <input
                        value={businessForm.name}
                        onChange={(event) =>
                          updateBusinessForm(
                            businessId,
                            "name",
                            event.target.value,
                          )
                        }
                        required
                      />
                    </label>

                    <label>
                      Description
                      <textarea
                        value={businessForm.description}
                        onChange={(event) =>
                          updateBusinessForm(
                            businessId,
                            "description",
                            event.target.value,
                          )
                        }
                        rows={3}
                      />
                    </label>

                    <div className="vendor-change-form-grid">
                      <label>
                        Contact number
                        <input
                          value={businessForm.contact}
                          onChange={(event) =>
                            updateBusinessForm(
                              businessId,
                              "contact",
                              event.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        Email address
                        <input
                          type="email"
                          value={businessForm.email}
                          onChange={(event) =>
                            updateBusinessForm(
                              businessId,
                              "email",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>

                    <label>
                      Business address
                      <input
                        value={businessForm.address}
                        onChange={(event) =>
                          updateBusinessForm(
                            businessId,
                            "address",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <div className="vendor-change-form-grid">
                      <label>
                        City / District
                        <input
                          value={businessForm.city_district}
                          onChange={(event) =>
                            updateBusinessForm(
                              businessId,
                              "city_district",
                              event.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        Business hours
                        <input
                          value={businessForm.business_hours}
                          onChange={(event) =>
                            updateBusinessForm(
                              businessId,
                              "business_hours",
                              event.target.value,
                            )
                          }
                          placeholder="e.g. Mon-Fri, 9am-5pm"
                        />
                      </label>
                    </div>

                    {actionErrors[businessId] && (
                      <p className="vendor-change-error" role="alert">
                        {actionErrors[businessId]}
                      </p>
                    )}

                    {actionSuccess[businessId] && (
                      <p className="vendor-change-success" role="status">
                        <CheckCircle size={17} />
                        {actionSuccess[businessId]}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="vendor-change-button"
                      disabled={savingBusiness === businessId}
                    >
                      {savingBusiness === businessId
                        ? "Saving..."
                        : "Save Business Changes"}
                    </button>
                  </form>
                </section>

                {/* UPLOAD A NEW DOCUMENT */}
                <section className="vendor-change-section">
                  <h3>
                    <FileText size={19} />
                    Upload New Business Document
                  </h3>

                  <p className="vendor-change-section-description">
                    Upload a new registration, tax, or other document.
                  </p>

                  <form
                    className="vendor-change-form"
                    onSubmit={(event) =>
                      handleNewDocumentUpload(event, businessId)
                    }
                  >
                    <label>
                      Document type
                      <select
                        value={
                          newFiles[businessId]?.type ?? "REGISTRATION"
                        }
                        onChange={(event) =>
                          setNewFiles((previous) => ({
                            ...previous,
                            [businessId]: {
                              file: previous[businessId]?.file ?? null,
                              type: event.target.value as DocumentType,
                            },
                          }))
                        }
                      >
                        <option value="REGISTRATION">
                          Business Registration
                        </option>
                        <option value="TAX">Tax Document</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>

                    <label>
                      Choose document
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(event) =>
                          setNewFiles((previous) => ({
                            ...previous,
                            [businessId]: {
                              file: event.target.files?.[0] ?? null,
                              type:
                                previous[businessId]?.type ??
                                "REGISTRATION",
                            },
                          }))
                        }
                        required
                      />
                    </label>

                    {newFiles[businessId]?.file && (
                      <p className="vendor-change-selected-file">
                        Selected: {newFiles[businessId].file?.name}
                      </p>
                    )}

                    {actionErrors[`upload-${businessId}`] && (
                      <p className="vendor-change-error" role="alert">
                        {actionErrors[`upload-${businessId}`]}
                      </p>
                    )}

                    {actionSuccess[`upload-${businessId}`] && (
                      <p className="vendor-change-success" role="status">
                        <CheckCircle size={17} />
                        {actionSuccess[`upload-${businessId}`]}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="vendor-change-button"
                      disabled={uploadingBusiness === businessId}
                    >
                      <Upload size={17} />
                      {uploadingBusiness === businessId
                        ? "Uploading..."
                        : "Upload Document"}
                    </button>
                  </form>
                </section>

                {/* EXISTING DOCUMENTS AND RESUBMISSION */}
                {documents.length > 0 && (
                  <section className="vendor-change-section">
                    <h3>Existing Business Documents</h3>

                    <div className="vendor-change-documents">
                      {documents.map((document, documentIndex) => {
                        const documentId = getDocumentId(document);
                        const documentKey = documentId || String(documentIndex);

                        const needsCorrection = [
                          "REJECTED",
                          "NEEDS_CORRECTION",
                          "CORRECTION_REQUIRED",
                        ].includes(
                          String(
                            document.verification_status ??
                              document.status ??
                              "",
                          ).toUpperCase(),
                        );

                        return (
                          <div
                            className="vendor-change-document"
                            key={documentKey}
                          >
                            <div className="vendor-change-document-info">
                              <FileText size={20} />
                              <div>
                                <strong>
                                  {document.name ||
                                    document.document_type ||
                                    "Business Document"}
                                </strong>
                                <span>
                                  {document.verification_status ||
                                    document.status ||
                                    "Submitted"}
                                </span>
                              </div>
                            </div>

                            {document.file && (
                              <a
                                href={document.file}
                                target="_blank"
                                rel="noreferrer"
                                className="vendor-change-document-link"
                              >
                                View document
                              </a>
                            )}

                            {needsCorrection && documentId && (
                              <form
                                className="vendor-change-form vendor-document-resubmit"
                                onSubmit={(event) =>
                                  handleDocumentResubmit(
                                    event,
                                    documentId,
                                  )
                                }
                              >
                                <label>
                                  Upload corrected document
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    required
                                    onChange={(event) =>
                                      setResubmitFiles((previous) => ({
                                        ...previous,
                                        [documentId]:
                                          event.target.files?.[0] ??
                                          null,
                                      }))
                                    }
                                  />
                                </label>

                                {actionErrors[`document-${documentId}`] && (
                                  <p
                                    className="vendor-change-error"
                                    role="alert"
                                  >
                                    {
                                      actionErrors[
                                        `document-${documentId}`
                                      ]
                                    }
                                  </p>
                                )}

                                {actionSuccess[
                                  `document-${documentId}`
                                ] && (
                                  <p
                                    className="vendor-change-success"
                                    role="status"
                                  >
                                    <CheckCircle size={17} />
                                    {
                                      actionSuccess[
                                        `document-${documentId}`
                                      ]
                                    }
                                  </p>
                                )}

                                <button
                                  type="submit"
                                  className="vendor-change-button"
                                  disabled={
                                    resubmittingDocument ===
                                    documentId
                                  }
                                >
                                  <Upload size={17} />
                                  {resubmittingDocument === documentId
                                    ? "Resubmitting..."
                                    : "Resubmit Corrected Document"}
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* VENDOR RESPONSE TO ADMIN */}
                <section className="vendor-change-section">
                  <h3>
                    <Send size={19} />
                    Respond to Administrator
                  </h3>

                  <p className="vendor-change-section-description">
                    Explain the corrections you have made and submit your
                    business for review.
                  </p>

                  <form
                    className="vendor-change-form"
                    onSubmit={(event) =>
                      handleVendorResponse(event, businessId)
                    }
                  >
                    <label>
                      Your response
                      <textarea
                        value={responses[businessId] ?? ""}
                        onChange={(event) => {
                          setResponses((previous) => ({
                            ...previous,
                            [businessId]: event.target.value,
                          }));
                          clearMessages(`response-${businessId}`);
                        }}
                        rows={5}
                        maxLength={2000}
                        required
                        placeholder="Explain the corrections you made or documents you uploaded..."
                      />
                    </label>

                    <div className="vendor-change-character-count">
                      {(responses[businessId] ?? "").length}/2000
                      characters
                    </div>

                    {actionErrors[`response-${businessId}`] && (
                      <p className="vendor-change-error" role="alert">
                        {actionErrors[`response-${businessId}`]}
                      </p>
                    )}

                    {actionSuccess[`response-${businessId}`] && (
                      <p className="vendor-change-success" role="status">
                        <CheckCircle size={17} />
                        {actionSuccess[`response-${businessId}`]}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="vendor-change-button"
                      disabled={sendingResponse === businessId}
                    >
                      <Send size={17} />
                      {sendingResponse === businessId
                        ? "Submitting..."
                        : "Submit Response for Review"}
                    </button>
                  </form>
                </section>
              </article>
            );
          })}
        </div>
      </main>
    </VendorLayout>
  );
}
