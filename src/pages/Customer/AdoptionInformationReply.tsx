
import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import "./AdoptionInformation.css";

interface AdoptionInformationReplyProps {
  applicationId: string;
  petName: string;
  vendorQuestions: string[];
  previousReply?: string;
  onSubmitReply: (
    applicationId: string,
    reply: string
  ) => Promise<void>;
}

export default function AdoptionInformationReply({
  applicationId,
  petName,
  vendorQuestions,
  previousReply = "",
  onSubmitReply,
}: AdoptionInformationReplyProps) {
  const [reply, setReply] = useState(previousReply);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!reply.trim()) {
      setError("Please enter your response.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await onSubmitReply(applicationId, reply.trim());
      setSuccess("Your response has been submitted successfully.");
    } catch {
      setError("Unable to submit your response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="adoption-info-card">
      <div className="adoption-info-heading">
        <MessageCircle size={23} />
        <div>
          <h3>Additional Information Required</h3>
          <p>
            The vendor needs more information about your
            application for {petName}.
          </p>
        </div>
      </div>

      <div className="existing-questions">
        <h4>Questions from your vendor</h4>

        {vendorQuestions.length > 0 ? (
          <ol>
            {vendorQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        ) : (
          <p>No additional questions have been received.</p>
        )}
      </div>

      <div className="question-form">
        <label htmlFor="customer-reply">
          Your Response
        </label>

        <textarea
          id="customer-reply"
          rows={6}
          placeholder="Please answer the vendor's questions here..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          type="button"
          className="send-questions-btn"
          onClick={handleSubmit}
          disabled={loading || vendorQuestions.length === 0}
        >
          <Send size={17} />
          {loading ? "Submitting..." : "Submit Response"}
        </button>
      </div>
    </section>
  );
}
