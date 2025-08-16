import React, { useState, useEffect } from "react";
import "./RegDeliverymanPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faTruck,
  faShoppingCart,
  faInfoCircle,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegDeliverymanPage() {
  const [sellerOrders, setSellerOrders] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [showSalary, setShowSalary] = useState(false);
  const [calculatedSalary, setCalculatedSalary] = useState(0);

  // Constraints for salary calculation (example)
  const SALARY_PER_DELIVERY = 10; // e.g., $10 per delivery

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

    fetchSellerOrders();
    fetchFarmerOrders();
  }, []);

  const handleViewSalary = () => {
    // Example constraint: sum of seller and farmer orders
    const totalDeliveries = sellerOrders.length + farmerOrders.length;

    // Calculate salary based on constraint
    const salary = totalDeliveries * SALARY_PER_DELIVERY;

    setCalculatedSalary(salary);
    setShowSalary(true);
  };

  return (
    <div>
      <NavbarRegistered />
      <div className="nothing"></div>

      <div className="crop-container">
        <img
          src="https://images.unsplash.com/photo-1581094288337-3346a1c19138"
          alt="delivery-banner"
          className="crop-image"
        />
      </div>

      <div className="type-writer-container">
        <TypeWriter
          text="Welcome Delivery Partners!"
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

      {/* Button to view salary */}
      <div className="salary-section" style={{ margin: "20px", textAlign: "center" }}>
        <button className="view-salary-button" onClick={handleViewSalary}>
          <FontAwesomeIcon icon={faMoneyBillWave} /> View Salary
        </button>
      </div>

      {/* Display salary info in a modal or section */}
      {showSalary && (
        <div className="salary-modal">
          <div className="salary-content">
            <h2>Your Estimated Salary</h2>
            <p>Based on your deliveries, your salary is: <strong>${calculatedSalary}</strong></p>
            <button onClick={() => setShowSalary(false)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="nothing2"></div>

      <div className="topic">
        <p>Seller Orders to Deliver</p>
      </div>

      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrders.slice(0, 4).map((order, index) => (
            <div key={index} className="order-item">
              <img
                src={order.productImage}
                alt={order.item}
                className="order-image"
              />
              <p>{order.item}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Pickup: Seller</p>
              <p>Deliver To: Buyer</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faTruck} /> Accept Delivery
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle} /> More Info
              </button>
            </div>
          ))}
        </div>
        {sellerOrders.length > 4 && (
          <a href="/sellerorder" className="view-all-button1">
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </a>
        )}
      </div>

      <div className="nothing2"></div>

      <div className="topic">
        <p>Farmer Orders to Deliver</p>
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
              <p>Pickup: Farmer</p>
              <p>Deliver To: Buyer</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faTruck} /> Accept Delivery
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle} /> More Info
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

      <FooterNew />
    </div>
  );
}

export default RegDeliverymanPage;