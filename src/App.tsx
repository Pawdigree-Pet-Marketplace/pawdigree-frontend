import { useState } from "react";
import TopNavbar from "./components/navigation/TopNavbar/TopNavbar";
import SideMenu from "./components/navigation/SideMenu/SideMenu";
import BottomNavbar from "./components/navigation/BottomNavbar/BottomNavbar";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn] = useState(false); // youcan change to true to test thr logged-in state

  return (
    <>
      <TopNavbar
        isLoggedIn={isLoggedIn}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <SideMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        isLoggedIn={isLoggedIn}
        onClose={() => setIsMenuOpen(false)}
      />
      <main style={{ padding: "40px 20px", minHeight: "80vh" }}>
        <h1>Testing sample text</h1>
        <p>Resize to phone to test the responsiveness.</p>
      </main>
      <BottomNavbar />
    </>
  );
}

export default App;
