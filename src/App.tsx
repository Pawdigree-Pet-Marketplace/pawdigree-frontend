import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import CustomerLoginPage from "./pages/CustomerLoginPage";

function App() {
  const path = window.location.pathname;

  if (path === "/registration") {
    return <RegistrationPage />;
  }

  if (path.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }

  if (path === "/profile") {
    return <ProfilePage />;
  }

  if (path === "/profile/edit") {
    return <EditProfilePage />;
  }

  if (path === "/login" || path === "/customer-login") {
    return <CustomerLoginPage />;
  }

  return <LandingPage />;
}

export default App;
