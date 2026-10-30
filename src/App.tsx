import { Route, Routes } from "react-router-dom";

import BusinessRegistrationForm from "./components/BusinessRegistrationForm/BusinessRegistrationForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import CustomerDashboardLayout from "./pages/Customer/CustomerDashboard";
import CustomerLoginPage from "./pages/Customer/CustomerLoginPage";
import CustomerPetCataloguePage from "./pages/Customer/CustomerPetCataloguePage";
import CustomerVendorProfilePage from "./pages/Customer/CustomerVendorProfilePage";
import CustomerVendorsPage from "./pages/Customer/CustomerVendorsPage";
import EditProfilePage from "./pages/Customer/EditProfilePage";
import ExplorePets from "./pages/Customer/ExplorePets";
import ForgotPasswordPage from "./pages/Customer/ForgotPasswordPage";
import LandingPage from "./pages/Customer/CustomerLandingPage";
import PetsDetailPage from "./pages/Customer/PetsDetailPage";
import ProfilePage from "./pages/Customer/CustomerProfilePage";
import RegistrationPage from "./pages/Customer/RegistrationPage";
import VendorLayout from "./layouts/VendorLayout/VendorLayout";
import PrivacyPage from "./pages/PrivacyPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import DocumentUpload from "./pages/Vendor/DocumentUpload";
import VendorAddPetPage from "./pages/Vendor/VendorAddPetPage";
import VendorAddServicePage from "./pages/Vendor/VendorAddServicePage";
import VendorBusinessProfilePage from "./pages/Vendor/VendorBusinessProfilePage";
import VendorCataloguePage from "./pages/Vendor/VendorCataloguePage";
import VendorCategorySelector from "./pages/Vendor/VendorCategorySelector";
import VendorDashboardPage from "./pages/Vendor/VendorDashboardPage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/explore-pets" element={<ExplorePets />} />
      <Route path="/pets" element={<CustomerPetCataloguePage />} />
      <Route path="/pets/:petId" element={<PetsDetailPage />} />
      <Route path="/vendors" element={<CustomerVendorsPage />} />
      <Route path="/vendors/*" element={<CustomerVendorProfilePage />} />

      {/* Customer account pages */}
      <Route path="/customer/dashboard" element={<CustomerDashboardLayout />} />
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route path="/customer-login" element={<CustomerLoginPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/edit" element={<EditProfilePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordForm />} />

      {/* Vendor pages */}
      <Route path="/vendor" element={<VendorLandingPage />} />
      <Route path="/vendor/login" element={<VendorLoginPage />} />
      <Route path="/vendor-login" element={<VendorLoginPage />} />
      <Route path="/vendor/register/*" element={<VendorRegistrationPage />} />
      <Route path="/vendor-registration" element={<VendorRegistrationPage />} />
      <Route path="/register.vendor/*" element={<VendorRegistrationPage />} />
      <Route path="/business-registration" element={<BusinessRegistrationForm />} />
      <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
      <Route path="/vendor/listings" element={<VendorCataloguePage />} />
      <Route path="/vendor/listings/new" element={<VendorAddPetPage />} />
      <Route path="/vendor/services/new" element={<VendorAddServicePage />} />
      <Route path="/vendor/edit-pet/:petId" element={<VendorEditPetListing />} />
      <Route path="/vendor/documents" element={<DocumentUpload />} />
      <Route path="/vendor/business-profile" element={<VendorBusinessProfilePage />} />
      <Route
        path="/vendor/categories"
        element={
          <VendorLayout
            title="Vendor Categories"
            description="Manage your pet categories and listings."
          >
            <VendorCategorySelector />
          </VendorLayout>
        }
      />
      {/* Keep the previous catch-all behavior for other vendor URLs. */}
      <Route path="/vendor/*" element={<VendorDashboardPage />} />

      {/* Legal pages */}
      <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Unknown URLs previously rendered the landing page. */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;
