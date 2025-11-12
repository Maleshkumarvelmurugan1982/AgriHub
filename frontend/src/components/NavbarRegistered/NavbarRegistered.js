import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

function NavbarRegistered() {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

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

            // Only continue if we get a valid response
            if (res.ok) {
              const data = await res.json();
              if (data.status === "ok" && data.data) {
                userData = { role: route, ...data.data };
                console.log(`✅ User authenticated as ${route}:`, userData.fname || userData.name);
                break;
              }
            }
            // If not ok, silently continue to next route (don't log 404s)
          } catch (err) {
            // Silently continue to next route - this is expected behavior
            continue;
          }
        }

        if (userData) {
          setUserRole(userData.role);
          setUserName(userData.fname || userData.name || "");
        } else {
          console.warn("⚠️ User token is invalid or expired");
          // Optional: Auto-logout if token is invalid
          // localStorage.removeItem("token");
          // navigate("/login");
        }
      } catch (error) {
        console.error("❌ Unexpected error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    try {
      // Clear all authentication-related data
      localStorage.removeItem("token");
      localStorage.removeItem("govLoggedIn");
      localStorage.removeItem("userRole");
      
      console.log("✅ User logged out successfully");
    } catch (e) {
      console.warn("⚠️ Error clearing storage on logout:", e);
    }
    
    // Redirect to the login page after logout
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container-fluid">
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
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>

          <ul className="navbar-nav align-items-center">
            {loading ? (
              <li className="nav-item">
                <span style={{ color: '#666', fontSize: '14px' }}>Loading...</span>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="profile-btn" to="/profile" title="Profile">
                    <FontAwesomeIcon icon={faUser} />
                    {userName && ` ${userName}`}
                    {userRole && (
                      <span className="user-role-badge"> ({userRole})</span>
                    )}
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="logout-btn" onClick={handleLogout} title="Logout">
                    <span className="logout-icon" aria-hidden="true">⎋</span>
                    <span className="logout-text">Logout</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavbarRegistered;
