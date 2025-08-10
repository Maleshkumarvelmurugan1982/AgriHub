import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../NavbarRegistered/NavbarRegistered";
import "./RegUserHomePage.css";
import Categories from "../../Catoegories/Categories";
import Video from "../../ProcessLine/Video";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import KeyFeatures from "../../KeyFeatures/KeyFeatures";
import FooterNew from "../../Footer/FooterNew";

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
    <div>
      <Navbar />

      <img
        src="https://plantura.garden/uk/wp-content/uploads/sites/2/2022/04/corn-cob.jpg"
        alt="crop"
        className="crop"
      />

      <div className="salutation-container">
        <h2>Hello {userData?.fname || "User"}</h2>
      </div>

      <div className="profile-container">
        {userRole === "Farmer" && (
          <Link className="profile" to="/regfarmer">
            <img
              src="https://thumbs.dreamstime.com/b/cheerful-farmer-organic-vegetables-garden-76739182.jpg"
              alt="Farmer"
              className="profile-img"
            />
            <p className="section-name">Farmer Section</p>
          </Link>
        )}

        {userRole === "Seller" && (
          <Link className="profile" to="/regseller">
            <img
              src="https://t3.ftcdn.net/jpg/01/38/55/22/360_F_138552236_dsdw41w8tuC2vmEChEay78rcYj6K6VWa.jpg"
              alt="Seller"
              className="profile-img"
            />
            <p className="section-name">Seller Section</p>
          </Link>
        )}

        {userRole === "Deliveryman" && (
          <Link className="profile" to="/regdeliveryman">
            <img
              src="https://media.istockphoto.com/id/1311192458/photo/portrait-of-an-hispanic-man-doing-a-home-delivery.jpg?s=612x612&w=0&k=20&c=huHAUlFfmZeUku-h9SnMuz3-rS54Ml1rrNFKjeq60mo="
              alt="Deliveryman"
              className="profile-img"
            />
            <p className="section-name">Deliveryman Section</p>
          </Link>
        )}
      </div>

      <div className="welcome-text">
        <span className="welcome">Welcome to</span>{" "}
        <span className="cropxchange">CropXchange!</span>
      </div>

      <div className="main-paragraph">
        <p>
          Welcome to CropXchange, your digital marketplace for a bounty of fresh,
          locally-sourced fruits and vegetables. Our user-friendly platform
          ensures a hassle-free experience, allowing you to explore, connect,
          and purchase with confidence. From farm to table, CropXchange is
          committed to fostering community, supporting local agriculture, and
          delivering a harvest of quality right to your doorstep.
        </p>
      </div>

      <Categories />

      <div className="how-it-works">
        <span className="welcome">How It</span>{" "}
        <span className="cropxchange">Works</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          Welcome to CropXchange, your digital marketplace for a bounty of fresh,
          locally-sourced fruits and vegetables. Our user-friendly platform
          ensures a hassle-free experience, allowing you to explore, connect,
          and purchase with confidence. From farm to table, CropXchange is
          committed to fostering community, supporting local agriculture, and
          delivering a harvest of quality right to your doorstep.
        </p>
      </div>

      <div className="video-container">
        <Video />
      </div>

      <div className="our-solution">
        <span className="welcome">Our</span>{" "}
        <span className="cropxchange">Solution</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          CropXchange is a digital B2B market solution that brings together Farmers
          and Industrial Buyers. Agri Marketplace does not buy or sell crops and
          is not a broker. Instead, we offer you the ability to effortlessly market
          your crop via our platform.
        </p>
      </div>

      <div className="all">
        <img
          src={process.env.PUBLIC_URL + "/Homepage/all.png"}
          alt="all"
          className="all-image"
        />
      </div>

      <div className="our-solution">
        <span className="welcome">Our</span>{" "}
        <span className="cropxchange">Pricing</span>
      </div>

      <div className="how-it-works-paragraph">
        <ul className="list-content">
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> All
            users who prefer to post orders, have to pay a small fee to CropXchange.
          </li>
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> The
            first order is free of charge for all users and charges will be done
            after the first bid.
          </li>
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> For
            Deliverymen can post their details and if they update the bid, there
            is a small charge.
          </li>
        </ul>
      </div>

      <div className="all">
        <img
          src="https://agrimp.com/assets/icons/grain_bag_en-35a97c53a2457418423528885a62a4c2d52f0427241fa798c2f80432caf10b99.png"
          alt="pricing"
          className="price-image"
        />
      </div>

      <div className="our-solution">
        <span className="welcome">Key</span>{" "}
        <span className="cropxchange">Features</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          Discover how CropXchange Marketplace can benefit you and all other food
          supply chain actors.
        </p>
      </div>

      <KeyFeatures />

      <div className="our-solution">
        <span className="welcome">Get</span>{" "}
        <span className="cropxchange">Started</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          We open the door to thousands of approved buyers and sellers. Post your
          crop bid as a registered buyer, or create your crop offer as a platform
          verified seller. Through our rigorous customer compliance we make sure
          that only reliable users gain access to our digital marketplace. There
          are two ways to get started:
        </p>
      </div>

      <FooterNew />
    </div>
  );
}

export default RegUserHomePage;
