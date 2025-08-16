import React, { useState, useEffect } from "react";
import "./RegSellerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faShoppingCart,
  faShoppingBag,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegSellerPage() {
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [deliveryPosts, setDeliveryPosts] = useState([]);

  useEffect(() => {
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

    fetchFarmerOrders();
    fetchDeliveryPosts();
  }, []);

  return (
    <div>
      <NavbarRegistered />
      <div className="nothing"></div>

      <div className="crop-container">
        <img
          src="https://www.atoallinks.com/wp-content/uploads/2020/07/Agriculture-Product-Buying-and-Selling-App-Development.jpg"
          alt="seller-banner"
          className="crop-image"
        />
      </div>

      <div className="type-writer-container">
        <TypeWriter
          text="Welcome Sellers!"
          loop={false}
          className="writer"
          textStyle={{
            fontFamily: "Gill Sans",
            fontSize: "60px",
          }}
        />
      </div>

      <div className="categories-container">
        <div className="categories-div">
          <RegCategories />
        </div>
      </div>

      <div className="nothing2"></div>
      <div className="topic">
        <p>Farmer Orders</p>
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
              <p>Posted: {order.postedDate}</p>
              <p>Expires: {order.expireDate}</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faShoppingBag} /> Supply
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

      <div className="topic">
        <p>Delivery Services</p>
      </div>

      <div className="orders-wrapper">
        <div className="orders-container">
          {deliveryPosts.slice(0, 4).map((post, index) => (
            <div key={index} className="order-item">
              <img
                src={post.vehicleImage}
                alt={post.model}
                className="order-image"
              />
              <p>{post.model}</p>
              <p>Capacity: {post.capacity} kg</p>
              <p>Price: Rs.{post.price}/km</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle} /> More Info
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

export default RegSellerPage;
