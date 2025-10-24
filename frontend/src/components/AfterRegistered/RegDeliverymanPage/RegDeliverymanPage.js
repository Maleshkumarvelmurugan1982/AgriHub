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

// Production API URL
const API_URL = "https://agrihub-2.onrender.com";

function RegDeliverymanPage({ deliverymanId: propDeliverymanId }) {
  const [sellerOrders, setSellerOrders] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [salary, setSalary] = useState(0);
  const [showSalary, setShowSalary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliverymanId, setDeliverymanId] = useState(null);

  // Get deliveryman ID from multiple sources
  useEffect(() => {
    const getUserId = () => {
      // Priority 1: From props
      if (propDeliverymanId) {
        console.log("✅ Using deliveryman ID from props:", propDeliverymanId);
        return propDeliverymanId;
      }

      // Priority 2: From localStorage user object
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const userId = user._id || user.id || user.userId;
          if (userId) {
            console.log("✅ Using deliveryman ID from localStorage user:", userId);
            return userId;
          }
        } catch (err) {
          console.error("Error parsing user from localStorage:", err);
        }
      }

      // Priority 3: From localStorage direct ID
      const directId = localStorage.getItem('deliverymanId') || 
                       localStorage.getItem('userId') ||
                       localStorage.getItem('_id');
      if (directId) {
        console.log("✅ Using deliveryman ID from localStorage direct:", directId);
        return directId;
      }

      console.error("❌ No deliveryman ID found in props or localStorage");
      return null;
    };

    const id = getUserId();
    setDeliverymanId(id);
  }, [propDeliverymanId]);

  useEffect(() => {
    if (deliverymanId) {
      fetchOrders();
    }
  }, [deliverymanId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Fetch seller orders
      const sellerResponse = await axios.get(`${API_URL}/sellerorder/`);
      const approvedSellerOrders = (sellerResponse.data ?? [])
        .filter(order => order.farmerApproved === true || order.status === "approved")
        .map(order => ({
          ...order,
          acceptedByDeliveryman: order.acceptedByDeliveryman || false,
          deliveryStatus: order.deliveryStatus || "pending",
        }));
      setSellerOrders(approvedSellerOrders);

      // Fetch farmer orders
      const farmerResponse = await axios.get(`${API_URL}/farmerorder/`);
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
        try {
          const salaryResponse = await axios.get(`${API_URL}/salary/${deliverymanId}`);
          setSalary(salaryResponse.data.salary ?? 0);
        } catch (salaryErr) {
          console.warn("Could not fetch salary:", salaryErr);
          setSalary(0);
        }
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

  // Handle deliveryman accepting order
  const handleAcceptDelivery = async (orderId, type) => {
    try {
      console.log(`Accepting ${type} order ${orderId}`);
      
      // Validate deliverymanId
      if (!deliverymanId) {
        alert("❌ Deliveryman ID is missing. Please log in again.");
        console.error("❌ deliverymanId is null or undefined");
        return;
      }

      console.log(`Sending deliverymanId: ${deliverymanId}`);
      
      // Persist in backend
      const url = type === "seller" 
        ? `${API_URL}/sellerorder/${orderId}/accept`
        : `${API_URL}/farmerorder/${orderId}/accept`;

      const response = await axios.put(
        url,
        { deliverymanId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ ${type} order accept response:`, response.data);
      
      // Refresh orders from backend to get latest state
      await fetchOrders();
      
      alert("✅ Order accepted successfully!");
    } catch (err) {
      console.error("❌ Error accepting delivery:", err);
      console.error("Error response:", err.response?.data);
      
      if (err.response) {
        alert(`❌ Failed to accept order: ${err.response.data?.message || 'Server error'}`);
      } else if (err.request) {
        alert("❌ Failed to accept order: No response from server. Check if backend is running.");
      } else {
        alert(`❌ Failed to accept order: ${err.message}`);
      }
    }
  };

  // Handle delivery status update (delivered / not-delivered)
  const handleDeliveryStatus = async (orderId, type, status) => {
    try {
      console.log(`Attempting to update ${type} order ${orderId} to status: ${status}`);
      
      // Validate deliverymanId
      if (!deliverymanId) {
        alert("❌ Deliveryman ID is missing. Please log in again.");
        return;
      }
      
      // Persist in backend FIRST
      const url = type === "seller" 
        ? `${API_URL}/sellerorder/${orderId}/status`
        : `${API_URL}/farmerorder/${orderId}/status`;
      
      console.log(`Making PUT request to: ${url}`);
      console.log(`Request body:`, { status, deliverymanId });
      
      const response = await axios.put(
        url,
        { status, deliverymanId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Backend update successful:`, response.data);

      // Refresh orders from backend to get latest state
      await fetchOrders();

      alert(`✅ Order status updated to ${status} successfully!`);
    } catch (err) {
      console.error("❌ Error updating delivery status:", err);
      
      if (err.response) {
        // Server responded with error
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        alert(`❌ Failed to update: ${err.response.data?.message || 'Server error'}`);
      } else if (err.request) {
        // Request made but no response
        console.error("No response received:", err.request);
        alert("❌ Failed to update: No response from server. Check if backend is running.");
      } else {
        // Something else happened
        console.error("Error message:", err.message);
        alert(`❌ Failed to update: ${err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div>
        <NavbarRegistered />
        <p style={{ textAlign: "center", marginTop: "50px", fontSize: "18px" }}>
          Loading orders...
        </p>
      </div>
    );
  }

  // Render delivery status badge
  const renderDeliveryStatusBadge = (status) => {
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

  // Render orders
  const renderOrders = (orders, type) => {
    console.log(`Rendering ${type} orders:`, orders.map(o => ({
      id: o._id,
      item: o.item,
      accepted: o.acceptedByDeliveryman,
      status: o.deliveryStatus
    })));

    if (orders.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>No orders available at the moment.</p>
        </div>
      );
    }

    return (
      <>
        <div className="orders-container">
          {orders.map((order) => {
            console.log(`Order ${order._id}:`, {
              accepted: order.acceptedByDeliveryman,
              status: order.deliveryStatus
            });

            return (
              <div key={order._id} className="order-item">
                <img
                  src={`${API_URL}${order.productImage}`}
                  alt={order.item}
                  className="order-image"
                />
                <p><strong>{order.item}</strong></p>
                <p>Quantity: {order.quantity}</p>
                <p>Pickup: {type === "seller" ? "Seller" : "Farmer"}</p>
                <p>Deliver To: Buyer</p>

                {/* Show Accept Delivery button if not yet accepted */}
                {!order.acceptedByDeliveryman && (
                  <button
                    className="cart-button"
                    onClick={() => handleAcceptDelivery(order._id, type)}
                  >
                    <FontAwesomeIcon icon={faTruck} /> Accept Delivery
                  </button>
                )}

                {/* Show status controls once accepted */}
                {order.acceptedByDeliveryman && (
                  <>
                    <button className="cart-button approved-button" disabled>
                      <FontAwesomeIcon icon={faTruck} /> You Approved Delivery
                    </button>

                    {/* Show Delivered/Not Delivered buttons if status is still "approved" */}
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

                    {/* Show final status badge if marked as delivered/not-delivered */}
                    {(order.deliveryStatus === "delivered" || order.deliveryStatus === "not-delivered") && 
                      renderDeliveryStatusBadge(order.deliveryStatus)
                    }
                  </>
                )}

                <button className="supply-button">
                  <FontAwesomeIcon icon={faInfoCircle} /> More Info
                </button>
              </div>
            );
          })}
        </div>
      </>
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

      {/* Debug Info - Remove this in production */}
      {!deliverymanId && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '15px', 
          margin: '20px', 
          borderRadius: '5px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ Warning: Deliveryman ID is not set. Please ensure you're logged in properly.
          <br />
          <small style={{ fontWeight: 'normal', marginTop: '10px', display: 'block' }}>
            Check browser console (F12) and type: localStorage.getItem('user')
          </small>
        </div>
      )}

      {/* Salary Section */}
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

      {/* Seller Orders */}
      <div className="topic">
        <p>Farmer Approved Seller Orders to Deliver</p>
      </div>
      <div className="orders-wrapper">{renderOrders(sellerOrders, "seller")}</div>

      <div className="nothing2"></div>

      {/* Farmer Orders */}
      <div className="topic">
        <p>Farmer Approved Orders to Deliver</p>
      </div>
      <div className="orders-wrapper">{renderOrders(farmerOrders, "farmer")}</div>

      <FooterNew />
    </div>
  );
}

export default RegDeliverymanPage;
