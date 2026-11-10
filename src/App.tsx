
import { Navigate, Route, Routes } from "react-router-dom";

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
import PetsDetailPage from "./pages/Customer/PetsDetailPage"; 
import AdoptionRequest from "./pages/Customer/AdoptionRequest";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorDashboardPage from "./pages/Vendor/VendorDashboardPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import VendorAddPetPage from "./pages/Vendor/VendorAddPetPage";
import VendorCataloguePage from "./pages/Vendor/VendorCataloguePage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import DocumentUpload from "./pages/Vendor/DocumentUpload";
import VendorBusinessProfilePage from "./pages/Vendor/VendorBusinessProfilePage";
import VendorCategorySelector from "./pages/Vendor/VendorCategorySelector";

import BusinessRegistrationForm from "./components/BusinessRegistrationForm/BusinessRegistrationForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";

import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import PrivacyPage from "./pages/PrivacyPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VendorLayout from "./layouts/VendorLayout/VendorLayout";

function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pets" element={<CustomerPetCataloguePage />} />
      <Route path="/pets/:petId" element={<PetsDetailPage />} />
      <Route path="/vendors" element={<CustomerVendorsPage />} />
      <Route path="/adoption-request" element={<AdoptionRequest />} />
      <Route
        path="/vendors/:vendorId"
        element={<CustomerVendorProfilePage />}
      />

      {/* Customer account pages */}
      <Route
        path="/customer/dashboard"
        element={<CustomerDashboardLayout />}
      />
      <Route path="/registration" element={<RegistrationPage />} />
      <Route path="/login" element={<CustomerLoginPage />} />
      <Route
        path="/customer-login"
        element={<CustomerLoginPage />}
      />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/edit" element={<EditProfilePage />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        path="/reset-password"
        element={<ResetPasswordForm />}
      />

      {/* Adoption application */}
      <Route
       path="/adoption-request"
        element={<AdoptionRequest />}
      /> 

      {/* Vendor pages */}
      <Route path="/vendor" element={<VendorLandingPage />} />
      <Route path="/vendor/login" element={<VendorLoginPage />} />
      <Route path="/vendor-login" element={<VendorLoginPage />} />
      <Route
        path="/vendor/register"
        element={<VendorRegistrationPage />}
      />
      <Route
        path="/vendor-registration"
        element={<VendorRegistrationPage />}
      />
      <Route
        path="/register.vendor"
        element={<VendorRegistrationPage />}
      />
      <Route
        path="/business-registration"
        element={<BusinessRegistrationForm />}
      />
      <Route
        path="/vendor/dashboard"
        element={<VendorDashboardPage />}
      />
      <Route
        path="/vendor/listings"
        element={<VendorCataloguePage />}
      />
      <Route
        path="/vendor/listings/new"
        element={<VendorAddPetPage />}
      />
      <Route
        path="/vendor/edit-pet/:petId"
        element={<VendorEditPetListing />}
      />
      <Route
        path="/vendor/documents"
        element={<DocumentUpload />}
      />
      <Route
        path="/vendor/business-profile"
        element={<VendorBusinessProfilePage />}
      />
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

      {/* Legal pages */}
      <Route
        path="/terms-and-conditions"
        element={<TermsAndConditionsPage />}
      />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Unknown URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
