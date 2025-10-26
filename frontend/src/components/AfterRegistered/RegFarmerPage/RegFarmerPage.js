import React, { useState, useEffect } from "react";
import "./RegFarmerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../../AfterRegistered/RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronRight, 
  faShoppingCart, 
  faShoppingBag, 
  faInfoCircle, 
  faThumbsUp, 
  faThumbsDown, 
  faTruck, 
  faCheckCircle, 
  faTimesCircle,
  faHistory,
  faTimes,
  faWallet,
  faCreditCard,
  faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function FarmerPage() {
  const [farmerId, setFarmerId] = useState("");
  const [sellerOrders, setSellerOrders] = useState([]);
  const [farmerOrders, setFarmerOrders] = useState([]);
  const [deliveryPosts, setDeliveryPosts] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [appliedSchemes, setAppliedSchemes] = useState([]);
  const [showSchemes, setShowSchemes] = useState(false);
  const [showAppliedSchemes, setShowAppliedSchemes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [showAllSellerOrders, setShowAllSellerOrders] = useState(false);
  const [showAllFarmerOrders, setShowAllFarmerOrders] = useState(false);
  const [showAllDeliveryPosts, setShowAllDeliveryPosts] = useState(false);

  const BASE_URL = "http://localhost:8070";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  useEffect(() => {
    const fetchFarmerData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/farmer/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.status === "ok") {
          setFarmerId(data.data._id);

          const appliedRes = await fetch(`${BASE_URL}/appliedschemes/${data.data._id}`);
          const appliedData = await appliedRes.json();
          setAppliedSchemes(appliedData);
        }
      } catch (err) {
        console.error("Error fetching farmer data:", err);
      }
    };
    fetchFarmerData();
  }, []);

  useEffect(() => {
    if (!farmerId) return;
    
    const fetchSellerOrders = async () => {
      try {
        const response = await fetch(`${BASE_URL}/sellerorder/farmer/${farmerId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Seller Orders Response:", data);
        
        if (data.status === 'ok' && data.orders) {
          setSellerOrders(data.orders);
        } else if (Array.isArray(data)) {
          setSellerOrders(data);
        } else if (data.data && Array.isArray(data.data)) {
          setSellerOrders(data.data);
        } else {
          console.error("Unexpected data format:", data);
          setSellerOrders([]);
        }
      } catch (err) {
        console.error("Error fetching seller orders:", err);
        setSellerOrders([]);
      }
    };
    
    const fetchFarmerOrders = async () => {
      try {
        const response = await fetch(`${BASE_URL}/farmerorder/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const orders = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
        const filteredOrders = orders.filter(order => order.farmerId !== farmerId);
        setFarmerOrders(filteredOrders);
      } catch (err) {
        console.error("Error fetching farmer orders:", err);
        setFarmerOrders([]);
      }
    };
    
    const fetchDeliveryPosts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/deliverypost/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setDeliveryPosts(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
      } catch (err) {
        console.error("Error fetching delivery posts:", err);
        setDeliveryPosts([]);
      }
    };
    
    const fetchSchemes = async () => {
      try {
        const response = await fetch(`${BASE_URL}/schemes/`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setSchemes(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setSchemes([]);
      }
    };

    fetchSellerOrders();
    fetchFarmerOrders();
    fetchDeliveryPosts();
    fetchSchemes();
  }, [farmerId]);

  const handleApplyScheme = async (scheme) => {
    if (!appliedSchemes.find((s) => s._id === scheme._id) && farmerId) {
      try {
        const response = await fetch(`${BASE_URL}/appliedschemes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: farmerId, schemeId: scheme._id }),
        });
        if (response.ok) {
          setAppliedSchemes([...appliedSchemes, scheme]);
          alert(`You applied for "${scheme.name}"!`);
        } else {
          alert("Failed to apply scheme");
        }
      } catch (err) {
        console.error("Error applying scheme:", err);
      }
    }
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const order = sellerOrders.find(o => o._id === orderId);
      if (!order) {
        alert("Order not found");
        return;
      }

      // Show confirmation dialog with refund info
      if (newStatus === 'disapproved') {
        const confirmMessage = order.paymentStatus === 'paid' 
          ? `Are you sure you want to disapprove this order?\n\nThe seller will be refunded Rs. ${order.price}\nPayment Method: ${order.paymentMethod || 'wallet'}`
          : `Are you sure you want to disapprove this order?`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      // Use the new endpoint with refund logic
      const res = await fetch(`${BASE_URL}/sellerorder/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: orderId, 
          status: newStatus,
          farmerId: farmerId
        }),
      });
      
      if (!res.ok) throw new Error("Failed to update order");
      
      const result = await res.json();
      
      if (result.status === 'ok') {
        // Update local state
        setSellerOrders(prev =>
          prev.map(o => o._id === orderId ? result.order : o)
        );
        
        // Show success message
        if (newStatus === 'disapproved' && result.refunded) {
          alert(`Order disapproved successfully!\n\nRefund Details:\nAmount: Rs. ${result.refundAmount}\nStatus: Refunded to seller's ${order.paymentMethod || 'wallet'}`);
        } else {
          alert(`Order ${newStatus} successfully!`);
        }
        
        // Refresh orders to get updated data
        const response = await fetch(`${BASE_URL}/sellerorder/farmer/${farmerId}`);
        const data = await response.json();
        if (data.status === 'ok' && data.orders) {
          setSellerOrders(data.orders);
        }
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "green";
      case "disapproved": return "red";
      default: return "orange";
    }
  };

  const getPaymentStatusBadge = (paymentStatus, paymentMethod) => {
    const statusConfig = {
      paid: { color: '#28a745', icon: faCheckCircle, text: 'PAID' },
      refunded: { color: '#ffc107', icon: faMoneyBillWave, text: 'REFUNDED' },
      pending: { color: '#6c757d', icon: faInfoCircle, text: 'PENDING' },
      failed: { color: '#dc3545', icon: faTimesCircle, text: 'FAILED' }
    };

    const config = statusConfig[paymentStatus] || statusConfig.pending;
    const methodIcon = paymentMethod === 'wallet' ? faWallet : faCreditCard;

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '5px 12px',
        backgroundColor: `${config.color}20`,
        borderRadius: '20px',
        border: `2px solid ${config.color}`,
        fontSize: '12px',
        fontWeight: '600',
        marginTop: '8px'
      }}>
        <FontAwesomeIcon icon={config.icon} style={{ color: config.color }} />
        <span style={{ color: config.color }}>{config.text}</span>
        {paymentMethod && (
          <>
            <span style={{ color: config.color }}>via</span>
            <FontAwesomeIcon icon={methodIcon} style={{ color: config.color }} />
          </>
        )}
      </div>
    );
  };

  const getDeliveryStatusBadge = (deliveryStatus) => {
    if (deliveryStatus === "delivered" || deliveryStatus === "approved") {
      return (
        <div className="delivery-status-badge delivered">
          <FontAwesomeIcon icon={faCheckCircle} /> Delivered
        </div>
      );
    } else if (deliveryStatus === "not-delivered") {
      return (
        <div className="delivery-status-badge not-delivered">
          <FontAwesomeIcon icon={faTimesCircle} /> Not Delivered
        </div>
      );
    }
    return null;
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

  const getSoldProducts = () => {
    return sellerOrders
      .filter(order => 
        order.status === "approved" && 
        (order.deliveryStatus === "delivered" || order.deliveryStatus === "approved")
      )
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  };

  const soldProducts = getSoldProducts();
  const sellerOrdersToDisplay = showAllSellerOrders ? sellerOrders : sellerOrders.slice(0, 4);

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
              fontFamily:"Gill Sans", 
              fontSize:"60px", 
              color:"white", 
              textShadow:"2px 2px 6px rgba(0,0,0,0.6)"
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

      {/* History Button */}
      <div className="history-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          className="history-button"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          <FontAwesomeIcon icon={faHistory} />
          {showHistory ? 'Hide History' : `View Sales History (${soldProducts.length})`}
        </button>
      </div>

      {/* History Section */}
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
              <FontAwesomeIcon icon={faHistory} /> Sales History
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

          {soldProducts.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', padding: '40px' }}>
              No sales history yet. Your delivered orders will appear here.
            </p>
          ) : (
            <div className="history-list">
              {soldProducts.map((order) => {
                const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
                const deliverymanName = hasDeliverymanInfo 
                  ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
                  : 'Assigned';

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
                        <p><strong>Quantity:</strong> {order.quantity}</p>
                        <p><strong>Price:</strong> Rs.{order.price}</p>
                        <p><strong>Status:</strong> <span style={{ color: 'green' }}>✓ DELIVERED</span></p>
                        <p><strong>Date:</strong> {formatDate(order.updatedAt || order.createdAt)}</p>
                        <p style={{ gridColumn: '1 / -1' }}>
                          <strong>Delivered to:</strong> {sellerName}
                        </p>
                      </div>
                      {order.paymentStatus && (
                        <div style={{ marginTop: '10px' }}>
                          {getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
                        </div>
                      )}
                      {hasDeliverymanInfo && (
                        <div style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          backgroundColor: '#e9f7ef', 
                          borderRadius: '5px' 
                        }}>
                          <p style={{ margin: '5px 0' }}>
                            <FontAwesomeIcon icon={faTruck} /> 
                            <strong> Delivered by:</strong> {deliverymanName}
                          </p>
                          {order.deliverymanId.mobile && (
                            <p style={{ margin: '5px 0' }}>
                              <strong>Contact:</strong> {order.deliverymanId.mobile}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schemes */}
      <div className="topic">
        <p>Government Schemes</p>
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <button 
            onClick={() => { setShowSchemes(!showSchemes); setShowAppliedSchemes(false); }}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: showSchemes ? '#007bff' : '#fff',
              color: showSchemes ? '#fff' : '#007bff',
              border: '2px solid #007bff',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: showSchemes ? '0 4px 8px rgba(0,123,255,0.3)' : 'none'
            }}
            onMouseOver={(e) => {
              if (!showSchemes) {
                e.target.style.backgroundColor = '#007bff';
                e.target.style.color = '#fff';
              }
            }}
            onMouseOut={(e) => {
              if (!showSchemes) {
                e.target.style.backgroundColor = '#fff';
                e.target.style.color = '#007bff';
              }
            }}
          >
            View Schemes
          </button>
          <button 
            onClick={() => { setShowAppliedSchemes(!showAppliedSchemes); setShowSchemes(false); }}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: showAppliedSchemes ? '#28a745' : '#fff',
              color: showAppliedSchemes ? '#fff' : '#28a745',
              border: '2px solid #28a745',
              borderRadius: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: showAppliedSchemes ? '0 4px 8px rgba(40,167,69,0.3)' : 'none'
            }}
            onMouseOver={(e) => {
              if (!showAppliedSchemes) {
                e.target.style.backgroundColor = '#28a745';
                e.target.style.color = '#fff';
              }
            }}
            onMouseOut={(e) => {
              if (!showAppliedSchemes) {
                e.target.style.backgroundColor = '#fff';
                e.target.style.color = '#28a745';
              }
            }}
          >
            Applied Schemes
          </button>
        </div>
      </div>
      
      {showSchemes && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
          padding: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {schemes.length > 0 ? schemes.map((scheme) => (
            <div 
              key={scheme._id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                border: '2px solid transparent',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,123,255,0.2)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '100px',
                height: '100px',
                backgroundColor: '#007bff',
                opacity: '0.1',
                borderRadius: '50%'
              }}></div>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '20px',
                minHeight: '50px',
                position: 'relative',
                zIndex: 1
              }}>{scheme.name}</p>
              <button 
                onClick={() => handleApplyScheme(scheme)}
                disabled={appliedSchemes.find((s) => s._id === scheme._id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: appliedSchemes.find((s) => s._id === scheme._id) ? '#6c757d' : '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: appliedSchemes.find((s) => s._id === scheme._id) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  zIndex: 1
                }}
                onMouseOver={(e) => {
                  if (!appliedSchemes.find((s) => s._id === scheme._id)) {
                    e.target.style.backgroundColor = '#0056b3';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!appliedSchemes.find((s) => s._id === scheme._id)) {
                    e.target.style.backgroundColor = '#007bff';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
              >
                {appliedSchemes.find((s) => s._id === scheme._id) ? '✓ Already Applied' : 'Apply Now'}
              </button>
            </div>
          )) : (
            <p style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              fontSize: '18px',
              color: '#666',
              padding: '40px'
            }}>No schemes available.</p>
          )}
        </div>
      )}
      
      {showAppliedSchemes && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px',
          padding: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {appliedSchemes.length > 0 ? appliedSchemes.map((scheme) => (
            <div 
              key={scheme._id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '15px',
                padding: '25px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                border: '2px solid #28a745',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(40,167,69,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
              }}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#28a745',
                color: '#fff',
                padding: '5px 15px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                ✓ Applied
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-50px',
                left: '-50px',
                width: '100px',
                height: '100px',
                backgroundColor: '#28a745',
                opacity: '0.1',
                borderRadius: '50%'
              }}></div>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '15px',
                minHeight: '50px',
                paddingRight: '80px',
                position: 'relative',
                zIndex: 1
              }}>{scheme.name}</p>
              <div style={{
                padding: '10px',
                backgroundColor: '#d4edda',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#155724',
                fontWeight: '600',
                fontSize: '14px',
                position: 'relative',
                zIndex: 1
              }}>
                Application Submitted
              </div>
            </div>
          )) : (
            <p style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              fontSize: '18px',
              color: '#666',
              padding: '40px'
            }}>You haven't applied for any schemes yet.</p>
          )}
        </div>
      )}

      {/* Seller Orders */}
      <div className="topic">
        <p>Seller Orders (Orders to Me)</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrdersToDisplay.length === 0 ? (
            <p>No seller orders found.</p>
          ) : (
            sellerOrdersToDisplay.map((order) => {
              const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
              const deliverymanName = hasDeliverymanInfo 
                ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
                : 'Assigned';
              
              return (
                <div key={order._id} className="order-item1">
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
                  {order.orderNumber && (
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Order #: {order.orderNumber}
                    </p>
                  )}
                  <p>Quantity: {order.quantity}</p>
                  <p>Price: Rs.{order.price}</p>
                  <p>
                    Status: <b style={{color: getStatusColor(order.status)}}>
                      {order.status?.toUpperCase() || "PENDING"}
                    </b>
                  </p>
                  
                  {/* Payment Status Badge */}
                  {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
                  
                  {order.acceptedByDeliveryman && order.status === "approved" && (
                    <div className="delivery-info">
                      <p className="deliveryman-info">
                        <FontAwesomeIcon icon={faTruck} /> 
                        Deliveryman: <strong>{deliverymanName}</strong>
                      </p>
                      
                      <p className="deliveryman-detail">
                        ID: <strong>{hasDeliverymanInfo ? order.deliverymanId._id : order.deliverymanId}</strong>
                      </p>
                      
                      {hasDeliverymanInfo && (
                        <>
                          {order.deliverymanId.email && (
                            <p className="deliveryman-detail">Email: {order.deliverymanId.email}</p>
                          )}
                          {order.deliverymanId.mobile && (
                            <p className="deliveryman-detail">Mobile: {order.deliverymanId.mobile}</p>
                          )}
                        </>
                      )}
                      
                      {getDeliveryStatusBadge(order.deliveryStatus)}
                    </div>
                  )}
                  
                  {order.status !== "approved" && order.status !== "disapproved" && (
                    <div className="order-buttons">
                      <button 
                        onClick={() => handleOrderStatus(order._id, "approved")}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginRight: '10px'
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsUp}/> Approve
                      </button>
                      <button 
                        onClick={() => handleOrderStatus(order._id, "disapproved")}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsDown}/> Disapprove
                      </button>
                    </div>
                  )}
                  
                  {order.status === "approved" && order.acceptedByDeliveryman && (
                    <div className="order-status-message">
                      <p>✓ Order accepted by deliveryman</p>
                    </div>
                  )}
                  
                  {order.status === "disapproved" && (
                    <div className="order-status-message-disapproved">
                      <p>✗ Order Disapproved</p>
                      {order.paymentStatus === 'refunded' && (
                        <p style={{ fontSize: '12px', marginTop: '5px' }}>
                          💰 Refund processed
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {sellerOrders.length > 4 && (
          <button 
            className="view-all-button1" 
            onClick={() => setShowAllSellerOrders(prev => !prev)}
          >
            {showAllSellerOrders ? "Show Less" : `View All (${sellerOrders.length})`} 
            <FontAwesomeIcon icon={faChevronRight}/>
          </button>
        )}
      </div>

      <FooterNew />
    </div>
  );
}

export default FarmerPage;