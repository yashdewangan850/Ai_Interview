import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

function ForgotPassword() {
  const navigate = useNavigate();

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

      // Backend se reset URL mila
      if (data.resetUrl) {
        const resetUrl = new URL(data.resetUrl);

        // Direct Reset Password page par jao
        navigate(
          `${resetUrl.pathname}${resetUrl.search}${resetUrl.hash}`
        );

        return;
      }

      setMessage(
        data.message ||
          "Password reset link generated successfully."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to generate reset link."
      );
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
          Enter your registered email address to reset your password.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              className="field-label"
              htmlFor="forgotEmail"
            >
              Email
            </label>

            <input
              id="forgotEmail"
              className="text-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          {error && (
            <p className="error-text">
              {error}
            </p>
          )}

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
            {loading ? "Generating..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-back">
          <Link to="/auth">
            ← Back to Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword;