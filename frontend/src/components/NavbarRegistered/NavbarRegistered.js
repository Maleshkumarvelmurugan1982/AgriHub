import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function NavbarRegistered() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // No token, maybe redirect to login

        // Detect environment: local vs deployed
        const backendBaseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:8070"
            : "https://agrihub-2.onrender.com";

        // Try fetching from all user routes (farmer, seller, deliveryman)
        const routes = ["farmer", "seller", "deliveryman"];
        let userData = null;

        for (const route of routes) {
          const res = await fetch(`${backendBaseUrl}/${route}/userdata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });

          const data = await res.json();
          if (data.status === "ok" && data.data) {
            userData = { role: route, ...data.data };
            break;
          }
        }

        if (userData) {
          setUserRole(userData.role);
          setUserName(userData.fname || userData.name || "");
        } else {
          console.warn("User not found in any role");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand" href="/homepage-registeredusers">
          <img
            src={process.env.PUBLIC_URL + "/Navbar/icon.png"}
            alt="CropXchange Logo"
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
            <li className="home">
              <a className="nav-link active" aria-current="page" href="/">
                Home
              </a>
            </li>
            <li className="menu dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="/homepage-registeredusers"
                id="navbarDropdown"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Menu
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li>
                  <a className="dropdown-item" href="/regfarmer">
                    Farmer
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/regseller">
                    Seller
                  </a>
                </li>
                <li>
                  <a className="dropdown-item" href="/deliveryman">
                    Deliveryman
                  </a>
                </li>
              </ul>
            </li>
            <li className="about">
              <a className="nav-link" href="/about">
                About
              </a>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="profile-btn" href="/profile">
                <FontAwesomeIcon icon={faUser} /> {userName && ` (${userName})`}
              </a>
            </li>
            <li className="nav-item">
              <button className="login" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavbarRegistered;
