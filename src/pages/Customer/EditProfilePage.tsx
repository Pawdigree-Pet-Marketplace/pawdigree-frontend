import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import EditProfileForm from "../../components/profile/EditProfileForm";
import TopNavbar from "../../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import { loadProfile, saveProfile } from "../../data/profile";
import type { ProfileFormValues } from "../../utils/validateProfile";
import "./CustomerProfilePage.css";

export default function EditProfilePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile] = useState(loadProfile);

  // TODO: send the changes to the backend API instead of local storage
  const handleSubmit = (values: ProfileFormValues) => {
    saveProfile({ ...profile, ...values });
    window.location.href = "/profile";
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
          <a href="/profile" className="edit-back">
            <ArrowLeft size={18} aria-hidden="true" /> Back to profile
          </a>

          <h1 className="profile-title">Edit profile</h1>

          <section className="edit-card">
            <EditProfileForm
              initialValues={{
                fullName: profile.fullName,
                email: profile.email,
                phone: profile.phone,
                location: profile.location,
              }}
              onSubmit={handleSubmit}
              cancelHref="/profile"
            />
          </section>
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
