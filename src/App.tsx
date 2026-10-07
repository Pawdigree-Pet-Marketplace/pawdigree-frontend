import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CustomerLogin from "./components/CustomerLogin";
import CustomerRegistration from "./components/CustomerRegistration";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<CustomerLogin />} />

        <Route path="/register" element={<CustomerRegistration />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;