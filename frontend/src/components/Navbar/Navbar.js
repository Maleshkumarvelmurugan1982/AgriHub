import React from "react";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <img
            src={process.env.PUBLIC_URL + "/Navbar/icon.png"}
            alt="Logo"
            className="navbar-icon"
          />
        </a>
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
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item home">
              <a className="nav-link active" aria-current="page" href="/">
                Home
              </a>
            </li>

            <li className="nav-item menu dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="/"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Menu
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li>
                  <a className="dropdown-item" href="/farmer">
                    Farmer
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/seller">
                    Seller
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/deliveryman">
                    Deliveryman
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/GovernmentPage">
                    Government
                  </a>
                </li>
              </ul>
            </li>

            <li className="nav-item about">
              <a className="nav-link" href="#about-section">
                About
              </a>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="cartitem" href="/cart">
                <img
                  src={process.env.PUBLIC_URL + "/Navbar/cart.png"}
                  alt="Cart"
                  className="cart"
                />
              </a>
            </li>

            <li className="nav-item">
              <a className="login" href="/login">
                Login
              </a>
            </li>

            <li className="nav-item">
              <a className="register" href="/register">
                Register
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
