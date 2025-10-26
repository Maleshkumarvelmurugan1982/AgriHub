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
  faHistory,
  faTimes,
  faUser,
  faShoppingCart
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegDeliverymanPage() {
  const [deliverymanId, setDeliverymanId] = useState("");
  const [availableSellerOrders, setAvailableSellerOrders] = useState([]);
  const [availableFarmerOrders, setAvailableFarmerOrders] = useState([]);
  const [mySellerOrders, setMySellerOrders] = useState([]);
  const [myFarmerOrders, setMyFarmerOrders] = useState([]);
  const [salary, setSalary] = useState(0);
  const [showSalary, setShowSalary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "http://localhost:8070";

  // Helper function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'https://via.placeholder.com/150?text=No+Image';
    }
    
    // If it's already a full URL (starts with http:// or https://), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path, prepend BASE_URL
    return `${BASE_URL}${imagePath}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get delivery history (all delivered orders)
  const getDeliveryHistory = () => {
    const sellerDeliveries = mySellerOrders.filter(order => 
      order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
    );
    const farmerDeliveries = myFarmerOrders.filter(order => 
      order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
    );
    
    return [...sellerDeliveries, ...farmerDeliveries].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  };

  const deliveryHistory = getDeliveryHistory();

  useEffect(() => {
    const fetchDeliverymanData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found - deliveryman not logged in");
          return;
        }

        const res = await fetch(`${BASE_URL}/deliveryman/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok" && data.data) {
          setDeliverymanId(data.data._id);
          console.log("✅ Logged-in Deliveryman ID:", data.data._id);
        } else {
          console.error("Failed to fetch deliveryman data:", data);
        }
      } catch (err) {
        console.error("Error fetching deliveryman data:", err);
      }
    };

    fetchDeliverymanData();
  }, []);

  useEffect(() => {
    if (!deliverymanId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);

        const availableSellerResponse = await axios.get(`${BASE_URL}/sellerorder/deliveryman/available`);
        const availableSellerData = Array.isArray(availableSellerResponse.data) 
          ? availableSellerResponse.data 
          : [];
        setAvailableSellerOrders(availableSellerData);

        try {
          const availableFarmerResponse = await axios.get(`${BASE_URL}/farmerorder/deliveryman/available`);
          const availableFarmerData = Array.isArray(availableFarmerResponse.data) 
            ? availableFarmerResponse.data 
            : [];
          setAvailableFarmerOrders(availableFarmerData);
        } catch (err) {
          setAvailableFarmerOrders([]);
        }

        const mySellerResponse = await axios.get(`${BASE_URL}/sellerorder/deliveryman/${deliverymanId}`);
        const mySellerData = Array.isArray(mySellerResponse.data) 
          ? mySellerResponse.data 
          : [];
        setMySellerOrders(mySellerData);

        try {
          const myFarmerResponse = await axios.get(`${BASE_URL}/farmerorder/deliveryman/${deliverymanId}`);
          const myFarmerData = Array.isArray(myFarmerResponse.data) 
            ? myFarmerResponse.data 
            : [];
          setMyFarmerOrders(myFarmerData);
        } catch (err) {
          setMyFarmerOrders([]);
        }

        try {
          const salaryResponse = await axios.get(`${BASE_URL}/salary/${deliverymanId}`);
          setSalary(salaryResponse.data.salary ?? 0);
        } catch (err) {
          setSalary(0);
        }

      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setAvailableSellerOrders([]);
        setAvailableFarmerOrders([]);
        setMySellerOrders([]);
        setMyFarmerOrders([]);
        setSalary(0);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
    
  }, [deliverymanId]);

  const handleAcceptDelivery = async (orderId, type) => {
    try {
      if (!deliverymanId) {
        alert("Please log in to accept orders");
        return;
      }

      if (type === "seller") {
        const response = await axios.put(`${BASE_URL}/sellerorder/${orderId}/accept`, { 
          deliverymanId 
        });
        
        const acceptedOrder = availableSellerOrders.find(o => o._id === orderId);
        if (acceptedOrder) {
          setMySellerOrders(prev => [...prev, { ...acceptedOrder, acceptedByDeliveryman: true, deliveryStatus: "in-transit" }]);
          setAvailableSellerOrders(prev => prev.filter(o => o._id !== orderId));
        }
      } else {
        const response = await axios.put(`${BASE_URL}/farmerorder/${orderId}/accept`, { 
          deliverymanId 
        });
        
        const acceptedOrder = availableFarmerOrders.find(o => o._id === orderId);
        if (acceptedOrder) {
          setMyFarmerOrders(prev => [...prev, { ...acceptedOrder, acceptedByDeliveryman: true, deliveryStatus: "in-transit" }]);
          setAvailableFarmerOrders(prev => prev.filter(o => o._id !== orderId));
        }
      }
      
      alert("✅ Order accepted successfully!");
      
    } catch (err) {
      console.error("❌ Error accepting delivery:", err);
      alert(`Failed to accept order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeliveryStatus = async (orderId, type, status) => {
    try {
      const url = type === "seller" 
        ? `${BASE_URL}/sellerorder/${orderId}/status`
        : `${BASE_URL}/farmerorder/${orderId}/status`;
      
      const response = await axios.put(url, { status });

      if (type === "seller") {
        setMySellerOrders(prev =>
          prev.map(order =>
            order._id === orderId ? { ...order, deliveryStatus: status } : order
          )
        );
      } else {
        setMyFarmerOrders(prev =>
          prev.map(order =>
            order._id === orderId ? { ...order, deliveryStatus: status } : order
          )
        );
      }

      alert(`✅ Order status updated to ${status} successfully!`);
      
    } catch (err) {
      console.error("❌ Error updating delivery status:", err);
      alert(`Failed to update: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) {
    return (
      <div>
        <NavbarRegistered />
        <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
      </div>
    );
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
    } else if (status === "in-transit") {
      return (
        <div className="status-badge in-transit-badge">
          <FontAwesomeIcon icon={faTruck} /> In Transit
        </div>
      );
    }
    return null;
  };

  const renderAvailableOrders = (orders, type) => {
    if (orders.length === 0) {
      return <p style={{ textAlign: "center", padding: "20px" }}>No available orders to accept</p>;
    }

    return (
      <div className="orders-container">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <img
              src={getImageUrl(order.productImage)}
              alt={order.item}
              className="order-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
            <p><strong>{order.item}</strong></p>
            <p>Quantity: {order.quantity} kg</p>
            <p>Price: Rs.{order.price}</p>
            {order.district && <p>District: {order.district}</p>}
            
            <button
              className="cart-button"
              onClick={() => handleAcceptDelivery(order._id, type)}
            >
              <FontAwesomeIcon icon={faTruck} /> Accept Delivery
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMyOrders = (orders, type) => {
    if (orders.length === 0) {
      return <p style={{ textAlign: "center", padding: "20px" }}>You haven't accepted any orders yet</p>;
    }

    return (
      <div className="orders-container">
        {orders.map((order) => (
          <div key={order._id} className="order-item">
            <img
              src={getImageUrl(order.productImage)}
              alt={order.item}
              className="order-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
            <p><strong>{order.item}</strong></p>
            <p>Quantity: {order.quantity} kg</p>
            <p>Price: Rs.{order.price}</p>
            {order.district && <p>District: {order.district}</p>}

            {renderDeliveryStatusBadge(order.deliveryStatus)}

            {(order.deliveryStatus === "in-transit" || order.deliveryStatus === "approved") && (
              <div className="delivery-status-buttons">
                <button
                  className="delivered-button"
                  onClick={() => handleDeliveryStatus(order._id, type, "delivered")}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Mark as Delivered
                </button>
                <button
                  className="not-delivered-button"
                  onClick={() => handleDeliveryStatus(order._id, type, "not-delivered")}
                >
                  <FontAwesomeIcon icon={faTimesCircle} /> Mark as Not Delivered
                </button>
              </div>
            )}
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
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/1200x400?text=Delivery+Banner';
          }}
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

      {showSalary && (
        <div className="salary-modal">
          <div className="salary-content">
            <h2>Your Salary Provided by Government</h2>
            <p>Your salary is: <strong>Rs.{salary}</strong></p>
            <button onClick={() => setShowSalary(false)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}

      {/* History Button */}
      <div className="history-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          className="history-button"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#f57c00'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#ff9800'}
        >
          <FontAwesomeIcon icon={faHistory} />
          {showHistory ? 'Hide History' : `View Delivery History (${deliveryHistory.length})`}
        </button>
      </div>

      {/* Delivery History Section */}
      {showHistory && (
        <div className="history-section" style={{
          margin: '20px auto',
          maxWidth: '1200px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>
              <FontAwesomeIcon icon={faHistory} /> Delivery History
            </h2>
            <button 
              onClick={() => setShowHistory(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {deliveryHistory.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', padding: '40px' }}>
              No delivery history yet. Your completed deliveries will appear here.
            </p>
          ) : (
            <div className="history-list">
              {deliveryHistory.map((order) => {
                const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
                const farmerName = hasFarmerInfo 
                  ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown Farmer'
                  : 'Unknown Farmer';

                const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
                const sellerName = hasSellerInfo 
                  ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() || 'Unknown Seller'
                  : 'Unknown Seller';

                return (
                  <div 
                    key={order._id} 
                    className="history-item"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '15px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'grid',
                      gridTemplateColumns: '150px 1fr',
                      gap: '20px'
                    }}
                  >
                    <img 
                      src={getImageUrl(order.productImage)}
                      alt={order.item}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                      }} 
                    />
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{order.item}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <p><strong>Quantity:</strong> {order.quantity} kg</p>
                        <p><strong>Price:</strong> Rs.{order.price}</p>
                        <p><strong>Status:</strong> <span style={{ color: 'green' }}>✓ DELIVERED</span></p>
                        <p><strong>Date:</strong> {formatDate(order.updatedAt || order.createdAt)}</p>
                      </div>
                      
                      {/* Delivery Route Information */}
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '15px', 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '5px',
                        borderLeft: '4px solid #2196f3'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                              <strong>FROM:</strong>
                            </p>
                            <p style={{ margin: '5px 0', fontSize: '16px', color: '#333' }}>
                              <FontAwesomeIcon icon={faUser} /> <strong>{farmerName}</strong>
                            </p>
                            {hasFarmerInfo && order.farmerId.mobile && (
                              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                                Contact: {order.farmerId.mobile}
                              </p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FontAwesomeIcon 
                              icon={faTruck} 
                              style={{ fontSize: '24px', color: '#ff9800' }}
                            />
                            <div style={{ 
                              width: '60px', 
                              height: '2px', 
                              backgroundColor: '#ff9800',
                              margin: '0 10px'
                            }}></div>
                          </div>
                          
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                              <strong>TO:</strong>
                            </p>
                            <p style={{ margin: '5px 0', fontSize: '16px', color: '#333' }}>
                              <FontAwesomeIcon icon={faShoppingCart} /> <strong>{sellerName}</strong>
                            </p>
                            {hasSellerInfo && order.sellerId.mobile && (
                              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                                Contact: {order.sellerId.mobile}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="nothing2"></div>

      {/* Available Seller Orders */}
      <div className="topic">
        <p>Available Seller Orders to Accept</p>
      </div>
      <div className="orders-wrapper">
        {renderAvailableOrders(availableSellerOrders, "seller")}
      </div>

      <div className="nothing2"></div>

      {/* My Seller Orders */}
      <div className="topic">
        <p>My Accepted Seller Orders</p>
      </div>
      <div className="orders-wrapper">
        {renderMyOrders(mySellerOrders, "seller")}
      </div>

      <FooterNew />
    </div>
  );
}

export default RegDeliverymanPage;