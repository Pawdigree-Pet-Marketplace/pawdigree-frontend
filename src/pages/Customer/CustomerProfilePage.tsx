import { useEffect, useState } from "react";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import ProfileCard from "../../components/profile/ProfileCard";
import ProfileMenu from "../../components/profile/ProfileMenu";
import type { Profile } from "../../data/profile";
import API_BASE_URL from "../../services/api";
import "./CustomerProfilePage.css";

type CustomerProfileResponse = {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export default function ProfilePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      if (!token) {
        setError("Please log in to view your profile.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        <h1 className="profile-title">Profile</h1>

        {isLoading && <p role="status">Loading your profile...</p>}

        {!isLoading && error && (
          <p role="alert">
            {error}{" "}
            {error.includes("log in") && (
              <a href="/customer-login">Log in</a>
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
      </main>

      <BottomNavbar />
    </>
  );
}
