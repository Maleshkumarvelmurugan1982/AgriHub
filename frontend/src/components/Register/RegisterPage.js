import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import "./RegisterPage.css";
import Navbar from "../Navbar/Navbar";

export default function SignUp() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: data.userRole,
          fname: data.fname,
          lname: data.lname,
          district: data.district,
        }),
      });

      // Safely parse JSON
      let result;
      try {
        result = await response.json();
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        alert("Server returned an invalid response. Please try again later.");
        return;
      }

      if (result.status === "ok") {
        alert("Registration Successful");
        navigate("/login");
      } else {
        alert(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again later.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="signup-container">
        <div className="signup-inner-container">
          <form onSubmit={handleSubmit(onSubmit)}>
            <h3>Sign Up</h3>

            <div className="select-role">
              <label>Role</label>
              <select {...register("userRole", { required: true })}>
                <option value="">Select Role</option>
                <option value="Farmer">Farmer</option>
                <option value="Seller">Seller</option>
                <option value="Deliveryman">Deliveryman</option>
              </select>
              {errors.userRole && <span className="error">Role is required</span>}
            </div>

            <div className="first-name">
              <label>First name</label>
              <input type="text" placeholder="First name" {...register("fname", { required: true })} />
              {errors.fname && <span className="error">First name is required</span>}
            </div>

            <div className="last-name">
              <label>Last name</label>
              <input type="text" placeholder="Last name" {...register("lname", { required: true })} />
              {errors.lname && <span className="error">Last name is required</span>}
            </div>

            <div className="email">
              <label>Email address</label>
              <input type="email" placeholder="Enter email" {...register("email", { required: true })} />
              {errors.email && <span className="error">Email is required</span>}
            </div>

            <div className="password">
              <label>Password</label>
              <input type="password" placeholder="Enter password" {...register("password", { required: true, minLength: 6 })} />
              {errors.password && <span className="error">Password must be at least 6 characters</span>}
            </div>

            <div className="district">
              <label>District</label>
              <select {...register("district", { required: true })}>
                <option value="">Select District</option>
                <option value="virudhunagar">Virudhunagar</option>
                <option value="coimbatore">Coimbatore</option>
                <option value="madurai">Madurai</option>
                <option value="chennai">Chennai</option>
              </select>
              {errors.district && <span className="error">District is required</span>}
            </div>

            <div className="sign-up">
              <button type="submit" className="sign-up-button">Sign Up</button>
            </div>

            <div className="back-home">
              <Link to="/"><button type="button" className="back-home-button">Back to Home</button></Link>
            </div>

            <p className="forgot-password text-right">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>

        <div className="signup-image">
          <img
            src="https://assets-global.website-files.com/5d2fb52b76aabef62647ed9a/6195c8e178a99295d45307cb_allgreen1000-550.jpg"
            alt="Signup"
            className="img-signup"
          />
        </div>
      </div>
    </div>
  );
}
