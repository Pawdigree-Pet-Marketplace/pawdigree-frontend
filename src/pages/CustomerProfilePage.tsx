import { useState } from "react";
import TopNavbar from "../components/navigation/CustomerTopNavbar/CustomerTopNavbar";
import SideMenu from "../components/navigation/CustomerSideMenu/CustomerSideMenu";
import BottomNavbar from "../components/navigation/CustomerBottomNavbar/CustomerBottomNavbar";
import ProfileCard from "../components/profile/ProfileCard";
import ProfileMenu from "../components/profile/ProfileMenu";
import { loadProfile } from "../data/profile";
import "./CustomerProfilePage.css";

export default function ProfilePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profile] = useState(loadProfile);

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

        <div className="profile-layout">
          <ProfileCard profile={profile} />

          <div className="profile-side">
            <ProfileMenu />
          </div>
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
