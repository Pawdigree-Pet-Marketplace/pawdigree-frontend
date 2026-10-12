import LandingPage from './pages/LandingPage'
import RegistrationPage from './pages/RegistrationPage'

function App() {
  const path = window.location.pathname

  if (path === "/registration") {
    return <RegistrationPage />;
  }

  return <LandingPage />
}

export default App