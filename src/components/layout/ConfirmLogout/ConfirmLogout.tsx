import { LogOut } from "lucide-react";
import "./ConfirmLogout.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ConfirmLogout = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.clear();
    onClose();
    window.location.href = "/";
  };

  return (
    <div className="confirm-logout-overlay" onClick={onClose}>
      <div
        className="confirm-logout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-logout-icon">
          <LogOut size={24} />
        </div>
        <h3 className="confirm-logout-title">Log out?</h3>
        <p className="confirm-logout-text">
          You’ll need to sign in again to access your account.
        </p>
        <div className="confirm-logout-actions">
          <button className="confirm-logout-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-logout-btn confirm" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
