import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, logout, user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = location.pathname === "/";

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/auth");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="navbar navbar-animated">
      <div className="navbar__content">

        {/* BRAND */}
        <Link
          className="brand-logo"
          to="/"
          onClick={closeMenu}
        >
          <span className="brand-mark">AI</span>

          <span className="brand-text">
            Interview Platform
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="desktop-nav">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {!isHome && (
                <Link
                  className={`nav-link ${location.pathname === "/"
                      ? "nav-link-active"
                      : ""
                    }`}
                  to="/"
                >
                  New Interview
                </Link>
              )}

              <Link
                className={`nav-link ${location.pathname === "/daily-quiz"
                    ? "nav-link-active"
                    : ""
                  }`}
                to="/daily-quiz"
              >
                Daily Quiz
              </Link>

              <Link
                className={`nav-link ${location.pathname === "/analytics"
                    ? "nav-link-active"
                    : ""
                  }`}
                to="/analytics"
              >
                Analytics
              </Link>

              <div className="nav-user-wrapper">
                <span className="nav-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </span>

                <span className="nav-user">
                  {user?.name}
                </span>
              </div>

              <button
                className="secondary-button logout-button"
                type="button"
                onClick={handleLogout}
              >
                <span className="logout-icon">↪</span>
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link className="nav-link" to="/auth">
              Login
            </Link>
          )}
        </nav>

        {/* MOBILE HEADER ACTIONS */}
        <div className="mobile-actions">
          <ThemeToggle />

          <button
            type="button"
            className={`menu-toggle ${menuOpen ? "menu-toggle-active" : ""
              }`}
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

      </div>

      {/* MOBILE MENU */}
      <div
        className={`mobile-menu ${menuOpen ? "mobile-menu-open" : ""
          }`}
      >
        {isAuthenticated ? (
          <>
            <div className="mobile-user">
              <span className="nav-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>

              <div>
                <strong>{user?.name}</strong>
                <small>Signed in</small>
              </div>
            </div>

            {!isHome && (
              <Link
                className="mobile-nav-link"
                to="/"
                onClick={closeMenu}
              >
                <span></span>
                New Interview
              </Link>
            )}

            <Link
              className="mobile-nav-link"
              to="/daily-quiz"
              onClick={closeMenu}
            >
              <span></span>
              Daily Quiz
            </Link>

            <Link
              className="mobile-nav-link"
              to="/analytics"
              onClick={closeMenu}
            >
              <span></span>
              Analytics
            </Link>

            <button
              className="mobile-logout"
              type="button"
              onClick={handleLogout}
            >
              <span>↪</span>
              Logout
            </button>
          </>
        ) : (
          <Link
            className="mobile-nav-link"
            to="/auth"
            onClick={closeMenu}
          >
            <span></span>
            Login
          </Link>
        )}
      </div>
    </header>
  );
}

export default Navbar;