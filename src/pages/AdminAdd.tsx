import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./AdminAdd.css";

function AdminAdd() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Admin");
  const [password, setPassword] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert(`Admin details entered for ${fullName} (${email}).`);
  }

  function generatePassword() {
    const generated = Math.random().toString(36).slice(-10);
    setPassword(generated);
  }

  return (
    <div className="admin-layout">
      {/* Left sidebar */}
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <img src={logo} alt="Pawdigree logo" />
        </Link>
      </aside>

      {/* Main content */}
      <div className="admin-main">
        {/* Top navigation */}
        <header className="admin-header">
          <div className="admin-heading">
            <div className="admin-breadcrumb">
              Admin / Admin Management / Admins / Add
            </div>
            <h1>Add Admin</h1>
          </div>

          <div className="admin-header-actions">
            <label className="admin-search">
              <span aria-hidden="true">⌕</span>
              <input type="search" placeholder="Search..." />
            </label>

            <span className="admin-badge">Super Admin</span>
          </div>
        </header>

        {/* Page body */}
        <main className="admin-content">
          <section className="admin-card">
            <div className="admin-card-heading">
              <h2>Add Admin</h2>
              <p>
                Only Super Admins can create or edit admin accounts.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Chris Ouma"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="chris@pawdigree.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support Admin">Support Admin</option>
                </select>
              </div>

              <div className="admin-field">
                <label htmlFor="password">Temporary Password</label>
                <div className="admin-password-wrapper">
                  <input
                    id="password"
                    type="text"
                    placeholder="Auto-generated — editable"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="generate-password"
                    onClick={generatePassword}
                    aria-label="Generate temporary password"
                    title="Generate password"
                  >
                    ↻
                  </button>
                </div>
              </div>

              <label className="admin-invite">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(event) => setSendInvite(event.target.checked)}
                />
                <span>Send invite email</span>
              </label>

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-save">
                  Edit Admin
                </button>

                <Link to="/" className="admin-btn admin-btn-cancel">
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <footer className="admin-footer">
            © Admin v1.2 | Last sync: 2m ago
          </footer>
        </main>
      </div>
    </div>
  );
}

export default AdminAdd;