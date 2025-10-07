import React, { useState, useEffect } from "react";
import "./RegFarmerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../../AfterRegistered/RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faShoppingCart,
  faTruck,
  faShoppingBag,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function FarmerPage() {
  const [sellerOrders, setSellerOrders] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [deliveryPosts, setDeliveryPosts] = useState([]);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        const response = await fetch("http://localhost:8070/sellerorder/");
        const data = await response.json();
        setSellerOrders(data);
      } catch (error) {
        console.error("Error fetching seller orders:", error);
      }
    };

    const fetchFarmerOrders = async () => {
      try {
        const response = await fetch("http://localhost:8070/farmerorder/");
        const data = await response.json();
        setFarmerOrders(data);
      } catch (error) {
        console.error("Error fetching farmer orders:", error);
      }
    };

    const fetchDeliveryPosts = async () => {
      try {
        const response = await fetch("http://localhost:8070/deliverypost/");
        const data = await response.json();
        setDeliveryPosts(data);
      } catch (error) {
        console.error("Error fetching delivery posts:", error);
      }
    };

    const fetchSchemes = async () => {
      try {
        const response = await fetch("http://localhost:8070/schemes/");
        const data = await response.json();
        setSchemes(data);
      } catch (error) {
        console.error("Error fetching schemes:", error);
      }
    };

    fetchSellerOrders();
    fetchFarmerOrders();
    fetchDeliveryPosts();
    fetchSchemes();
  }, []);

  return (
    <div>
      <NavbarRegistered />

      {/* Hero Section */}
      <div className="crop-container">
        <img
          src="https://www.abers-tourisme.com/assets/uploads/sites/8/2022/12/vente-legumes.jpg"
          alt="farmers"
          className="crop-image"
        />
        <div className="type-writer-overlay">
          <TypeWriter
            text="Welcome Farmers!"
            loop={false}
            textStyle={{
              fontFamily: "Gill Sans",
              fontSize: "60px",
              color: "white",
              textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="categories-container">
        <div className="categories-div">
          <RegCategories />
        </div>
      </div>

      {/* Schemes */}
      <div className="topic">
        <p>Government Schemes</p>
      </div>
      <div className="schemes-wrapper">
        {schemes.length > 0 ? (
          schemes.map((scheme) => (
            <div key={scheme._id} className="scheme-item">
              <p className="scheme-title">{scheme.name}</p>
              <div className="scheme-buttons">
                <button className="apply-button">Apply</button>
                <button className="cancel-button">Cancel</button>
              </div>
            </div>
          ))
        ) : (
          <p>No schemes available right now.</p>
        )}
      </div>

      {/* Seller Orders */}
      <div className="topic">
        <p>Seller's Orders</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrders.slice(0, 4).map((order, index) => (
            <div key={index} className="order-item1">
              <img
                src={order.productImage}
                alt={order.item}
                className="order-image"
              />
              <p>{order.item}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Price: Rs.{order.price}</p>
              <p>Posted Date: {order.postedDate}</p>
              <p>Expires Date: {order.expireDate}</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faTruck} /> Supply
              </button>
            </div>
          ))}
        </div>
        {sellerOrders.length > 4 && (
          <a href="/sellerorder" className="view-all-button">
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </a>
        )}
      </div>

      {/* Farmer Orders */}
      <div className="topic">
        <p>Farmer's Orders</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {farmerOrders.slice(0, 4).map((order, index) => (
            <div key={index} className="order-item">
              <img
                src={order.productImage}
                alt={order.item}
                className="order-image"
              />
              <p>{order.item}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Price: Rs.{order.price}</p>
              <p>Posted Date: {order.postedDate}</p>
              <p>Expires Date: {order.expireDate}</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faShoppingBag} /> Buy Now
              </button>
            </div>
          ))}
        </div>
        {farmerOrders.length > 4 && (
          <a href="/farmerorder" className="view-all-button1">
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </a>
        )}
      </div>

      {/* Delivery Services */}
      <div className="topic">
        <p>Delivery Services</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {deliveryPosts.slice(0, 4).map((order, index) => (
            <div key={index} className="order-item">
              <img
                src={order.vehicleImage}
                alt={order.model}
                className="order-image"
              />
              <p>{order.model}</p>
              <p>Capacity: {order.capacity} kg</p>
              <p>Price: Rs.{order.price}/km</p>
              <p>Posted Date: {order.postedDate}</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle} /> More Details
              </button>
            </div>
          ))}
        </div>
        {deliveryPosts.length > 4 && (
          <a href="/deliverypost" className="view-all-button1">
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </a>
        )}
      </div>

      <FooterNew />
    </div>
  );
}

export default FarmerPage;
