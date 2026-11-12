
export interface AdoptionInfoMessage {
  id?: string;
  message: string;
  sender?: string;
  created_at?: string;
}

export interface AdoptionInfoApplication {
  application_id: string;
  status: string;
  info_messages: AdoptionInfoMessage[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://pawdigree-bckd.onrender.com";

async function sendInfoMessage(
  applicationId: string,
  action: "request-info" | "reply",
  message: string,
  token: string
): Promise<AdoptionInfoApplication> {
  const response = await fetch(
    `${API_BASE_URL}/api/adoptions/applications/${applicationId}/${action}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    throw new Error("Unable to send adoption information message");
  }

  return response.json();
}

export function requestAdoptionInfo(
  applicationId: string,
  message: string,
  token: string
) {
  return sendInfoMessage(
    applicationId,
    "request-info",
    message,
    token
  );
}

export function replyToAdoptionInfo(
  applicationId: string,
  message: string,
  token: string
) {
  return sendInfoMessage(
    applicationId,
    "reply",
    message,
    token
  );
}
