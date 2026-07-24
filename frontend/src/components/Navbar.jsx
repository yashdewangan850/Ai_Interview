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

  return (
    <header className="navbar">
      <div className="navbar__content">
        <div className="brand-wrap">
          <span className="brand-mark">AI</span>
          <Link className="brand" to="/">
            Interview Platform
          </Link>
        </div>
        <div className="nav-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {!isHome && (
                <Link className="nav-link" to="/">
                  New Interview
                </Link>
              )}
              <Link className="nav-link" to="/daily-quiz">
                Daily Quiz
              </Link>
              <Link className="nav-link" to="/analytics">
                Analytics
              </Link>
              <span className="nav-user">{user?.name}</span>
              <button
                className="secondary-button nav-button"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link className="nav-link" to="/auth">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
