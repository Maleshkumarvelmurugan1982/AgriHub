import React, { useState, useEffect } from "react";
import "./NavbarRegistered.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:8070/seller/userdata', {
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
                <li><a className="dropdown-item" href="/regfarmer">Farmer</a></li>
                <li><a className="dropdown-item" href="/regseller">Seller</a></li>
                <li><a className="dropdown-item" href="/deliveryman">Deliveryman</a></li>
              </ul>
            </li>
            <li className="about">
              <a className="nav-link" href="/about">About</a>
            </li>
          </ul>

          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="profile-btn" href="/profile">
                <FontAwesomeIcon icon={faUser} />
              </a>
            </li>
            <li className="nav-item">
              <a className="login" href="/">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
