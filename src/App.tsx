import LandingPage from "./pages/LandingPage";
import RegistrationPage from "./pages/RegistrationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const path = window.location.pathname;
  if (path === "/registration") {
    return <RegistrationPage />;
  }

  if (path.startsWith("/reset-password")) {
    return <ResetPasswordPage />;
  }

  return <LandingPage />;
}

export default App;
