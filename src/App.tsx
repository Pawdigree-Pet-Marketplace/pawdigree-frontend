import LandingPage from './pages/LandingPage'
import VendorRegistrationForm from './components/VendorRegistrationForm/VendorRegistrationForm'

function App() {
  const path = window.location.pathname

  if (path === '/registration') {
    return <VendorRegistrationForm />
  }

  return <LandingPage />
}

export default App
