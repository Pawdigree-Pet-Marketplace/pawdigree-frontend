import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import VendorRegistrationForm from "./components/VendorRegistrationForm/VendorRegistrationForm";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VendorRegistrationPage from "./pages/VendorRegistrationPage";

function App() {
  const path = window.location.pathname;

  if (path === "/vendor-registration") {
    return <VendorRegistrationForm />;
  }
  if (
    path.startsWith("/vendor/register") ||
    path.startsWith("/register.vendor")
  ) {
    return <VendorRegistrationPage />;
  }

  if (path === "/registration") {
    return <RegistrationPage />;
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

  if (path === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  return <LandingPage />;
}

export default App;
