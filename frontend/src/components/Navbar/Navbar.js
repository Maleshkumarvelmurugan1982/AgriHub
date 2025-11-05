import React from "react";
import "./Navbar.css";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const isGovLoggedIn = localStorage.getItem("govLoggedIn") === "true";
  const location = useLocation();

  // retain for possible future logic use:
  const hideAuthLinks = () => {
    if (isGovLoggedIn) return true;
    if (location.pathname && location.pathname.startsWith("/GovernmentPage")) return true;
    if (location.pathname === "/login" || location.pathname === "/register") return true;
    return false;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
        {/* Logo */}
        <Link className="navbar-brand" to="/">
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
            {/* Government, Login, and Register buttons/links have been removed */}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
