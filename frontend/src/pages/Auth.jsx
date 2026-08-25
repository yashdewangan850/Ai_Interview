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
    <div className="auth-shell">
      <section className="card auth-card">
        <span className="eyebrow eyebrow--accent">Secure Access</span>

        <h1>
          {mode === "login"
            ? "Enter the interview command center"
            : "Create a professional practice account"}
        </h1>

        <p className="hero-copy">
          Your interviews, results, analytics, and reports are now tied to your
          personal account.
        </p>

        <div className="auth-toggle">
          <button
            type="button"
            className={
              mode === "login" ? "primary-button" : "secondary-button"
            }
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={
              mode === "signup" ? "primary-button" : "secondary-button"
            }
            onClick={() => {
              setMode("signup");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        {mode === "login" ? (
          <form className="form-grid" onSubmit={handleLogin}>
            {/* Email */}
            <div className="form-group">
              <label className="field-label" htmlFor="loginEmail">
                Email
              </label>

              <input
                id="loginEmail"
                className="text-input"
                type="email"
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
            <div className="form-group">
              <label className="field-label" htmlFor="loginPassword">
                Password
              </label>

              <input
                id="loginPassword"
                className="text-input"
                type="password"
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

            {error && <p className="error-text">{error}</p>}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="form-grid" onSubmit={handleSignup}>
            {/* Full Name */}
            <div className="form-group">
              <label className="field-label" htmlFor="signupName">
                Full name
              </label>

              <input
                id="signupName"
                className="text-input"
                type="text"
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
            <div className="form-group">
              <label className="field-label" htmlFor="signupEmail">
                Email
              </label>

              <input
                id="signupEmail"
                className="text-input"
                type="email"
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
            <div className="form-group">
              <label className="field-label" htmlFor="signupPassword">
                Password
              </label>

              <input
                id="signupPassword"
                className="text-input"
                type="password"
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

            {error && <p className="error-text">{error}</p>}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default Auth;