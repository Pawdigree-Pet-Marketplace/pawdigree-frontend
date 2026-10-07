import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import "./CustomerLogin.css";

function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log({
      email,
      password,
      rememberMe,
    });

    alert("Login successful!");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <div className="paw-logo">🐾</div>

          <h1>Welcome Back</h1>

          <p>Log in to your Pawdigree account.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="password-label">
              <label htmlFor="password">Password</label>

              <a href="/forgot-password">Forgot password?</a>
              <Link to="/register">Create an account</Link>
            </div>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="remember-me">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />

            <label htmlFor="rememberMe">Remember me</label>
          </div>

          <button type="submit" className="login-button">
            Log In
          </button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register">Create an account</Link>
        </p>
      </section>
          </main>
  );
}

export default CustomerLogin;