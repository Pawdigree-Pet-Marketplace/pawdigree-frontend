import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./CustomerRegistration.css";
import logo from "../assets/log.png";
function CustomerRegistration() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!agreeToTerms) {
      alert("Please agree to the terms and conditions.");
      return;
    }

    console.log({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    alert("Registration successful!");
  };

  return (
    <main className="registration-page">
      <section className="registration-card">
        <div className="registration-header">
<div className="logo">
  <a href="/">
    <img src={logo} alt="Pawdigree Logo" />
  </a>
</div>

          <h1>Join Pawdigree</h1>

          <p>
            Create your account and find the perfect pet for your family.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="firstName">first Name</label>
                <input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              required
            />
            <label htmlFor="lastName">last Name</label>
            <input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              required
            />
          </div>

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
            <label htmlFor="phone">Phone Number</label>

            <input
              id="phone"
              type="tel"
              placeholder="+256 700 000000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />

            <small>Password must be at least 8 characters.</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <div className="terms">
            <input
              id="terms"
              type="checkbox"
              checked={agreeToTerms}
              onChange={(event) => setAgreeToTerms(event.target.checked)}
            />

            <label htmlFor="terms">
              I agree to the terms and conditions.
            </label>
          </div>

          <button type="submit" className="register-button">
            Create Account
          </button>
        </form>

        <p className="login-text">
          Already have an account?{" "}
         <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}

export default CustomerRegistration;