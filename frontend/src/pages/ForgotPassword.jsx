import { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(
        data.message ||
          "If an account exists with this email, a password reset link has been sent."
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="card auth-card">
        <span className="eyebrow eyebrow--accent">
          Password Recovery
        </span>

        <h1>Forgot your password?</h1>

        <p className="hero-copy">
          Enter your registered email address and we'll send you a
          password reset link.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label" htmlFor="forgotEmail">
              Email
            </label>

            <input
              id="forgotEmail"
              className="text-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          {message && (
            <p className="success-text">
              {message}
            </p>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-back">
          <Link to="/auth">← Back to Login</Link>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;