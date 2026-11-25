// Types and helpers for the customer's adoption requests.
// GET /api/adoptions/my-applications/ is read defensively: only application_id,
// pet, status and created_at are relied on. Application answers (home type etc.)
// show when present. Pet name, breed, photo and vendor come from
// GET /api/pets/public/{pet_id}/ (see readPet) and are merged in by the component.

export type RequestStatus = "PENDING" | "INFO_REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
export type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type PetInfo = { name: string; breed: string; image: string; vendorName: string };
export type AdoptionInfoMessage = { id: string | number; kind: "REQUEST" | "REPLY"; body: string; created_at: string };

export type AdoptionRequest = {
  id: string;
  petId: number | null;
  petName: string;
  petBreed: string;
  petImage: string;
  vendorName: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  note: string; // message from the vendor, if the API sends one
  homeType: string;
  hasOutdoorSpace: boolean | null;
  hasOtherPets: boolean | null;
  otherPetsDetails: string;
  experience: string;
  applicationMessage: string; // the customer's "why I want this pet"
  infoMessages: AdoptionInfoMessage[];
};

const STATUSES: RequestStatus[] = ["PENDING", "INFO_REQUESTED", "APPROVED", "REJECTED", "CANCELLED"];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "Pending",
  INFO_REQUESTED: "Info requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const HOME_LABEL: Record<string, string> = { APARTMENT: "Apartment", HOUSE: "House", OTHER: "Other" };
export const EXPERIENCE_LABEL: Record<string, string> = {
  NONE: "First-time owner",
  SOME: "Some experience",
  EXPERIENCED: "Experienced",
};

export const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

/** "Info requested" counts as pending for filtering: the request is still open. */
export function matchesFilter(status: RequestStatus, filter: StatusFilter) {
  if (filter === "ALL") return true;
  if (filter === "PENDING") return status === "PENDING" || status === "INFO_REQUESTED";
  return status === filter;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const bool = (value: unknown) => (typeof value === "boolean" ? value : null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstText(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = text(source[key]);
    if (value) return value;
  }
  return "";
}

/** Reads one pet from /api/pets/public/{id}/ (same shape as a list item). */
export function readPet(raw: unknown): PetInfo {
  const pet = isRecord(raw) ? raw : {};
  let image = firstText(pet, ["image", "primary_image", "photo", "image_url", "thumbnail"]);
  if (!image) {
    const gallery = pet.images ?? pet.photos;
    const first = Array.isArray(gallery) ? gallery[0] : undefined;
    image = typeof first === "string" ? first : isRecord(first) ? firstText(first, ["image", "url", "photo"]) : "";
  }
  return {
    name: firstText(pet, ["name"]),
    breed: firstText(pet, ["breed"]),
    image,
    vendorName: firstText(pet, ["business_name"]),
  };
}

function normalize(raw: unknown): AdoptionRequest | null {
  if (!isRecord(raw)) return null;

  const petObject = isRecord(raw.pet) ? raw.pet : {};
  const petIdValue = isRecord(raw.pet) ? raw.pet.id : raw.pet;
  const petId = typeof petIdValue === "number" ? petIdValue : Number(petIdValue);

  const id = text(raw.application_id) || (typeof raw.id === "number" ? String(raw.id) : text(raw.id));
  if (!id) return null;

  const embedded = isRecord(raw.pet) ? readPet(raw.pet) : null;
  const infoMessages = Array.isArray(raw.info_messages)
    ? raw.info_messages.flatMap((entry, index) => {
        if (!isRecord(entry) || (entry.kind !== "REQUEST" && entry.kind !== "REPLY")) return [];
        const body = text(entry.body);
        if (!body) return [];
        return [{ id: typeof entry.id === "string" || typeof entry.id === "number" ? entry.id : index, kind: entry.kind, body, created_at: text(entry.created_at) } as AdoptionInfoMessage];
      }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  return {
    id,
    petId: Number.isFinite(petId) ? petId : null,
    petName: firstText(raw, ["pet_name"]) || firstText(petObject, ["name"]),
    petBreed: firstText(raw, ["pet_breed"]) || firstText(petObject, ["breed"]),
    petImage: firstText(raw, ["pet_image", "pet_photo"]) || embedded?.image || "",
    vendorName: firstText(raw, ["vendor_name", "business_name"]) || embedded?.vendorName || "",
    status: STATUSES.includes(raw.status as RequestStatus) ? (raw.status as RequestStatus) : "PENDING",
    createdAt: text(raw.created_at),
    updatedAt: text(raw.updated_at) || text(raw.reviewed_at) || text(raw.decided_at),
    note: firstText(raw, ["vendor_note", "vendor_message", "rejection_reason", "reason"]),
    homeType: text(raw.home_type),
    hasOutdoorSpace: bool(raw.has_outdoor_space),
    hasOtherPets: bool(raw.has_other_pets),
    otherPetsDetails: text(raw.other_pets_details),
    experience: text(raw.previous_pet_experience),
    applicationMessage: text(raw.message),
    infoMessages,
  };
}

export function parseRequests(data: unknown): AdoptionRequest[] {
  const list = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data.results) ? data.results : [];
  return list.map(normalize).filter((item): item is AdoptionRequest => item !== null);
}

/** Fills in any pet details the application itself didn't carry. */
export function withPet(request: AdoptionRequest, info: PetInfo | undefined): AdoptionRequest {
  if (!info) return request;
  return {
    ...request,
    petName: request.petName || info.name,
    petBreed: request.petBreed || info.breed,
    petImage: request.petImage || info.image,
    vendorName: request.vendorName || info.vendorName,
  };
}

export function petTitle(request: AdoptionRequest) {
  const name = request.petName || (request.petId !== null ? `Pet #${request.petId}` : "Adoption pet");
  return request.petBreed && request.petName ? `${name} · ${request.petBreed}` : name;
}

export function formatDate(value: string, withTime = false) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export const BANNER: Record<RequestStatus, { title: string; body: string }> = {
  PENDING: {
    title: "Application pending",
    body: "Your request has been sent. The vendor will review it and you’ll see the decision here.",
  },
  INFO_REQUESTED: {
    title: "More information requested",
    body: "The vendor needs a little more information before they can decide on your request.",
  },
  APPROVED: {
    title: "Application approved",
    body: "Great news — the vendor approved your request. Arrange delivery or pickup to welcome your new companion home.",
  },
  REJECTED: {
    title: "Application not approved",
    body: "The vendor couldn’t approve this request. You’re welcome to browse other pets looking for a home.",
  },
  CANCELLED: {
    title: "Application cancelled",
    body: "This request was cancelled, so no further action is needed.",
  },
};

export type TimelineStep = { label: string; meta: string; state: "done" | "current" | "upcoming" | "stopped" };

/** Builds the timeline from the status. Only the submitted date is a real timestamp. */
export function buildTimeline(request: AdoptionRequest): TimelineStep[] {
  const { status } = request;
  const decided = status === "APPROVED" || status === "REJECTED" || status === "CANCELLED";
  const decidedAt = request.updatedAt ? formatDate(request.updatedAt, true) : "";

  const steps: TimelineStep[] = [
    { label: "Application submitted", meta: formatDate(request.createdAt, true), state: "done" },
    {
      label: status === "INFO_REQUESTED" ? "Vendor asked for more information" : "Vendor review",
      meta: decided ? "Completed" : status === "INFO_REQUESTED" ? "Action needed" : "In progress",
      state: decided ? "done" : "current",
    },
  ];

  if (status === "APPROVED") {
    steps.push({ label: "Vendor approved", meta: decidedAt, state: "done" });
    steps.push({ label: "Delivery / pickup", meta: "Waiting for you to arrange", state: "current" });
  } else if (status === "REJECTED") {
    steps.push({ label: "Not approved", meta: decidedAt, state: "stopped" });
  } else if (status === "CANCELLED") {
    steps.push({ label: "Cancelled", meta: decidedAt, state: "stopped" });
  } else {
    steps.push({ label: "Vendor decision", meta: "Waiting", state: "upcoming" });
    steps.push({ label: "Delivery / pickup", meta: "After approval", state: "upcoming" });
  }
  return steps;
}
