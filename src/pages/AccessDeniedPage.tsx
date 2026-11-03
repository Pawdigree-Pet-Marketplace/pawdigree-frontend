import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import "./AccessDeniedPage.css";

export default function AccessDeniedPage() {
  return (
    <main className="access-denied-page">
      <section className="access-denied-card" aria-labelledby="access-denied-title">
        <div className="access-denied-icon" aria-hidden="true">
          <ShieldAlert size={30} />
        </div>
        <p className="access-denied-code">403 · ACCESS DENIED</p>
        <h1 id="access-denied-title">You can’t access this page</h1>
        <p className="access-denied-message">
          Your account doesn’t have permission to view this area. If you think
          this is a mistake, contact the Pawdigree team.
        </p>
        <Link className="access-denied-home-link" to="/">
          Return to Pawdigree
        </Link>
      </section>
    </main>
  );
}
