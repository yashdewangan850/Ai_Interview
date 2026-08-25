import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
        }),
      });

      setMessage(
        data.message || "Password reset successfully."
      );

      setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 1500);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to reset password. Please try again."
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

        <h1>Create a new password</h1>

        <p className="hero-copy">
          Enter a new password for your account.
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-group">
            <label
              className="field-label"
              htmlFor="newPassword"
            >
              New Password
            </label>

            <input
              id="newPassword"
              className="text-input"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label
              className="field-label"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              className="text-input"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              minLength={6}
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
            {loading
              ? "Resetting..."
              : "Reset Password"}
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

export default ResetPassword;