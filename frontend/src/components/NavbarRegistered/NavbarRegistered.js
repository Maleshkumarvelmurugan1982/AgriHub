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
        if (!token) return; // No token, maybe redirect to login or show limited nav

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
      // remove gov flag if present; harmless if not used
      localStorage.removeItem("govLoggedIn");
    } catch (e) {
      // ignore storage errors
      console.warn("Error clearing storage on logout:", e);
    }
    // navigate to home (SPA navigation)
    navigate("/", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/homepage-registeredusers">
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
                  <Link className="dropdown-item" to="/regfarmer">
                    Farmer
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/regseller">
                    Seller
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/deliveryman">
                    Deliveryman
                  </Link>
                </li>
              </ul>
            </li>
            <li className="about">
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="profile-btn" to="/profile">
                <FontAwesomeIcon icon={faUser} /> {userName && ` (${userName})`}
              </Link>
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
