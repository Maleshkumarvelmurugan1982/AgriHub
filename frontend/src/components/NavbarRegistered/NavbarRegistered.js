import React from "react";
import "./NavbarRegistered.css";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid" style={{ alignItems: "center", display: "flex", gap: "12px" }}>
        <Link className="navbar-brand" to="/homepage-registeredusers" aria-label="Homepage">
          <img
            src={process.env.PUBLIC_URL + "/Navbar/icon.png"}
            alt="CropXchange Logo"
            className="navbar-icon"
            style={{ height: 48 }}
          />
        </Link>

        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 16, color: "#333", fontWeight: 600 }}>
            It  is platform to reduce the transporatation cost for farmers and sellers
          </span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
