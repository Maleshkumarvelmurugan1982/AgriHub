import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../NavbarRegistered/NavbarRegistered";
import "./RegUserHomePage.css";

function RegUserHomePage() {
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      alert("You are not logged in. Please login first.");
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:8070/user/userdata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === "ok") {
          setUserData(data.data);
          setUserRole(data.data.userRole || "");
        } else {
          alert("Session expired or error. Please login again.");
          window.localStorage.clear();
          window.location.href = "/login";
        }
      })
      .catch((err) => {
        console.error("Error fetching user data:", err);
        alert("Error fetching user data, please try again.");
      });
  }, []);

  return (
    <div
      className="page-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/RegisterPage/harvest.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      <div className="profile-container">
        {userRole === "Farmer" && (
          <Link className="profile" to="/regfarmer">
            <img
              src="https://thumbs.dreamstime.com/b/cheerful-farmer-organic-vegetables-garden-76739182.jpg"
              alt="Farmer"
              className="profile-img"
            />
          </Link>
        )}

        {userRole === "Seller" && (
          <Link className="profile" to="/regseller">
            <img
              src="https://t3.ftcdn.net/jpg/01/38/55/22/360_F_138552236_dsdw41w8tuC2vmEChEay78rcYj6K6VWa.jpg"
              alt="Seller"
              className="profile-img"
            />
          </Link>
        )}

        {userRole === "Deliveryman" && (
          <Link className="profile" to="/regdeliveryman">
            <img
              src="https://media.istockphoto.com/id/1311192458/photo/portrait-of-an-hispanic-man-doing-a-home-delivery.jpg?s=612x612&w=0&k=20&c=huHAUlFfmZeUku-h9SnMuz3-rS54Ml1rrNFKjeq60mo="
              alt="Deliveryman"
              className="profile-img"
            />
          </Link>
        )}
      </div>
    </div>
  );
}

export default RegUserHomePage;
