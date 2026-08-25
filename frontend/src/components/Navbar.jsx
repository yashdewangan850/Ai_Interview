import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, logout, user } = useAuth();

  const isHome = location.pathname === "/";

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <header className="navbar navbar-animated">
      <div className="navbar__content">
        {/* BRAND */}
        <div className="brand-wrap">
          <Link
            className="brand-logo"
            to="/"
            aria-label="Interview Platform Home"
          >
            <span className="brand-mark">AI</span>

            <span className="brand-text">
              Interview Platform
            </span>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="nav-actions">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {!isHome && (
                <Link
                  className={`nav-link ${
                    isActive("/") ? "nav-link-active" : ""
                  }`}
                  to="/"
                >
                  <span>New Interview</span>
                </Link>
              )}

              <Link
                className={`nav-link ${
                  isActive("/daily-quiz")
                    ? "nav-link-active"
                    : ""
                }`}
                to="/daily-quiz"
              >
                <span>Daily Quiz</span>
              </Link>

              <Link
                className={`nav-link ${
                  isActive("/analytics")
                    ? "nav-link-active"
                    : ""
                }`}
                to="/analytics"
              >
                <span>Analytics</span>
              </Link>

              {/* USER */}
              <div className="nav-user-wrapper">
                <div className="nav-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <span className="nav-user">
                  {user?.name}
                </span>
              </div>

              {/* LOGOUT */}
              <button
                className="secondary-button nav-button logout-button"
                type="button"
                onClick={handleLogout}
              >
                <span className="logout-icon">↪</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link
              className={`nav-link ${
                isActive("/auth")
                  ? "nav-link-active"
                  : ""
              }`}
              to="/auth"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;