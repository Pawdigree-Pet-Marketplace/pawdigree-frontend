import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import VendorRegistrationForm from "./components/VendorRegistrationForm/VendorRegistrationForm";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VendorRegistrationPage from "./pages/VendorRegistrationPage";
import VendorLandingPage from "./pages/VendorLandingPage";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import VendorLoginPage from "./pages/VendorLoginPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

function App() {
  const path = window.location.pathname;
  if (path === "/terms") {
    return <TermsPage />;
  }

  if (path === "/privacy") {
    return <PrivacyPage />;
  }
  if (path === "/vendor/login" || path === "/vendor-login") {
    return <VendorLoginPage />;
  }
  if (path === "/vendor/dashboard") {
    return <VendorDashboardPage />;
  }
  if (path === "/vendor") {
    return <VendorLandingPage />;
  }
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
