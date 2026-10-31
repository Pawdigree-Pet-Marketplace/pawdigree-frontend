
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EditProfileForm from "../../components/profile/EditProfileForm";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import type { ProfileFormValues } from "../../utils/validateProfile";
import { customerAuthenticatedFetch } from "../../services/customerAuthenticatedFetch";
import { getSessionToken } from "../../services/auth/authStorage";
import "./CustomerProfilePage.css";


type CustomerProfileResponse = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const token = getSessionToken();

      if (!token) {
        setError("Please log in to edit your profile.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await customerAuthenticatedFetch("/api/auth/profile/", {
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "Your session may have expired. Please log in again."
              : "We couldn't load your profile. Please try again.",
          );
        }

        const data: CustomerProfileResponse = await response.json();

        if (!cancelled) {
          setProfile({
            fullName:
              `${data.first_name} ${data.last_name}`.trim() || data.username,
            email: data.email,
            phone: data.phone || "",
            location: "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading your profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (values: ProfileFormValues) => {
    const token = getSessionToken();

    if (!token) {
      setError("Please log in again before saving your profile.");
      return;
    }

    const nameParts = values.fullName.trim().split(/\s+/);
    const firstName = nameParts.shift() ?? "";
    const lastName = nameParts.join(" ");

    setIsSaving(true);
    setError("");

    try {
      const response = await customerAuthenticatedFetch("/api/auth/profile/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: values.email.trim(),
          phone: values.phone.trim(),
        }),
      });

      if (!response.ok) {
        const data: unknown = await response.json().catch(() => null);

        let message = "We couldn't save your changes. Please try again.";

        if (data && typeof data === "object") {
          const details = data as Record<string, unknown>;

          for (const key of ["email", "phone", "detail", "username"]) {
            const value = details[key];

            if (typeof value === "string" && value) {
              message = value;
              break;
            }

            if (
              Array.isArray(value) &&
              typeof value[0] === "string"
            ) {
              message = value[0];
              break;
            }
          }
        }

        throw new Error(message);
      }

      navigate("/profile");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TopNavbar
        isLoggedIn
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />

      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="container profile-page">
        <div className="edit-wrap">
          <Link to="/profile" className="edit-back">
            <ArrowLeft size={18} aria-hidden="true" />
            Back to profile
          </Link>

          <h1 className="profile-title">Edit profile</h1>

          {isLoading && <p role="status">Loading your profile...</p>}

          {!isLoading && error && !profile && (
            <p role="alert">
              {error}{" "}
              {error.toLowerCase().includes("log in") && (
                <Link to="/customer-login">Log in</Link>
              )}
            </p>
          )}

          {!isLoading && profile && (
            <>
              {error && <p role="alert">{error}</p>}

              <section className="edit-card">
                <EditProfileForm
                  initialValues={profile}
                  onSubmit={handleSubmit}
                  cancelHref="/profile"
                />

                {isSaving && (
                  <p role="status">Saving your changes...</p>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
