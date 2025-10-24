import "./login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import FooterNew from "../Footer/FooterNew";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("");

  const navigate = useNavigate();

  // Handle login submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate input
    if (!email || !password || !userRole) {
      alert("Please fill in all fields.");
      return;
    }

    // Determine backend URL based on role
    let url = "";
    switch (userRole) {
      case "Farmer":
        url = "https://agrihub-2.onrender.com/farmer/login";
        break;
      case "Seller":
        url = "https://agrihub-2.onrender.com/seller/login";
        break;
      case "Deliveryman":
        url = "https://agrihub-2.onrender.com/deliveryman/login";
        break;
      default:
        alert("Invalid role selected.");
        return;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        credentials: "include", // Important for sessions/cookies
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.status === "ok") {
        alert("Login successful!");

        // Store token if backend sends one
        if (data.data) {
          localStorage.setItem("token", data.data);
        }

        // Redirect to homepage
        window.location.href = "/homepage-registeredusers";
      } else {
        alert(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.message || "Login failed. Please try again later.");
    }
  };

  // Back button
  const handleBack = () => {
    navigate("/");
  };

  return (
    <div>
      <Navbar />
      <div className="login-container">
        <div className="login-image">
          <img
            src="https://assets-global.website-files.com/5d2fb52b76aabef62647ed9a/6195c8e178a99295d45307cb_allgreen1000-550.jpg"
            alt="Login"
            className="img-login"
          />
        </div>
        <div className="login-inner-container">
          <form onSubmit={handleSubmit}>
            <h3>Sign In</h3>

            <div className="email">
              <label>Email address</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>

            <div className="password">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
            </div>

            <div className="role">
              <label>Role</label>
              <select
                className="form-control"
                onChange={(e) => setUserRole(e.target.value)}
                value={userRole}
              >
                <option value="">Select Role</option>
                <option value="Farmer">Farmer</option>
                <option value="Seller">Seller</option>
                <option value="Deliveryman">Deliveryman</option>
              </select>
            </div>

            <div className="checkbox-container">
              <input type="checkbox" className="checkbox" id="customCheck1" />
              <label className="text" htmlFor="customCheck1">
                Remember me
              </label>
            </div>

            <div className="login-button-container">
              <button type="submit" className="login-button">
                Submit
              </button>
            </div>

            <div className="back-button-container" style={{ marginTop: "10px" }}>
              <button type="button" className="back-button" onClick={handleBack}>
                Back to Home
              </button>
            </div>

            <p className="text-register">
              Don't have an account? <a href="/register">Sign Up</a>
            </p>
          </form>
        </div>
      </div>
      <FooterNew />
    </div>
  );
}

export default Login;
