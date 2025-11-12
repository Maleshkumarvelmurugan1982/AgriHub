import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Use the requested backend base URL
          const backendBaseUrl = "https://agrihub-2.onrender.com";

          const response = await fetch(`${backendBaseUrl}/seller/userdata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
          
          const data = await response.json();
          if (data.status === 'ok' && data.data) {
            const role =
              data.data.userType ||
              data.data.role ||
              data.data.type ||
              data.data.accountType ||
              '';
            setUserRole(role.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    checkUserRole();
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('govLoggedIn');
      // remove other session keys if present
    } catch (e) {
      console.warn('Error clearing storage on logout:', e);
    }
    // redirect to login page
    navigate('/login', { replace: true });
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
              <Link className="nav-link active" aria-current="page" to="/">
                Home
              </Link>
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
                <li><Link className="dropdown-item" to="/regfarmer">Farmer</Link></li>
                <li><Link className="dropdown-item" to="/regseller">Seller</Link></li>
                <li><Link className="dropdown-item" to="/deliveryman">Deliveryman</Link></li>
              </ul>
            </li>
            <li className="about">
              <Link className="nav-link" to="/about">About</Link>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="profile-btn" to="/profile" aria-label="Profile">
                <FontAwesomeIcon icon={faUser} />
              </Link>
            </li>
            <li className="nav-item">
              <button
                className="login logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: '12px'
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
