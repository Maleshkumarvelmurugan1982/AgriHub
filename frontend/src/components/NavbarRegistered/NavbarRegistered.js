import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

function NavbarRegistered() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return; // No token, maybe show minimal nav

        // Detect environment: local vs deployed
        const backendBaseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:8070"
            : "https://agrihub-2.onrender.com";

        // Try fetching from all user routes (farmer, seller, deliveryman)
        const routes = ["farmer", "seller", "deliveryman"];
        let userData = null;

        for (const route of routes) {
          try {
            const res = await fetch(`${backendBaseUrl}/${route}/userdata`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });

            if (!res.ok) {
              // continue to next route
              continue;
            }

            const data = await res.json();
            if (data.status === "ok" && data.data) {
              userData = { role: route, ...data.data };
              break;
            }
          } catch (err) {
            // ignore and try next route
            console.warn(`Error fetching ${route} userdata:`, err);
            continue;
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
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("govLoggedIn"); // safe to remove if present
    } catch (e) {
      console.warn("Error clearing storage on logout:", e);
    }
    // SPA navigation back to home
    navigate("/", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
        {/* keep brand/logo */}
        <Link className="navbar-brand" to="/homepage-registeredusers" aria-label="Homepage">
          <img
            src={process.env.PUBLIC_URL + "/Navbar/icon.png"}
            alt="CropXchange Logo"
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
          {/* Left side intentionally empty (Home / Menu / About removed) */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

          {/* Right side: Profile and Logout */}
          <ul className="navbar-nav align-items-center">
            <li className="nav-item">
              <Link className="profile-btn" to="/profile" title="Profile">
                <FontAwesomeIcon icon={faUser} /> {userName && ` (${userName})`}
              </Link>
            </li>
            <li className="nav-item">
              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <span className="logout-icon" aria-hidden="true">⎋</span>
                <span className="logout-text">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavbarRegistered;
