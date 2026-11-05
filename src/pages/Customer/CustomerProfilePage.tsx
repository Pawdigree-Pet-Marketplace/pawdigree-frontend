import { useEffect, useState } from "react";
import { Bone, PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileCard from "../../components/profile/ProfileCard";
import ProfileMenu from "../../components/profile/ProfileMenu";
import type { Profile } from "../../data/profile";
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const token = getSessionToken();

      if (!token) {
        setError("Please log in to view your profile.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await customerAuthenticatedFetch("/api/auth/profile/", {
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              "Your session may have expired. Please log in again.",
            );
          }

          throw new Error("We couldn't load your profile. Please try again.");
        }

        const data: CustomerProfileResponse = await response.json();

        if (!cancelled) {
          const fullName =
            `${data.first_name} ${data.last_name}`.trim() || data.username;

          setProfile({
            fullName,
            email: data.email,
            phone: data.phone || "",
            location: "",
            verified: false,
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

  return (
    <main className="customer-dashboard profile-page">
      <header className="profile-hero">
        <div className="profile-hero-decor" aria-hidden="true">
          <Bone className="profile-hero-bone" />
          <PawPrint className="profile-hero-paw" />
          <span className="profile-hero-dot" />
        </div>
        <p className="dashboard-eyebrow">YOUR PAWDIGREE ACCOUNT</p>
        <h1 className="profile-title">Profile</h1>
        <p>View and manage your personal information and account settings.</p>
      </header>

      <section className="profile-content" aria-label="Profile information">
        {isLoading && <p role="status">Loading your profile...</p>}

        {!isLoading && error && (
          <p role="alert">
            {error}{" "}
            {error.includes("log in") && (
              <Link to="/customer-login">Log in</Link>
            )}
          </p>
        )}

        {!isLoading && profile && (
          <div className="profile-layout">
            <ProfileCard profile={profile} />

            <div className="profile-side">
              <ProfileMenu />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
