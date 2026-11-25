import { Navigate } from "react-router-dom";

/** Legacy route target: adoption conversations now live in My adoption requests. */
export default function CustomerAdoptionRequests() {
  return <Navigate to="/customer/adoption?view=requests" replace />;
}
