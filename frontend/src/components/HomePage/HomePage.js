import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./HomePage.css";
import Categories from "../Catoegories/Categories"; // fixed folder name typo
import TypeWriter from "../AutoWritingText/TypeWriter";
import Video from "../ProcessLine/Video";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import KeyFeatures from "../KeyFeatures/KeyFeatures";
import FooterNew from "../Footer/FooterNew";

function HomePage() {
  const [buttonPopup, setButtonPopup] = useState(false);

  return (
    <div>
      <Navbar />

      <img
        src={process.env.PUBLIC_URL + "/Navbar/walll.jpg"}
        alt="AgriHub background"
        className="crop"
      />

      <div className="type-writer-container">
        <TypeWriter
          text="Welcome to AgriHub Digital Marketplace"
          textStyle={{
            fontFamily: "Gill Sans",
            fontSize: "20px",
          }}
        />
      </div>

      <div className="overlay-rectangle"></div>

      <div className="overlay-content">
        <p className="overlay-paragraph">Who Are You?</p>
        <a className="profile" href="/farmer">
          <img
            src={process.env.PUBLIC_URL + "/Profile/farmer.png"}
            alt="Farmer profile"
            className="img-user"
          />
        </a>
        <p className="profile-name">Farmer</p>

        <a className="profile" href="/seller">
          <img
            src={process.env.PUBLIC_URL + "/Profile/seller.png"}
            alt="Seller profile"
            className="img-user"
          />
        </a>
        <p className="profile-name">Seller</p>

        <a className="profile" href="/deliveryman">
          <img
            src={process.env.PUBLIC_URL + "/Profile/delivery.png"}
            alt="Deliveryman profile"
            className="img-user"
          />
        </a>
        <p className="profile-name">DeliveryMan</p>
        <a className="profile" href="/GovernmentPage">
          <img
            src={process.env.PUBLIC_URL + "/Profile/both.png"}
            alt="Deliveryman profile"
            className="img-user"
          />
        </a>
        <p className="profile-name">Government</p>

      </div>

      <div className="button-container">
        <button
          onClick={() => {
            window.location.href = "/register"; // use relative URL
          }}
          className="button-register"
        >
          Join Now
        </button>
      </div>

      {/* About Section with id for anchor */}
      <section id="about-section">
        <div className="welcome-text">
          <span className="welcome">Welcome to</span>{" "}
          <span className="AgriHub">AgriHub!</span>
        </div>

        <div className="main-paragraph">
          <p>
            Welcome to AgriHub, your digital marketplace for a bounty of fresh,
            locally-sourced fruits and vegetables. Our user-friendly platform
            ensures a hassle-free experience, allowing you to explore, connect,
            and purchase with confidence. From farm to table, AgriHub is
            committed to fostering community, supporting local agriculture, and
            delivering a harvest of quality right to your doorstep.
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <Categories />

      {/* How It Works Section */}
      <div className="how-it-works">
        <span className="welcome">How It</span>{" "}
        <span className="AgriHub">Works</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          AgriHub is designed to connect farmers, sellers, and buyers in a
          seamless digital environment, ensuring transparency and quality
          throughout the supply chain.
        </p>
      </div>

      <div className="video-container">
        <Video />
      </div>

      {/* Our Solution Section */}
      <div className="our-solution">
        <span className="welcome">Our</span>{" "}
        <span className="AgriHub">Solution</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          AgriHub is a digital B2B market solution that brings together Farmers
          and Industrial Buyers. Agri Marketplace does not buy or sell crops and
          is not a broker. Instead, we offer you the ability to effortlessly
          market your crop via our platform.
        </p>
      </div>

      <div className="all">
        <img
          src={process.env.PUBLIC_URL + "/Homepage/all.png"}
          alt="AgriHub Market"
          className="all-image"
        />
      </div>

      {/* Pricing Section */}
      <div className="our-solution">
        <span className="welcome">Our</span>{" "}
        <span className="AgriHub">Pricing</span>
      </div>

      <div className="how-it-works-paragraph">
        <ul className="list-content">
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> All
            users who prefer to post orders, have to pay a small fee to AgriHub.
          </li>
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> The
            first order is free of charge for all users and charges apply after
            the first bid.
          </li>
          <li>
            <FontAwesomeIcon icon={faCheck} style={{ color: "green" }} /> Deliverymen
            can post their details, and if they update the bid, a small charge
            applies.
          </li>
        </ul>
      </div>

      <div className="all">
        <img
          src="https://agrimp.com/assets/icons/grain_bag_en-35a97c53a2457418423528885a62a4c2d52f0427241fa798c2f80432caf10b99.png"
          alt="Pricing Icon"
          className="price-image"
        />
      </div>

      {/* Key Features Section */}
      <div className="our-solution">
        <span className="welcome">Key</span>{" "}
        <span className="AgriHub">Features</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          Discover how AgriHub Marketplace can benefit you and all other food
          supply chain actors.
        </p>
      </div>

      <KeyFeatures />

      {/* Get Started Section */}
      <div className="our-solution">
        <span className="welcome">Get</span>{" "}
        <span className="AgriHub">Started</span>
      </div>

      <div className="how-it-works-paragraph">
        <p>
          We open the door to thousands of approved buyers and sellers. Post your
          crop bid as a registered buyer, or create your crop offer as a platform
          verified seller. Through our rigorous customer compliance, we make sure
          that only reliable users gain access to our digital marketplace. There
          are two ways to get started:
        </p>
      </div>

      <div className="register-container">
        <button
          onClick={() => setButtonPopup(true)}
          className="button-register"
        >
          Register Now
        </button>
      </div>

      {/* Footer */}
      <FooterNew />
    </div>
  );
}

export default HomePage;
