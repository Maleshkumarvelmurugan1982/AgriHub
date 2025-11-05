import React from "react";
import "./Navbar.css";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  // Check login based on localStorage flag
  const isGovLoggedIn = localStorage.getItem("govLoggedIn") === "true";
  
  // to detect current page route
  const location = useLocation();

  // Hide auth links (Government / Login / Register) when:
  // - already logged in (existing behavior), OR
  // - user is on the GovernmentPage route (so while the gov login screen is shown)
  const hideAuthLinks = () => {
    if (isGovLoggedIn) return true;
    if (location.pathname && location.pathname.startsWith("/GovernmentPage")) return true;
    return false;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">

        {/* Logo */}
        <Link className="navbar-brand" to="/" replace>
          <img
            src={process.env.PUBLIC_URL + "/Navbar/icon.png"}
            alt="Logo"
            className="navbar-icon"
          />
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

          <ul className="navbar-nav align-items-center">
            
            {/* Show Government Badge only if NOT logged in and NOT on GovernmentPage */}
            {!hideAuthLinks() && (
              <li className="nav-item me-3">
                <Link
                  to="/GovernmentPage"
                  replace
                  className="badge bg-success text-white p-2"
                  style={{
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  Government
                </Link>
              </li>
            )}

            {/* Show Login/Register only if NOT logged in and NOT on GovernmentPage */}
            {!hideAuthLinks() && (
              <>
                <li className="nav-item">
                  <Link className="login" to="/login" replace>
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link className="register" to="/register" replace>
                    Register
                  </Link>
                </li>
              </>
            )}

            {/* Show Logout only when logged in */}
            {isGovLoggedIn && (
              <li className="nav-item">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    localStorage.removeItem("govLoggedIn");
                    window.location.href = "/";
                  }}
                >
                  Logout
                </button>
              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
