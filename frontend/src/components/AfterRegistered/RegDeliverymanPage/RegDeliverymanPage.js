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
  faShoppingCart,
  faFilePdf,
  faFileCsv,
  faDownload
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "https://agrihub-2.onrender.com";

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

  // Export to CSV
  const exportToCSV = () => {
    if (deliveryHistory.length === 0) {
      alert("No delivery history to export");
      return;
    }

    const headers = [
      "Item Name",
      "Quantity",
      "Price (Rs.)",
      "Order Date",
      "Delivery Date",
      "From (Farmer)",
      "Farmer Contact",
      "To (Seller)",
      "Seller Contact",
      "District",
      "Status",
      "Current Salary (Rs.)"
    ];

    const csvRows = [headers.join(",")];

    deliveryHistory.forEach(order => {
      const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
      const farmerName = hasFarmerInfo 
        ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() 
        : 'Unknown';
      const farmerContact = hasFarmerInfo && order.farmerId.mobile ? order.farmerId.mobile : 'N/A';

      const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
      const sellerName = hasSellerInfo 
        ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() 
        : 'Unknown';
      const sellerContact = hasSellerInfo && order.sellerId.mobile ? order.sellerId.mobile : 'N/A';

      const row = [
        `"${order.item}"`,
        `"${order.quantity} kg"`,
        order.price,
        `"${formatDate(order.createdAt)}"`,
        `"${formatDate(order.updatedAt)}"`,
        `"${farmerName}"`,
        farmerContact,
        `"${sellerName}"`,
        sellerContact,
        `"${order.district || 'N/A'}"`,
        "DELIVERED",
        salary
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `delivery_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert("✅ Delivery history exported as CSV");
    setShowExportMenu(false);
  };

  // Export to PDF using browser print
  const exportToPDF = () => {
    if (deliveryHistory.length === 0) {
      alert("No delivery history to export");
      return;
    }

    // Create a new window with print-friendly content
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery History Report</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #ff9800;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #ff9800;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .salary-box {
              background-color: #fff3cd;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              border: 2px solid #ffc107;
            }
            .salary-box h3 {
              margin: 0;
              color: #856404;
              font-size: 20px;
            }
            .order-item {
              margin-bottom: 30px;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .order-header {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
            .order-header h3 {
              margin: 0;
              color: #333;
            }
            .order-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            .detail-item {
              padding: 5px 0;
            }
            .detail-item strong {
              color: #555;
            }
            .route-box {
              background-color: #e3f2fd;
              padding: 15px;
              border-radius: 5px;
              margin-top: 10px;
              border-left: 4px solid #2196f3;
            }
            .route-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 20px;
            }
            .route-point {
              flex: 1;
            }
            .route-arrow {
              text-align: center;
              color: #ff9800;
              font-size: 24px;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              background-color: #28a745;
              color: white;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚚 Delivery History Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>Total Deliveries: ${deliveryHistory.length}</p>
          </div>

          <div class="salary-box">
            <h3>💰 Current Salary: Rs. ${salary}</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Provided by Government</p>
          </div>

          ${deliveryHistory.map((order, index) => {
            const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
            const farmerName = hasFarmerInfo 
              ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() 
              : 'Unknown Farmer';
            
            const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
            const sellerName = hasSellerInfo 
              ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() 
              : 'Unknown Seller';

            return `
              <div class="order-item">
                <div class="order-header">
                  <h3>Delivery #${index + 1}: ${order.item}</h3>
                </div>
                
                <div class="order-details">
                  <div class="detail-item">
                    <strong>Quantity:</strong> ${order.quantity} kg
                  </div>
                  <div class="detail-item">
                    <strong>Price:</strong> Rs. ${order.price}
                  </div>
                  <div class="detail-item">
                    <strong>Order Date:</strong> ${formatDate(order.createdAt)}
                  </div>
                  <div class="detail-item">
                    <strong>Delivery Date:</strong> ${formatDate(order.updatedAt)}
                  </div>
                  ${order.district ? `
                  <div class="detail-item">
                    <strong>District:</strong> ${order.district}
                  </div>
                  ` : ''}
                </div>

                <div class="detail-item">
                  <span class="status-badge">✓ DELIVERED</span>
                </div>

                <div class="route-box">
                  <p style="margin: 0 0 10px 0; font-weight: bold; color: #555;">Delivery Route:</p>
                  <div class="route-container">
                    <div class="route-point">
                      <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>FROM:</strong></p>
                      <p style="margin: 5px 0; font-size: 16px;"><strong>👤 ${farmerName}</strong></p>
                      ${hasFarmerInfo && order.farmerId.mobile ? 
                        `<p style="margin: 5px 0; font-size: 14px; color: #666;">Contact: ${order.farmerId.mobile}</p>` 
                        : ''}
                    </div>
                    
                    <div class="route-arrow">
                      🚚 ➔
                    </div>
                    
                    <div class="route-point">
                      <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>TO:</strong></p>
                      <p style="margin: 5px 0; font-size: 16px;"><strong>🛒 ${sellerName}</strong></p>
                      ${hasSellerInfo && order.sellerId.mobile ? 
                        `<p style="margin: 5px 0; font-size: 14px; color: #666;">Contact: ${order.sellerId.mobile}</p>` 
                        : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <div class="footer">
            <p>This is an automatically generated report</p>
            <p>AgriHub - Connecting Farmers, Sellers, and Delivery Partners</p>
          </div>

          <div class="no-print" style="text-align: center; margin: 30px 0;">
            <button onclick="window.print()" style="
              padding: 12px 30px;
              font-size: 16px;
              background-color: #ff9800;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin-right: 10px;
            ">Print PDF</button>
            <button onclick="window.close()" style="
              padding: 12px 30px;
              font-size: 16px;
              background-color: #666;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    alert("✅ PDF preview opened. Click Print to save as PDF");
    setShowExportMenu(false);
  };

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
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>
              <FontAwesomeIcon icon={faHistory} /> Delivery History
            </h2>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* Export Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export History
                </button>
                
                {showExportMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '5px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    minWidth: '180px'
                  }}>
                    <button
                      onClick={exportToPDF}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <FontAwesomeIcon icon={faFilePdf} style={{ color: '#dc3545' }} />
                      Export as PDF
                    </button>
                    
                    <div style={{ height: '1px', backgroundColor: '#eee', margin: '0 10px' }} />
                    
                    <button
                      onClick={exportToCSV}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <FontAwesomeIcon icon={faFileCsv} style={{ color: '#28a745' }} />
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>

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
          </div>

          {/* Salary Display */}
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            border: '2px solid #ffc107'
          }}>
            <h3 style={{ margin: 0, color: '#856404', fontSize: '20px' }}>
              <FontAwesomeIcon icon={faMoneyBillWave} /> Current Salary: Rs. {salary}
            </h3>
            <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>Provided by Government</p>
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
