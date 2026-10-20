import LandingPage from "./pages/Customer/CustomerLandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import ProfilePage from "./pages/Customer/CustomerProfilePage";
import EditProfilePage from "./pages/Customer/EditProfilePage";
import CustomerLoginPage from "./pages/Customer/CustomerLoginPage";
import VendorRegistrationForm from "./components/VendorRegistrationForm/VendorRegistrationForm";
import ForgotPasswordPage from "./pages/Customer/ForgotPasswordPage";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";
import BusinessRegistrationForm from "./components/BusinessRegistrationForm/BusinessRegistrationForm";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorDashboardPage from "./pages/Vendor/VendorDashboardPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import VendorAddPetPage from "./pages/Vendor/VendorAddPetPage";
import VendorCataloguePage from "./pages/Vendor/VendorCataloguePage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import DocumentUpload from './pages/Vendor/DocumentUpload';
function App() {
  const path = window.location.pathname;

  if (path === "/terms-and-conditions") {
    return <TermsAndConditionsPage />;
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

  if (path === "/vendor/listings") {
    return <VendorCataloguePage />;
  }

  if (path === "/vendor/listings/new") {
    return <VendorAddPetPage />;
  }

  if (path.startsWith("/vendor/edit-pet/")) {
    return <VendorEditPetListing />;
  }

  if (path === "/vendor") {
    return <VendorLandingPage />;
  }
  if (path === "/vendor/documents") {
  return <DocumentUpload />;
}

  if (path === "/business-registration") {
    return <BusinessRegistrationForm />;
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
  <a href="/" className="document-brand" aria-label="Pawdigree home">
  <img src="/logo.png" alt="Pawdigree" />
</a>
  
}
export default App;
