import React, { useState, useEffect } from "react";
import axios from "axios";
import "./RegDeliverymanPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Fetch seller orders
        const sellerResponse = await axios.get("https://agrihub-2.onrender.com/sellerorder/");
        const approvedSellerOrders = (sellerResponse.data ?? [])
          .filter((order) => order.farmerApproved === true || order.status === "approved")
          .map((order) => ({
            ...order,
            acceptedByDeliveryman: order.acceptedByDeliveryman || false,
            deliveryStatus: order.deliveryStatus || "pending",
          }));
        setSellerOrders(approvedSellerOrders);

        // Fetch farmer orders
        const farmerResponse = await axios.get("https://agrihub-2.onrender.com/farmerorder/");
        const approvedFarmerOrders = (farmerResponse.data ?? [])
          .filter((order) => order.farmerApproved === true || order.status === "approved")
          .map((order) => ({
            ...order,
            acceptedByDeliveryman: order.acceptedByDeliveryman || false,
            deliveryStatus: order.deliveryStatus || "pending",
          }));
        setFarmerOrders(approvedFarmerOrders);

        // Fetch salary only if deliverymanId exists
        if (deliverymanId) {
          try {
            const salaryResponse = await axios.get(
              `https://agrihub-2.onrender.com/salary/${deliverymanId}`
            );
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

    fetchOrders();
  }, [deliverymanId]);

  // Handle deliveryman accepting order - Uses tempDeliverymanId
  const handleAcceptDelivery = async (orderId, type) => {
    try {
      console.log(`Accepting ${type} order ${orderId}`);

      // Use the temporary deliveryman ID
      const requestBody = { 
        deliverymanId: tempDeliverymanId
      };

      if (type === "seller") {
        const response = await axios.put(
          `https://agrihub-2.onrender.com/sellerorder/${orderId}/accept`,
          requestBody
        );
        console.log("Accept response:", response.data);

        setSellerOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? { ...order, acceptedByDeliveryman: true, deliveryStatus: "approved" }
              : order
          )
        );
      } else {
        const response = await axios.put(
          `https://agrihub-2.onrender.com/farmerorder/${orderId}/accept`,
          requestBody
        );
        console.log("Accept response:", response.data);

        setFarmerOrders((prev) =>
          prev.map((order) =>
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

  // Handle delivery status update
  const handleDeliveryStatus = async (orderId, type, status) => {
    try {
      console.log(`Attempting to update ${type} order ${orderId} to status: ${status}`);

      const url =
        type === "seller"
          ? `https://agrihub-2.onrender.com/sellerorder/${orderId}/status`
          : `https://agrihub-2.onrender.com/farmerorder/${orderId}/status`;

      console.log(`Making PUT request to: ${url}`);
      console.log("Request body:", { status });

      const response = await axios.put(url, { status });

      console.log("✅ Backend update successful:", response.data);

      if (type === "seller") {
        setSellerOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, deliveryStatus: status } : order
          )
        );
      } else {
        setFarmerOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, deliveryStatus: status } : order
          )
        );
      }

      alert(`✅ Order status updated to ${status} successfully!`);
    } catch (err) {
      console.error("❌ Error updating delivery status:", err);

      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        alert(`Failed to update: ${err.response.data?.message || "Server error"}`);
      } else if (err.request) {
        console.error("No response received:", err.request);
        alert("Failed to update: No response from server. Check if backend is running.");
      } else {
        console.error("Error message:", err.message);
        alert(`Failed to update: ${err.message}`);
      }
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>;
  }

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

  const renderOrders = (orders, type) => {
    console.log(
      `Rendering ${type} orders:`,
      orders.map((o) => ({
        id: o._id,
        item: o.item,
        accepted: o.acceptedByDeliveryman,
        status: o.deliveryStatus,
      }))
    );

    return (
      <div className="orders-container">
        {orders.map((order) => {
          console.log(`Order ${order._id}:`, {
            accepted: order.acceptedByDeliveryman,
            status: order.deliveryStatus,
          });

          return (
            <div key={order._id} className="order-item">
              <img
                src={`https://agrihub-2.onrender.com${order.productImage}`}
                alt={order.item}
                className="order-image"
              />
              <p>{order.item}</p>
              <p>Quantity: {order.quantity}</p>
              <p>Pickup: {type === "seller" ? "Seller" : "Farmer"}</p>
              <p>Deliver To: Buyer</p>

              {!order.acceptedByDeliveryman && (
                <button
                  className="cart-button"
                  onClick={() => handleAcceptDelivery(order._id, type)}
                >
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
                        onClick={() =>
                          handleDeliveryStatus(order._id, type, "delivered")
                        }
                      >
                        <FontAwesomeIcon icon={faCheckCircle} /> Delivered
                      </button>
                      <button
                        className="not-delivered-button"
                        onClick={() =>
                          handleDeliveryStatus(order._id, type, "not-delivered")
                        }
                      >
                        <FontAwesomeIcon icon={faTimesCircle} /> Not Delivered
                      </button>
                    </div>
                  )}

                  {(order.deliveryStatus === "delivered" ||
                    order.deliveryStatus === "not-delivered") &&
                    renderDeliveryStatusBadge(order.deliveryStatus)}
                </>
              )}

              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle} /> More Info
              </button>
            </div>
          );
        })}
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

      {/* Salary Section - Only show if deliverymanId exists */}
      {deliverymanId && (
        <div className="salary-section" style={{ margin: "20px", textAlign: "center" }}>
          <button className="view-salary-button" onClick={() => setShowSalary(true)}>
            <FontAwesomeIcon icon={faMoneyBillWave} /> Your Salary Provided by Government
          </button>
        </div>
      )}

      {showSalary && (
        <div className="salary-modal">
          <div className="salary-content">
            <h2>Your Salary Provided by Government</h2>
            <p>
              Your salary is: <strong>${salary}</strong>
            </p>
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
