import { useState } from "react";
import { Download, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../../services/api";
import { vendorAuthenticatedFetch } from "../../services/vendorAuthenticatedFetch";
import { useVendorBusiness } from "../../services/vendorBusinessStore";
import { vendorBusinessPath } from "../../services/vendorBusinessRoutes";

type FailedRow = { row: number; errors: Record<string, unknown> };
type UploadResponse = { created?: number; failed?: FailedRow[]; file?: string[] };

function errorText(value: unknown): string {
  if (Array.isArray(value)) return value.map(errorText).join(" ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, item]) => `${key}: ${errorText(item)}`).join("; ");
  return String(value ?? "");
}

export default function VendorPetBulkUpload() {
  const activeBusiness = useVendorBusiness();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResponse | null>(null);
  const fileTooLarge = Boolean(file && file.size >= 5 * 1024 * 1024);

  async function downloadTemplate() {
    setDownloading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets/bulk-upload/template/`);
      if (!response.ok) throw new Error(`Template download failed (${response.status}).`);
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "pet_listings_template.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not download the CSV template.");
    } finally {
      setDownloading(false);
    }
  }

  async function uploadFile() {
    if (!file) return;
    setError("");
    setResult(null);
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Choose a CSV file."); return; }
    if (fileTooLarge) { setError("CSV files must be under 5 MB."); return; }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await vendorAuthenticatedFetch(`${API_BASE_URL}/api/pets/bulk-upload/`, { method: "POST", body: formData });
      const payload = await response.json().catch(() => null) as UploadResponse | null;
      if (!response.ok) throw new Error(payload?.file?.map(errorText).join(" ") || errorText(payload) || `Upload failed (${response.status}).`);
      setResult(payload ?? { created: 0, failed: [] });
      setFile(null);
      const input = document.getElementById("vendor-pet-bulk-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload the CSV file.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="pet-form-section pet-bulk-upload" aria-labelledby="pet-bulk-upload-title">
      <div className="pet-section-heading">
        <span className="pet-section-icon"><FileSpreadsheet size={20} /></span>
        <div><h2 id="pet-bulk-upload-title">Bulk upload pet listings</h2><p>Use the existing CSV uploader to submit multiple pet listings at once.</p></div>
      </div>
      <div className="pet-bulk-guidance">
        <p>Upload a UTF-8 CSV under 5 MB with up to 200 data rows. Each row uses the same validation as an individual listing.</p>
        <p>Required columns: <strong>listing_type, name, species, age, gender, size</strong>. Add <strong>business_id</strong> when your account has multiple approved pet businesses.</p>
        <p>Images are not supported in CSV uploads. Add listing photos from the individual listing form after using this bulk upload.</p>
      </div>
      <div className="pet-bulk-actions">
        <button type="button" className="pet-cancel-button" disabled={downloading} onClick={() => void downloadTemplate()}>
          {downloading ? <LoaderCircle className="pet-spinner" size={16} /> : <Download size={16} />}
          Download CSV template
        </button>
        <label className="pet-bulk-file-label" htmlFor="vendor-pet-bulk-file">{file ? file.name : "Choose a CSV file"}</label>
        <input id="vendor-pet-bulk-file" type="file" accept=".csv,text/csv" onChange={(event) => { const selected = event.currentTarget.files?.[0] ?? null; setFile(selected); setError(""); setResult(null); }} />
        <button type="button" className="pet-submit-button" disabled={!file || fileTooLarge || uploading} onClick={() => void uploadFile()}>
          {uploading ? <><LoaderCircle className="pet-spinner" size={17} /> Uploading…</> : <><Upload size={16} /> Upload CSV</>}
        </button>
      </div>
      {fileTooLarge && <p className="pet-form-message error" role="alert">CSV files must be under 5 MB.</p>}
      {error && <p className="pet-form-message error" role="alert">{error}</p>}
      {result && <div className="pet-bulk-result" role="status">
        <strong>{result.created ?? 0} listings created.</strong>
        {result.failed?.length ? <p>{result.failed.length} row{result.failed.length === 1 ? "" : "s"} need attention. Correct the listed values and upload again:</p> : <p>All rows were accepted. Listings may need admin approval before appearing publicly.</p>}
        {result.failed?.length ? <ul>{result.failed.map((item) => <li key={item.row}><strong>Row {item.row}:</strong> {Object.entries(item.errors).map(([field, message]) => `${field} ${errorText(message)}`).join("; ")}</li>)}</ul> : null}
        <Link to={activeBusiness ? vendorBusinessPath(String(activeBusiness.id), "listings") : "/vendor/listings"}>View pet listings</Link>
      </div>}
    </section>
  );
}
