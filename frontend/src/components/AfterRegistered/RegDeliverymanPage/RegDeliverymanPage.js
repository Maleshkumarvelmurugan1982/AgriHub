import React, { useState, useEffect } from "react";
import axios from "axios";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
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

function RegDeliverymanPage() {
  const [deliverymanId, setDeliverymanId] = useState("");
  const [availableSellerOrders, setAvailableSellerOrders] = useState([]);
  const [mySellerOrders, setMySellerOrders] = useState([]);
  const [salary, setSalary] = useState(0);
  const [showSalary, setShowSalary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState(null);

  const BASE_URL = "https://agrihub-2.onrender.com";

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'https://via.placeholder.com/150?text=No+Image';
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
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

  const getDeliveryHistory = () => {
    const sellerDeliveries = mySellerOrders.filter(order => 
      order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
    );
    
    return sellerDeliveries.sort((a, b) => {
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
          alert("Please log in to continue");
          return;
        }

        const res = await fetch(`${BASE_URL}/deliveryman/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok" && data.data && data.data._id) {
          setDeliverymanId(data.data._id);
          console.log("✅ Logged-in Deliveryman ID:", data.data._id);
        } else {
          console.error("Failed to fetch deliveryman data:", data);
          alert("Failed to load deliveryman data. Please log in again.");
        }
      } catch (err) {
        console.error("Error fetching deliveryman data:", err);
        alert("Error loading deliveryman data. Please refresh the page.");
      }
    };

    fetchDeliverymanData();
  }, []);

  useEffect(() => {
    if (!deliverymanId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);

        // Fetch available seller orders
        const availableSellerResponse = await axios.get(
          `${BASE_URL}/sellerorder/deliveryman/available`
        );
        const availableSellerData = Array.isArray(availableSellerResponse.data) 
          ? availableSellerResponse.data 
          : [];
        setAvailableSellerOrders(availableSellerData);

        // Fetch my seller orders
        const mySellerResponse = await axios.get(
          `${BASE_URL}/sellerorder/deliveryman/${deliverymanId}`
        );
        const mySellerData = Array.isArray(mySellerResponse.data) 
          ? mySellerResponse.data 
          : [];
        setMySellerOrders(mySellerData);

        // Fetch salary
        try {
          const salaryResponse = await axios.get(`${BASE_URL}/salary/${deliverymanId}`);
          setSalary(salaryResponse.data.salary ?? 0);
        } catch (err) {
          console.warn("Salary not available:", err.message);
          setSalary(0);
        }

      } catch (err) {
        console.error("❌ Error fetching data:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          alert(`Error: ${err.response.data.message || 'Failed to load data'}`);
        } else {
          alert("Network error. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
    
  }, [deliverymanId]);

  const handleAcceptDelivery = async (orderId) => {
    if (!deliverymanId) {
      alert("❌ Please log in to accept orders");
      return;
    }

    if (!orderId) {
      alert("❌ Invalid order ID");
      return;
    }

    if (acceptingOrder === orderId) {
      console.log("Already processing this order");
      return;
    }

    try {
      setAcceptingOrder(orderId);
      console.log(`📦 Accepting seller order:`, orderId);
      console.log(`👤 Deliveryman ID:`, deliverymanId);

      const endpoint = `${BASE_URL}/sellerorder/${orderId}/accept`;
      console.log(`🔗 API Endpoint:`, endpoint);

      const response = await axios.put(
        endpoint,
        { deliverymanId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      console.log("✅ Accept response:", response.data);

      // Update local state immediately
      const acceptedOrder = availableSellerOrders.find(o => o._id === orderId);
      if (acceptedOrder) {
        const updatedOrder = { 
          ...acceptedOrder, 
          deliverymanId: deliverymanId,
          acceptedByDeliveryman: true, 
          deliveryStatus: response.data.deliveryStatus || "in-transit"
        };
        
        setMySellerOrders(prev => [...prev, updatedOrder]);
        setAvailableSellerOrders(prev => prev.filter(o => o._id !== orderId));
        console.log("✅ Seller order moved to 'My Orders'");
      }
      
      alert("✅ Order accepted successfully!");
      
    } catch (err) {
      console.error("❌ Error accepting delivery:", err);
      
      let errorMessage = "Failed to accept order. ";
      
      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        errorMessage += err.response.data.message || err.response.data.error || `Status: ${err.response.status}`;
      } else if (err.request) {
        console.error("No response received:", err.request);
        errorMessage += "No response from server. Please check your connection.";
      } else {
        console.error("Error message:", err.message);
        errorMessage += err.message;
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setAcceptingOrder(null);
    }
  };

  const handleDeliveryStatus = async (orderId, status) => {
    if (!orderId || !status) {
      alert("❌ Invalid order or status");
      return;
    }

    try {
      const url = `${BASE_URL}/sellerorder/${orderId}/status`;
      
      console.log(`📦 Updating status for order ${orderId} to ${status}`);

      const response = await axios.put(url, { status }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log("✅ Status update response:", response.data);

      // Update local state
      setMySellerOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, deliveryStatus: status } : order
        )
      );

      alert(`✅ Order status updated to "${status}" successfully!`);
      
    } catch (err) {
      console.error("❌ Error updating delivery status:", err);
      
      let errorMessage = "Failed to update status. ";
      if (err.response) {
        errorMessage += err.response.data.message || err.response.data.error || "Please try again.";
      } else if (err.request) {
        errorMessage += "No response from server.";
      } else {
        errorMessage += err.message;
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: "18px" }}>Loading deliveryman data...</p>
      </div>
    );
  }

  if (!deliverymanId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: "18px", color: "red" }}>
          Please log in to access the deliveryman dashboard.
        </p>
      </div>
    );
  }

  const renderDeliveryStatusBadge = (status) => {
    const badgeStyle = {
      padding: '8px 16px',
      borderRadius: '20px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '10px 0'
    };

    if (status === "delivered") {
      return (
        <div style={{ ...badgeStyle, backgroundColor: '#4caf50', color: 'white' }}>
          <FontAwesomeIcon icon={faCheckCircle} /> Delivered
        </div>
      );
    } else if (status === "not-delivered") {
      return (
        <div style={{ ...badgeStyle, backgroundColor: '#f44336', color: 'white' }}>
          <FontAwesomeIcon icon={faTimesCircle} /> Not Delivered
        </div>
      );
    } else if (status === "in-transit") {
      return (
        <div style={{ ...badgeStyle, backgroundColor: '#ff9800', color: 'white' }}>
          <FontAwesomeIcon icon={faTruck} /> In Transit
        </div>
      );
    }
    return null;
  };

  const renderAvailableOrders = (orders) => {
    if (orders.length === 0) {
      return <p style={{ textAlign: "center", padding: "20px" }}>No available orders to accept</p>;
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        {orders.map((order) => (
          <div key={order._id} style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s',
            ':hover': { transform: 'translateY(-5px)' }
          }}>
            <img
              src={getImageUrl(order.productImage)}
              alt={order.item}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '15px'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{order.item}</p>
            <p style={{ margin: '5px 0' }}>Quantity: {order.quantity} kg</p>
            <p style={{ margin: '5px 0' }}>Price: Rs.{order.price}</p>
            {order.district && <p style={{ margin: '5px 0' }}>District: {order.district}</p>}
            
            <button
              onClick={() => handleAcceptDelivery(order._id)}
              disabled={acceptingOrder === order._id}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '15px',
                backgroundColor: acceptingOrder === order._id ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: acceptingOrder === order._id ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              <FontAwesomeIcon icon={faTruck} /> 
              {acceptingOrder === order._id ? ' Accepting...' : ' Accept Delivery'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMyOrders = (orders) => {
    if (orders.length === 0) {
      return <p style={{ textAlign: "center", padding: "20px" }}>You haven't accepted any orders yet</p>;
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '20px'
      }}>
        {orders.map((order) => (
          <div key={order._id} style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <img
              src={getImageUrl(order.productImage)}
              alt={order.item}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '15px'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
              }}
            />
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>{order.item}</p>
            <p style={{ margin: '5px 0' }}>Quantity: {order.quantity} kg</p>
            <p style={{ margin: '5px 0' }}>Price: Rs.{order.price}</p>
            {order.district && <p style={{ margin: '5px 0' }}>District: {order.district}</p>}

            {renderDeliveryStatusBadge(order.deliveryStatus)}

            {(order.deliveryStatus === "in-transit" || order.deliveryStatus === "approved") && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => handleDeliveryStatus(order._id, "delivered")}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <FontAwesomeIcon icon={faCheckCircle} /> Mark as Delivered
                </button>
                <button
                  onClick={() => handleDeliveryStatus(order._id, "not-delivered")}
                  style={{
                    padding: '10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
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
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ 
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: 'white',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h1 style={{ fontSize: '48px', color: '#333', margin: 0 }}>
          Welcome Delivery Partners!
        </h1>
      </div>

      {showSalary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            maxWidth: '400px'
          }}>
            <h2>Your Salary Provided by Government</h2>
            <p style={{ fontSize: '24px', color: '#4caf50', fontWeight: 'bold' }}>
              Rs.{salary}
            </p>
            <button 
              onClick={() => setShowSalary(false)}
              style={{
                padding: '10px 30px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <button 
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
            gap: '10px'
          }}
        >
          <FontAwesomeIcon icon={faHistory} />
          {showHistory ? 'Hide History' : `View Delivery History (${deliveryHistory.length})`}
        </button>
      </div>

      {showHistory && (
        <div style={{
          margin: '20px auto',
          maxWidth: '1200px',
          padding: '20px',
          backgroundColor: 'white',
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
            <div>
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
                    style={{
                      backgroundColor: '#f9f9f9',
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

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          padding: '20px',
          backgroundColor: 'white',
          margin: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
            Available Seller Orders to Accept
          </h2>
          {renderAvailableOrders(availableSellerOrders)}
        </div>

        <div style={{ 
          padding: '20px',
          backgroundColor: 'white',
          margin: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
            My Accepted Seller Orders
          </h2>
          {renderMyOrders(mySellerOrders)}
        </div>
      </div>
    </div>
  );
}

export default RegDeliverymanPage;
