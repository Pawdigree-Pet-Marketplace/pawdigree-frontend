import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

type BackButtonProps = {
  label?: string;
  /** Where to go if there is no previous page in the app */
  fallback?: string;
  /** Use this when "back" means something specific, like a step in a form */
  onClick?: () => void;
};

export default function BackButton({
  label = "Back",
  fallback = "/",
  onClick,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button type="button" className="back-button" onClick={handleClick}>
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
