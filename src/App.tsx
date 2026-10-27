import LandingPage from "./pages/Customer/CustomerLandingPage";
import CustomerDashboardLayout from "./pages/Customer/CustomerDashboard";
import CustomerPetCataloguePage from "./pages/Customer/CustomerPetCataloguePage";
import RegistrationPage from "./pages/Customer/RegistrationPage";
import ProfilePage from "./pages/Customer/CustomerProfilePage";
import CustomerVendorProfilePage from "./pages/Customer/CustomerVendorProfilePage";
import CustomerVendorsPage from "./pages/Customer/CustomerVendorsPage";
import EditProfilePage from "./pages/Customer/EditProfilePage";
import CustomerLoginPage from "./pages/Customer/CustomerLoginPage";
import ForgotPasswordPage from "./pages/Customer/ForgotPasswordPage";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";
import BusinessRegistrationForm from "./components/BusinessRegistrationForm/BusinessRegistrationForm";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorDashboardPage from "./pages/Vendor/VendorDashboardPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import PrivacyPage from "./pages/PrivacyPage";
import VendorAddPetPage from "./pages/Vendor/VendorAddPetPage";
import VendorAddServicePage from "./pages/Vendor/VendorAddServicePage";
import VendorCataloguePage from "./pages/Vendor/VendorCataloguePage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import DocumentUpload from "./pages/Vendor/DocumentUpload";
import VendorBusinessProfilePage from "./pages/Vendor/VendorBusinessProfilePage";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ExplorePets from "./pages/Customer/ExplorePets";
import PetsDetailPage from "./pages/Customer/PetsDetailPage";
import VendorCategorySelector from "./pages/Vendor/VendorCategorySelector";
import VendorLayout from "./layouts/VendorLayout/VendorLayout";
import { Route } from "react-router-dom";
function App() {
  const path = window.location.pathname;

  if (path === "/customer/dashboard") {
    return <CustomerDashboardLayout />;
  }

  if (path === "/explore-pets" || path === "/explore-pets/") {
    return <ExplorePets />;
  }

  if (path === "/pets" || path === "/pets/") {
    return <CustomerPetCataloguePage />;
  }

  if (path === "/terms-and-conditions") {
    return <TermsAndConditionsPage />;
  }
  if (path === "/privacy") {
    return <PrivacyPage />;
  }
  <Route path="/pets/:petId" element={<PetsDetailPage />} />;
  if (path === "/vendor/login" || path === "/vendor-login") {
    return <VendorLoginPage />;
  }

  if (path === "/vendor") {
    return <VendorLandingPage />;
  }

  if (path === "/vendors" || path === "/vendors/") {
    return <CustomerVendorsPage />;
  }

  if (path.startsWith("/vendors/")) {
    return <CustomerVendorProfilePage />;
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

  if (path === "/vendor/services/new") {
    return <VendorAddServicePage />;
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
    return <VendorRegistrationPage />;
  }

  if (path === "/vendor/business-profile") {
    return <VendorBusinessProfilePage />;
  }

  if (path === "/vendor/categories") {
    return (
      <VendorLayout
        title="Vendor Categories"
        description="Manage your pet categories and listings."
      >
        <VendorCategorySelector />
      </VendorLayout>
    );
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

  if (path === "/verify-email") {
    return <VerifyEmailPage />;
  }

  if (path === "/reset-password" || path === "/reset-password/") {
    return <ResetPasswordForm />;
  }

  if (path.startsWith("/vendor/")) {
    return <VendorDashboardPage />;
  }

  return <LandingPage />;
}
export default App;
