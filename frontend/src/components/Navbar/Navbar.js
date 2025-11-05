import React from "react";
import "./Navbar.css";
import { Link } from "react-router-dom";

function Navbar() {
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
          {/* Government Badge + Login/Register */}
          <ul className="navbar-nav align-items-center">
            {/* Government Badge */}
            <li className="nav-item me-3">
              <Link 
                to="/GovernmentPage" 
                replace 
                className="badge bg-success text-white p-2" 
                style={{ fontSize: "0.9rem", cursor: "pointer", textDecoration: "none" }}
              >
                Government
              </Link>
            </li>
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
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
