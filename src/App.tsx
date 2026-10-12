import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import VendorRegistrationForm from "./components/VendorRegistrationForm/VendorRegistrationForm";

function App() {
  const path = window.location.pathname;

  if (path === "/vendor-registration") {
    return <VendorRegistrationForm />;
  }

  if (path === "/registration") {
    return <RegistrationPage />;
  }

  return <LandingPage />;
}

export default App;