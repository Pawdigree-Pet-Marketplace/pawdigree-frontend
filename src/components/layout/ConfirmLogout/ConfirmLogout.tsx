
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../services/api";
import { clearAuthSession, getSessionToken } from "../../../services/auth/authStorage";
import "./ConfirmLogout.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ConfirmLogout = ({ isOpen, onClose }: Props) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleLogout = async () => {
    const accessToken = getSessionToken();

    const refreshToken =
      localStorage.getItem("refresh") ||
      sessionStorage.getItem("refresh");

    try {
      if (accessToken && refreshToken) {
        await apiRequest("/auth/logout/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      clearAuthSession();
      const userKeys = [
        "user_email",
        "user_name",
        "user_picture",
        "username",
        "first_name",
      ];

      userKeys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      onClose();
      navigate("/", { replace: true });
    }
  };

  return (
    <div
      className="confirm-logout-overlay"
      onClick={onClose}
    >
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
          <button
            className="confirm-logout-btn cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="confirm-logout-btn confirm"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};
