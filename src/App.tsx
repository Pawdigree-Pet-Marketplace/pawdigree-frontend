<<<<<<< HEAD
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomerLogin from "./components/CustomerLogin";
import CustomerRegistration from "./components/CustomerRegistration";
import LandingPage from "./pages/LandingPage";
import AdminAdd from "./pages/AdminAdd";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegistration />} />
        <Route path="/admin/add" element={<AdminAdd />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
=======
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
>>>>>>> 424ce576903931a50cdfc1efc5b9e3169409c8e3
