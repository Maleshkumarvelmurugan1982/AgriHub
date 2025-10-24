import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RegDeliverymanPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faTruck,
  faInfoCircle,
  faMoneyBillWave,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegDeliverymanPage({ deliverymanId }) {
  const [sellerOrders, setSellerOrders] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [salary, setSalary] = useState(0);
  const [showSalary, setShowSalary] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_BASE = "https://agrihub-2.onrender.com";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Fetch seller orders
        const sellerResponse = await axios.get(`${API_BASE}/sellerorder/`);
        const approvedSellerOrders = (sellerResponse.data ?? [])
          .filter(order => order.farmerApproved === true || order.status === "approved")
          .map(order => ({
            ...order,
            acceptedByDeliveryman: order.acceptedByDeliveryman || false,
            deliveryStatus: order.deliveryStatus || "pending",
          }));
        setSellerOrders(approvedSellerOrders);

        // Fetch farmer orders
        const farmerResponse = await axios.get(`${API_BASE}/farmerorder/`);
        const approvedFarmerOrders = (farmerResponse.data ?? [])
          .filter(order => order.farmerApproved === true || order.status === "approved")
          .map(order => ({
            ...order,
            acceptedByDeliveryman: order.acceptedByDeliveryman || false,
            deliveryStatus: order.deliveryStatus || "pending",
          }));
        setFarmerOrders(approvedFarmerOrders);

        // Fetch salary
        if (deliverymanId) {
          const salaryResponse = await axios.get(`${API_BASE}/salary/${deliverymanId}`);
          setSalary(salaryResponse.data.salary ?? 0);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setSellerOrders([]);
        setFarmerOrders([]);
        setSalary(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [deliverymanId]);

  // Handle deliveryman accepting order
  const handleAcceptDelivery = async (orderId, type) => {
    try {
      console.log(`Accepting ${type} order ${orderId}`);
      const url =
        type === "seller"
          ? `${API_BASE}/sellerorder/${orderId}/accept`
          : `${API_BASE}/farmerorder/${orderId}/accept`;

      const response = await axios.put(url, { deliverymanId });
      console.log("Accept response:", response.data);

      if (type === "seller") {
        setSellerOrders(prev =>
          prev.map(order =>
            order._id === orderId
              ? { ...order, acceptedByDeliveryman: true, deliveryStatus: "approved" }
              : order
          )
        );
      } else {
        setFarmerOrders(prev =>
          prev.map(order =>
            order._id === orderId
              ? { ...order, acceptedByDeliveryman: true, deliveryStatus: "approved" }
              : order
          )
        );
      }

      alert("✅ Order accepted successfully!");
    } catch (err) {
      console.error("Error accepting delivery:", err);
      console.error("Error response:", err.response?.data);
      alert(`Failed to accept order: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle delivery status update (delivered / not-delivered)
  const handleDeliveryStatus = async (orderId, type, status) => {
    try {
      console.log(`Attempting to update ${type} order ${orderId} to status: ${status}`);

      const url =
        type === "seller"
          ? `${API_BASE}/sellerorder/${orderId}/status`
          : `${API_BASE}/farmerorder/${orderId}/status`;

      console.log(`Making PUT request to: ${url}`);
      console.log("Request body:", { status });

      const response = await axios.put(url, { status });
      console.log("✅ Backend update successful:", response.data);

      if (type === "seller") {
        setSellerOrders(prev =>
          prev.map(order => (order._id === orderId ? { ...order, deliveryStatus: status } : order))
        );
      } else {
        setFarmerOrders(prev =>
          prev.map(order => (order._id === orderId ? { ...order, deliveryStatus: status } : order))
        );
      }

      alert(`✅ Order status updated to ${status} successfully!`);
    } catch (err) {
      console.error("❌ Error updating delivery status:", err);
      if (err.response) {
        alert(`Failed to update: ${err.response.data?.message || "Server error"}`);
      } else if (err.request) {
        alert("Failed to update: No response from server. Check if backend is running.");
      } else {
        alert(`Failed to update: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
  }

  const renderDeliveryStatusBadge = status => {
    if (status === "delivered") {
      return (
        <div className="status-badge delivered-badge">
          <FontAwesomeIcon icon={faCheckCircle} /> Delivered
        </div>
      );
    } else if (status === "not-delivered") {
      return (
        <div className="status-badge not-delivered-badge">
          <FontAwesomeIcon icon={faTimesCircle} /> Not Delivered
        </div>
      );
    }
    return null;
  };

  const renderOrders = (orders, type) => {
    return (
      <div className="orders-container">
        {orders.map(order => (
          <div key={order._id} className="order-item">
            <img
              src={`${API_BASE}${order.productImage}`}
              alt={order.item}
              className="order-image"
            />
            <p>{order.item}</p>
            <p>Quantity: {order.quantity}</p>
            <p>Pickup: {type === "seller" ? "Seller" : "Farmer"}</p>
            <p>Deliver To: Buyer</p>

            {!order.acceptedByDeliveryman && (
              <button className="cart-button" onClick={() => handleAcceptDelivery(order._id, type)}>
                <FontAwesomeIcon icon={faTruck} /> Accept Delivery
              </button>
            )}

            {order.acceptedByDeliveryman && (
              <>
                <button className="cart-button approved-button" disabled>
                  <FontAwesomeIcon icon={faTruck} /> You Approved Delivery
                </button>

                {order.deliveryStatus === "approved" && (
                  <div className="delivery-status-buttons">
                    <button
                      className="delivered-button"
                      onClick={() => handleDeliveryStatus(order._id, type, "delivered")}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> Delivered
                    </button>
                    <button
                      className="not-delivered-button"
                      onClick={() => handleDeliveryStatus(order._id, type, "not-delivered")}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Not Delivered
                    </button>
                  </div>
                )}

                {(order.deliveryStatus === "delivered" || order.deliveryStatus === "not-delivered") &&
                  renderDeliveryStatusBadge(order.deliveryStatus)}
              </>
            )}

            <button className="supply-button">
              <FontAwesomeIcon icon={faInfoCircle} /> More Info
            </button>
          </div>
        ))}
      </div>
    );
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
          textStyle={{ fontFamily: "Gill Sans", fontSize: "60px" }}
        />
      </div>

      <div className="categories-container">
        <div className="categories-div">
          <RegCategories />
        </div>
      </div>

      <div className="salary-section" style={{ margin: "20px", textAlign: "center" }}>
        <button className="view-salary-button" onClick={() => setShowSalary(true)}>
          <FontAwesomeIcon icon={faMoneyBillWave} /> Your Salary Provided by Government
        </button>
      </div>

      {showSalary && (
        <div className="salary-modal">
          <div className="salary-content">
            <h2>Your Salary Provided by Government</h2>
            <p>Your salary is: <strong>${salary}</strong></p>
            <button onClick={() => setShowSalary(false)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="nothing2"></div>

      <div className="topic">
        <p>Farmer Approved Seller Orders to Deliver</p>
      </div>
      <div className="orders-wrapper">{renderOrders(sellerOrders, "seller")}</div>

      <div className="nothing2"></div>

      <div className="topic">
        <p>Farmer Approved Orders to Deliver</p>
      </div>
      <div className="orders-wrapper">{renderOrders(farmerOrders, "farmer")}</div>

      <FooterNew />
    </div>
  );
}

export default RegDeliverymanPage;
