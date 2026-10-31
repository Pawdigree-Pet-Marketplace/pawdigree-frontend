import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

type BackButtonProps = {
  fallback: string;
  label?: string;
};

export default function BackButton({
  fallback,
  label = "Back",
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (window.history.state?.idx > 0) {
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
