import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGIN_FORM = {
  email: "",
  password: "",
};

const SIGNUP_FORM = {
  name: "",
  email: "",
  password: "",
};

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, login, signup } = useAuth();

  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(LOGIN_FORM);
  const [signupForm, setSignupForm] = useState(SIGNUP_FORM);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const redirectTo = location.state?.from || "/";

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await login(loginForm);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await signup(signupForm);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell auth-page-animated">
      <section className="card auth-card auth-card-animated">
        {/* Top Badge */}
        <div className="auth-badge">
          <span className="auth-badge-dot"></span>
          Secure Access
        </div>

        {/* Heading */}
        <div className="auth-heading">
          <h1>
            {mode === "login"
              ? "Enter the interview command center"
              : "Create a professional practice account"}
          </h1>

          <p className="hero-copy">
            Your interviews, results, analytics, and reports are now tied to
            your personal account.
          </p>
        </div>

        {/* Login / Signup Toggle */}
        <div className="auth-toggle auth-toggle-animated">
          <button
            type="button"
            className={
              mode === "login"
                ? "primary-button auth-tab active"
                : "secondary-button auth-tab"
            }
            onClick={() => switchMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={
              mode === "signup"
                ? "primary-button auth-tab active"
                : "secondary-button auth-tab"
            }
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* LOGIN */}
        {mode === "login" ? (
          <form
            className="form-grid auth-form auth-form-enter"
            onSubmit={handleLogin}
          >
            {/* Email */}
            <div className="form-group animated-field">
              <label className="field-label" htmlFor="loginEmail">
                Email
              </label>

              <input
                id="loginEmail"
                className="text-input auth-input"
                type="email"
                placeholder="Enter your email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Password */}
            <div className="form-group animated-field">
              <label className="field-label" htmlFor="loginPassword">
                Password
              </label>

              <input
                id="loginPassword"
                className="text-input auth-input"
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />

              {/* Forgot Password */}
              <div className="forgot-password">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* SIGNUP */
          <form
            className="form-grid auth-form auth-form-enter"
            onSubmit={handleSignup}
          >
            {/* Full Name */}
            <div className="form-group animated-field">
              <label className="field-label" htmlFor="signupName">
                Full name
              </label>

              <input
                id="signupName"
                className="text-input auth-input"
                type="text"
                placeholder="Enter your full name"
                value={signupForm.name}
                onChange={(event) =>
                  setSignupForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Email */}
            <div className="form-group animated-field">
              <label className="field-label" htmlFor="signupEmail">
                Email
              </label>

              <input
                id="signupEmail"
                className="text-input auth-input"
                type="email"
                placeholder="Enter your email"
                value={signupForm.email}
                onChange={(event) =>
                  setSignupForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Password */}
            <div className="form-group animated-field">
              <label className="field-label" htmlFor="signupPassword">
                Password
              </label>

              <input
                id="signupPassword"
                className="text-input auth-input"
                type="password"
                placeholder="Create a password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                required
              />
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠</span>
                {error}
              </div>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom text */}
        <div className="auth-footer">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => switchMode("signup")}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("login")}>
                Login
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Auth;
