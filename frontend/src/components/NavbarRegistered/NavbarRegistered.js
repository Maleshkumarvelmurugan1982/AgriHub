import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { Link, useNavigate } from "react-router-dom";

const BASE_URL = "https://agrihub-2.onrender.com";

function Navbar() {
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/user/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!mounted) return;

        if (data?.status === "ok" && data?.data) {
          // normalize role strings
          const role = (data.data.role || data.data.userRole || data.data.type || "").toString().toLowerCase();
          setUserRole(role);
        }
      } catch (err) {
        // silently ignore; role stays empty
        console.warn("Failed to fetch user role:", err);
      }
    };

    fetchUserRole();
    return () => { mounted = false; };
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("govLoggedIn");
    } catch (e) {
      console.warn("Error clearing storage on logout:", e);
    }
    navigate("/login", { replace: true });
  };

  const showLogout = userRole === "farmer" || userRole === "seller";

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
            It is a platform to reduce the transportation cost for farmers and sellers
          </span>
        </div>

        {/* Small logout button shown only for farmers and sellers */}
        {showLogout && (
          <div style={{ marginLeft: 12 }}>
            <button
              onClick={handleLogout}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                cursor: "pointer",
                color: "#111827",
                fontWeight: 600,
              }}
              title="Logout"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
