import LandingPage from './pages/LandingPage';
import RegistrationPage from './pages/RegistrationPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';

function App() {
  const path = window.location.pathname;

  if (path === '/registration') {
    return <RegistrationPage />;
  }

  if (path === '/profile') {
    return <ProfilePage />;
  }

  if (path === '/profile/edit') {
    return <EditProfilePage />;
  }

  return <LandingPage />;
}

export default App;