import useSession from "../../hooks/useSession";
import CustomerShell from "../CustomerShell/CustomerShell";
import PublicLayout from "../PublicLayout/PublicLayout";

export default function CustomerAwareLayout() {
  const isCustomer = useSession("CUSTOMER");
  return isCustomer ? <CustomerShell /> : <PublicLayout />;
}
