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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email || !password || !userRole) {
      alert("Please fill in all fields.");
      return;
    }

    let url = "";

    switch (userRole) {
      case "Farmer":
        url = `${process.env.REACT_APP_API_URL}/farmer/login`;
        break;
      case "Seller":
        url = `${process.env.REACT_APP_API_URL}/seller/login`;
        break;
      case "Deliveryman":
        url = `${process.env.REACT_APP_API_URL}/deliveryman/login`;
        break;
      default:
        alert("Invalid role selected.");
        return;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        crossDomain: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ email, password, userRole }),
      });

      // Read response text first
      const text = await res.text();

      // Try parsing JSON safely
      let data = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error("Failed to parse JSON:", err, text);
          alert("Unexpected server response. Please try again later.");
          return;
        }
      } else {
        alert("Empty server response. Please try again later.");
        return;
      }

      console.log(data, "userRegister");

      if (data.status === "ok") {
        alert("Login successful");
        window.localStorage.setItem("token", data.data);
        navigate("/homepage-registeredusers"); // Use navigate for SPA routing
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Login failed. Please try again later.");
    }
  }

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
              />
            </div>

            <div className="password">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="role">
              <label>Role</label>
              <select
                className="form-control"
                onChange={(e) => setUserRole(e.target.value)}
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
              <button
                type="button"
                className="back-button"
                onClick={handleBack}
              >
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
