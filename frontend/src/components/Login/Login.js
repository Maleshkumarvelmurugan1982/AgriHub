import "./login.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import Navbar from "../Navbar/Navbar";
import FooterNew from "../Footer/FooterNew";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !userRole) {
      alert("Please fill in all fields.");
      return;
    }

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
        alert("Invalid user role selected.");
        return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include", // Include cookies if backend uses sessions
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, userRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log(data, "userLogin");

      if (data.status === "ok") {
        alert("Login successful");
        localStorage.setItem("token", data.data); // Store token
        navigate("/homepage-registeredusers"); // Navigate programmatically
      } else {
        alert(data.message || "Login failed. Check credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again later.");
    }
  };

  const handleBack = () => navigate("/"); // Go back to home

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="password">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="role">
              <label>Role</label>
              <select
                className="form-control"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                required
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
