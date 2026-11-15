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
import CustomerCartPage from "./pages/Customer/CustomerCartPage";
import CustomerOrderHistoryPage from "./pages/Customer/CustomerOrderHistoryPage";
import CustomerCheckoutPage from "./pages/Customer/CustomerCheckoutPage";
import SandboxPaymentPage from "./pages/Customer/SandboxPaymentPage";
import CustomerOrderDetailsPage from "./pages/Customer/CustomerOrderDetailsPage";
import LandingPage from "./pages/Customer/CustomerLandingPage";
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
import PetsDetailPage from "./pages/Customer/PetsDetailPage";
import ProfilePage from "./pages/Customer/CustomerProfilePage";
import RegistrationPage from "./pages/Customer/RegistrationPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VendorRegistrationPage from "./pages/Vendor/VendorRegistrationPage";
import VendorLandingPage from "./pages/Vendor/VendorLandingPage";
import VendorOrdersPage from "./pages/Vendor/VendorOrdersPage";
import VendorDashboardPage from "./pages/Vendor/VendorDashboardPage";
import VendorLoginPage from "./pages/Vendor/VendorLoginPage";
import VendorAddPetPage from "./pages/Vendor/VendorAddPetPage";
import VendorCataloguePage from "./pages/Vendor/VendorCataloguePage";
import VendorEditPetListing from "./pages/Vendor/VendorEditPetListing";
import VendorPetListingDetailsPage from "./pages/Vendor/VendorPetListingDetailsPage";
import DocumentUpload from "./pages/Vendor/DocumentUpload";
import VendorAddServicePage from "./pages/Vendor/VendorAddServicePage";
import VendorBusinessProfilePage from "./pages/Vendor/VendorBusinessProfilePage";
import VendorCategorySelector from "./pages/Vendor/VendorCategorySelector";
import VendorAvailabilityPage from "./pages/Vendor/VendorAvailabilityPage";
import VendorEditServicePage from "./pages/Vendor/VendorEditServicePage";
import VendorServiceAvailabilityPage from "./pages/Vendor/VendorServiceAvailabilityPage";
import VendorAdoptionApplicationsPage from "./pages/Vendor/VendorAdoptionApplicationsPage";
import CustomerAdoptionPage from "./pages/Customer/CustomerAdoptionPage";
import VendorChangeRequests from "./pages/Vendor/VendorChangeRequests";
import VendorMerchandisePage from "./pages/Vendor/VendorMerchandisePage";
import VendorStoreProfilePage from "./pages/Vendor/VendorStoreProfilePage";
import VendorProfilePage from "./pages/Vendor/VendorProfilePage";
import { VendorBusinessRoute } from "./services/vendorBusinessContext";
function App() {
  return (
    <Routes>
      {/* Public frame: customer or vendor navigation, footer, and legal pages. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/vendor" element={<VendorLandingPage />} />
        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditionsPage />}
        />
        <Route path="/terms" element={<TermsAndConditionsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
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
      {/* Public pages use customer navigation when a customer is signed in. */}
      <Route element={<CustomerAwareLayout />}>
        <Route path="/explore-pets" element={<ExplorePets />} />
        <Route path="/merchandise" element={<MerchandisePage />} />
        <Route
          path="/merchandise/:productId"
          element={<ProductDetailsPage />}
        />
        <Route path="/pets" element={<CustomerPetCataloguePage />} />
        <Route path="/pets/:petId" element={<PetsDetailPage />} />
        <Route path="/vendors" element={<CustomerVendorsPage />} />
        <Route path="/vendors/:id" element={<CustomerVendorProfilePage />} />
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
        path="/customer/cart"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerCartPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/checkout"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerCheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sandbox-pay"
        element={
          <ProtectedRoute role="CUSTOMER">
            <SandboxPaymentPage />
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
        path="/customer/orders/:orderId"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerOrderDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* Adoption applications require a customer session and dashboard shell. */}
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

      <Route
        path="/vendor/orders"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorOrdersPage />
          </ProtectedRoute>
        }
      />

      {/* VENDOR AREA */}
      <Route
        path="/vendor/merchandise"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorMerchandisePage />
          </ProtectedRoute>
        }
      />
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
        path="/vendor/profile"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="/vendor/store-profile" element={<ProtectedRoute role="VENDOR"><VendorStoreProfilePage /></ProtectedRoute>} />

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
        path="/vendor/listings/:petId"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorPetListingDetailsPage />
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
      {/* Business workspaces reuse the existing vendor pages and layout. */}
      <Route
        path="/vendor/business/:businessId/dashboard"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorDashboardPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/businesses"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorBusinessProfilePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/store-profile"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorStoreProfilePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/listings"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorCataloguePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/listings/new"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorAddPetPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/listings/:petId"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorPetListingDetailsPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/edit-pet/:petId"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorEditPetListing />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/services/new"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorAddServicePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/services/:serviceId/edit"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorEditServicePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/services/:serviceId/availability"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorServiceAvailabilityPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/orders"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorOrdersPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/merchandise"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorMerchandisePage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/adoption-applications"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <VendorAdoptionApplicationsPage />
            </VendorBusinessRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/business/:businessId/documents"
        element={
          <ProtectedRoute role="VENDOR">
            <VendorBusinessRoute>
              <DocumentUpload />
            </VendorBusinessRoute>
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
