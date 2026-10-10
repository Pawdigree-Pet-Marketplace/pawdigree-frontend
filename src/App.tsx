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