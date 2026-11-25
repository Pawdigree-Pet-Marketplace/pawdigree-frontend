import { useState } from "react";
import { Send } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import type { AdoptionInfoMessage as InfoMessage } from "../../services/adoptionInfoApi";
import { AdoptionMessagingError } from "../../services/adoptionInfoApi";
import "./AdoptionInformation.css";

interface AdoptionInformationReplyProps {
  applicationId: string;
  petName: string;
  vendorQuestions: string[];
  messages: InfoMessage[];
  canReply?: boolean;
  onSubmitReply: (
    applicationId: string,
    reply: string
  ) => Promise<void>;
}

export default function AdoptionInformationReply({
  applicationId,
  petName,
  messages,
  canReply = true,
  onSubmitReply,
}: AdoptionInformationReplyProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedReply = reply.trim();

    if (!trimmedReply) {
      setError("Please enter a message.");
      return;
    }

    setSending(true);
    setError("");

    try {
      await onSubmitReply(applicationId, trimmedReply);
      setReply("");
    } catch (err) {
      if (err instanceof AdoptionMessagingError && err.status === 401) {
        navigate("/login", { replace: true, state: { from: location } });
      }
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your reply."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="adoption-conversation">
      <div className="conversation-messages">
        {messages.length === 0 ? (
          <p className="conversation-empty">
            No messages yet. Vendor communication will
            appear here.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`conversation-message ${
                message.kind === "REQUEST"
                  ? "vendor-message"
                  : "customer-message"
              }`}
            >
              <span className="conversation-sender">
                {message.kind === "REQUEST"
                  ? "Vendor"
                  : "You"}
              </span>

              <p>{message.body}</p>

              <time>
                {message.created_at
                  ? new Date(message.created_at).toLocaleString()
                  : ""}
              </time>
            </div>
          ))
        )}
      </div>

      {canReply ? <form
        className="conversation-reply-form"
        onSubmit={handleSubmit}
      >
        <label htmlFor={`reply-${applicationId}`}>
          Reply about {petName}
        </label>

        <textarea
          id={`reply-${applicationId}`}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Type your response to the vendor..."
          maxLength={2000}
          rows={3}
          disabled={sending}
        />

        <div className="reply-form-footer">
          <span>{reply.length}/2000 characters</span>

          <button
            type="submit"
            disabled={sending || !reply.trim()}
          >
            <Send size={16} />
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>

        {error && (
          <p className="conversation-error">{error}</p>
        )}
      </form> : messages.length > 0 ? <p className="conversation-closed">Replies are unavailable for this application status.</p> : null}
    </div>
  );
}
