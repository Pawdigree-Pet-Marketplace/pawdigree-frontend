
import { useState } from "react";
import { MessageCircle, Send, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdoptionMessagingError } from "../../services/adoptionInfoApi";
import "../../pages/Vendor/AdoptionInformation.css";

interface AdoptionInformationRequestProps {
  applicationId: string;
  petName: string;
  applicantName: string;
  questions?: string[];
  onSubmitQuestions: (
    applicationId: string,
    questions: string[]
  ) => Promise<void>;
}

export default function AdoptionInformationRequest({
  applicationId,
  petName,
  applicantName,
  questions = [],
  onSubmitQuestions,
}: AdoptionInformationRequestProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [newQuestions, setNewQuestions] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addQuestion = () => {
    setNewQuestions([...newQuestions, ""]);
  };

  const updateQuestion = (index: number, value: string) => {
    setNewQuestions((previous) =>
      previous.map((question, i) =>
        i === index ? value : question
      )
    );
  };

  const removeQuestion = (index: number) => {
    setNewQuestions((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    const validQuestions = newQuestions
      .map((question) => question.trim())
      .filter(Boolean);

    if (validQuestions.length === 0) {
      setError("Please enter at least one question.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await onSubmitQuestions(applicationId, validQuestions);
      setSuccess("Your questions have been sent to the applicant.");
      setNewQuestions([""]);
    } catch (reason) {
      if (reason instanceof AdoptionMessagingError && reason.status === 401) {
        navigate("/vendor/login", { replace: true, state: { from: location } });
      }
      setError(reason instanceof Error ? reason.message : "Unable to send questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="adoption-info-card">
      <div className="adoption-info-heading">
        <MessageCircle size={23} />
        <div>
          <h3>Request More Information</h3>
          <p>
            Application for {petName} by {applicantName}
          </p>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="existing-questions">
          <h4>Previously requested questions</h4>
          {questions.map((question, index) => (
            <p key={index}>
              {index + 1}. {question}
            </p>
          ))}
        </div>
      )}

      <div className="question-form">
        <h4>Your Questions</h4>
        <p>
          Ask the applicant for any additional information
          you need before making your adoption decision.
        </p>

        {newQuestions.map((question, index) => (
          <div className="question-input-row" key={index}>
            <input
              type="text"
              placeholder={`Enter question ${index + 1}`}
              value={question}
              onChange={(e) =>
                updateQuestion(index, e.target.value)
              }
            />

            {newQuestions.length > 1 && (
              <button
                type="button"
                className="remove-question"
                onClick={() => removeQuestion(index)}
                aria-label="Remove question"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="add-question-btn"
          onClick={addQuestion}
        >
          <Plus size={17} /> Add another question
        </button>

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        <button
          type="button"
          className="send-questions-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Send size={17} />
          {loading ? "Sending..." : "Send Questions"}
        </button>
      </div>
    </section>
  );
}
