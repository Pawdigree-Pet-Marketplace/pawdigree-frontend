import { Navigate, Route, Routes } from "react-router-dom";
import CustomerShell from "./layouts/CustomerShell/CustomerShell";
import BusinessRegistrationForm from "./components/BusinessRegistrationForm/BusinessRegistrationForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout/AuthLayout";
import CustomerAwareLayout from "./layouts/CustomerAwareLayout/CustomerAwareLayout";
import PublicLayout from "./layouts/PublicLayout/PublicLayout";
import VendorLayout from "./layouts/VendorLayout/VendorLayout";
import CustomerDashboardLayout from "./pages/Customer/CustomerDashboard";
import CustomerLoginPage from "./pages/Customer/CustomerLoginPage";
import CustomerPetCataloguePage from "./pages/Customer/CustomerPetCataloguePage";
import AdoptionRequest from "./pages/Customer/AdoptionRequest";
import CustomerVendorProfilePage from "./pages/Customer/CustomerVendorProfilePage";
import CustomerVendorsPage from "./pages/Customer/CustomerVendorsPage";
import EditProfilePage from "./pages/Customer/EditProfilePage";
import ExplorePets from "./pages/Customer/ExplorePets";
import MerchandisePage from "./pages/Customer/MerchandisePage";
import ProductDetailsPage from "./pages/Customer/ProductDetailsPage";
import ForgotPasswordPage from "./pages/Customer/ForgotPasswordPage";
import LandingPage from "./pages/Customer/CustomerLandingPage";
import PetsDetailPage from "./pages/Customer/PetsDetailPage";
import ProfilePage from "./pages/Customer/CustomerProfilePage";
import RegistrationPage from "./pages/Customer/RegistrationPage";
import CustomerCartPage from "./pages/Customer/CustomerCartPage";
import CustomerOrderHistoryPage from "./pages/Customer/CustomerOrderHistoryPage";
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
import VendorAvailabilityPage from "./pages/Vendor/VendorAvailabilityPage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import VendorEditServicePage from "./pages/Vendor/VendorEditServicePage";
import VendorServiceAvailabilityPage from "./pages/Vendor/VendorServiceAvailabilityPage";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorAdoptionApplicationsPage from "./pages/Vendor/VendorAdoptionApplicationsPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";
import CustomerAdoptionPage from "./pages/Customer/CustomerAdoptionPage";
import VendorChangeRequests from "./pages/Vendor/VendorChangeRequests";
import VendorMerchandisePage from "./pages/Vendor/VendorMerchandisePage";
function App() {
  return (
    <Routes>
      {/* PUBLIC: navbar + side menu + footer + bottom bar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vendor" element={<VendorLandingPage />} />
        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditionsPage />}
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        {/* Unknown URLs previously rendered the landing page. */}
        <Route path="*" element={<LandingPage />} />
      </Route>
      <Route
        path="/customer/my-requests"
        element={
          <ProtectedRoute role="CUSTOMER">
            <Navigate to="/customer/adoption?view=requests" replace />
          </ProtectedRoute>
        }
      />
      {/* PUBLIC PAGES: signed-in customers get the sidebar, visitors get the public frame */}
      <Route element={<CustomerAwareLayout />}>
        <Route path="/explore-pets" element={<ExplorePets />} />
        <Route path="/merchandise" element={<MerchandisePage />} />
        <Route path="/merchandise/:productId" element={<ProductDetailsPage />} />
        <Route path="/pets/:petId" element={<PetsDetailPage />} />
        <Route path="/vendors" element={<CustomerVendorsPage />} />
        <Route path="/vendors/:id" element={<CustomerVendorProfilePage />} />
        <Route
  path="/vendor/merchandise"
  element={
    <ProtectedRoute role="VENDOR">
      <VendorMerchandisePage />
    </ProtectedRoute>
  }
/>
        <Route
          path="/profile"
          element={
            <ProtectedRoute role="CUSTOMER">
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute role="CUSTOMER">
              <EditProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* AUTH: logo chip only */}
      <Route element={<AuthLayout />}>
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/customer-login" element={<CustomerLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/vendor/login" element={<VendorLoginPage />} />
        <Route path="/vendor-login" element={<VendorLoginPage />} />
        <Route path="/vendor/register/*" element={<VendorRegistrationPage />} />
        <Route
          path="/vendor-registration"
          element={<VendorRegistrationPage />}
        />
        <Route path="/register.vendor/*" element={<VendorRegistrationPage />} />
      </Route>

      {/* CUSTOMER ACCOUNT PAGES (these render their own navigation) */}
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerDashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/adoption"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerAdoptionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pets"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerPetCataloguePage />
          </ProtectedRoute>
        }
      />

     
      <Route
        path="/customer/cart"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerCartPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/orders"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerOrderHistoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/adoption-request"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdoptionRequest />} />
      </Route>

      {/* VENDOR AREA */}
      {/* VENDOR AREA */}
      <Route
        path="/vendor/business-registration"
        element={
          <ProtectedRoute role="VENDOR">
            <BusinessRegistrationForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/availability"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorAvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/change-requests"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorChangeRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/listings"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorCataloguePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/adoption-applications"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorAdoptionApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/listings/new"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorAddPetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/new"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorAddServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/:serviceId/edit"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorEditServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/edit-pet/:petId"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorEditPetListing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/:serviceId/availability"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorServiceAvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/documents/:businessId"
        element={
          <ProtectedRoute role="VENDOR">
            <DocumentUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business-profile"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/categories"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorLayout
              title="Vendor Categories"
              description="Manage your pet categories and listings."
            >
              <VendorCategorySelector />
            </VendorLayout>
          </ProtectedRoute>
        }
      />
      {/* Keep the previous catch-all behavior for other vendor URLs. */}
      <Route
        path="/vendor/*"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
