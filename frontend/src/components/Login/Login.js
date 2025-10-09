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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !userRole) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: userRole }),
      });

      const data = await res.json();
      if (data.status !== "ok") {
        alert(data.message);
        return;
      }

      const token = data.data.token;
      localStorage.setItem("token", token);

      const userRes = await fetch(`${process.env.REACT_APP_API_URL}/user/userdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const userData = await userRes.json();
      if (userData.status !== "ok") {
        alert("Failed to fetch user data");
        return;
      }

      localStorage.setItem("user", JSON.stringify(userData.data));
      alert("Login successful");

      switch (userRole) {
        case "Farmer":
          navigate("/farmer-dashboard");
          break;
        case "Seller":
          navigate("/seller-dashboard");
          break;
        case "Deliveryman":
          navigate("/deliveryman-dashboard");
          break;
        default:
          navigate("/homepage-registeredusers");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed. Please try again later.");
    }
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
                placeholder="Enter email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="password">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="role">
              <label>Role</label>
              <select onChange={(e) => setUserRole(e.target.value)}>
                <option value="">Select Role</option>
                <option value="Farmer">Farmer</option>
                <option value="Seller">Seller</option>
                <option value="Deliveryman">Deliveryman</option>
              </select>
            </div>

            <button type="submit" className="login-button">Submit</button>
            <button type="button" onClick={() => navigate("/")} className="back-button">Back to Home</button>

            <p className="text-register">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
      <FooterNew />
    </div>
  );
}

export default Login;
