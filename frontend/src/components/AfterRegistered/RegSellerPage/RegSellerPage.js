import React, { useState, useEffect, useRef } from "react";
import "./RegSellerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faChevronRight, 
  faCheckCircle, 
  faTimesCircle,
  faTruck,
  faShoppingCart,
  faInfoCircle,
  faHistory,
  faTimes,
  faUser,
  faWallet,
  faBoxOpen,
  faFilePdf,
  faFileCsv,
  faDownload
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegSellerPage() {
  const [sellerId, setSellerId] = useState("");
  const [sellerOrders, setSellerOrders] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showAllSellerOrders, setShowAllSellerOrders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const notifiedOrdersRef = useRef(new Set());

  const BACKEND_URL = "https://agrihub-2.onrender.com";
  const fallbackProductImage = "https://via.placeholder.com/300x200?text=Product+Image";

  const styles = {
    toastContainer: { 
      position: 'fixed', 
      top: '80px', 
      right: '20px', 
      zIndex: 9999, 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px', 
      maxWidth: '400px' 
    },
    toast: { 
      display: 'flex', 
      alignItems: 'center', 
      padding: '15px 20px', 
      borderRadius: '8px', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
      backgroundColor: '#fff', 
      animation: 'slideIn 0.3s ease-out', 
      minWidth: '300px', 
      maxWidth: '400px' 
    },
    toastSuccess: { borderLeft: '4px solid #4caf50' },
    toastError: { borderLeft: '4px solid #f44336' },
    toastIcon: { 
      fontSize: '24px', 
      marginRight: '15px', 
      display: 'flex', 
      alignItems: 'center' 
    },
    toastIconSuccess: { color: '#4caf50' },
    toastIconError: { color: '#f44336' },
    toastMessage: { 
      flex: 1, 
      fontSize: '14px', 
      color: '#333', 
      lineHeight: '1.5' 
    },
    toastClose: { 
      background: 'none', 
      border: 'none', 
      fontSize: '24px', 
      color: '#999', 
      cursor: 'pointer', 
      padding: 0, 
      marginLeft: '10px', 
      width: '24px', 
      height: '24px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      transition: 'color 0.2s' 
    },
  };

  // Inject CSS to hide Government / Login / Register links while this page is mounted.
  useEffect(() => {
    const styleId = 'hide-auth-links-regseller';
    if (document.getElementById(styleId)) return;
    const css = `
      /* target common navbar link patterns: specific hrefs and common classes */
      .navbar a[href="/GovernmentPage"],
      .navbar a[href="/login"],
      .navbar a[href="/register"],
      .navbar .login,
      .navbar .register,
      .navbar .gov-link,
      a.gov-link,
      a.nav-gov,
      a[href="/GovernmentPage"] .badge,
      .navbar .badge.gov {
        display: none !important;
      }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.parentNode.removeChild(el);
    };
  }, []);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${BACKEND_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${BACKEND_URL}/${imagePath}`;
    return `${BACKEND_URL}/uploads/${imagePath}`;
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "green";
      case "disapproved": return "red";
      default: return "orange";
    }
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
    } else if (deliveryStatus === "in-transit") {
      return (
        <div className="delivery-status-badge in-transit">
          <FontAwesomeIcon icon={faTruck} /> In Transit
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

  const getPurchasedItems = () => {
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

  const purchasedItems = getPurchasedItems();

  // Export to CSV
  const exportToCSV = () => {
    if (purchasedItems.length === 0) {
      showToast("No purchase history to export", "error");
      return;
    }

    const headers = [
      "Item Name",
      "Quantity",
      "Price (Rs.)",
      "Order Date",
      "Delivery Date",
      "Farmer Name",
      "Farmer Contact",
      "Deliveryman Name",
      "Deliveryman Contact",
      "Status"
    ];

    const csvRows = [headers.join(",")];

    purchasedItems.forEach(order => {
      const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
      const farmerName = hasFarmerInfo 
        ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() 
        : 'Unknown';
      const farmerContact = hasFarmerInfo && order.farmerId.mobile ? order.farmerId.mobile : 'N/A';

      const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
      const deliverymanName = hasDeliverymanInfo 
        ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
        : 'Unknown';
      const deliverymanContact = hasDeliverymanInfo && order.deliverymanId.mobile ? order.deliverymanId.mobile : 'N/A';

      const row = [
        `"${order.item}"`,
        `"${order.quantity}"`,
        order.price,
        `"${formatDate(order.createdAt)}"`,
        `"${formatDate(order.updatedAt)}"`,
        `"${farmerName}"`,
        farmerContact,
        `"${deliverymanName}"`,
        deliverymanContact,
        "DELIVERED"
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `purchase_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Purchase history exported as CSV", "success");
    setShowExportMenu(false);
  };

  // Export to PDF using browser print
  const exportToPDF = () => {
    if (purchasedItems.length === 0) {
      showToast("No purchase history to export", "error");
      return;
    }

    // Create a new window with print-friendly content
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase History</title>
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
              border-bottom: 3px solid #4caf50;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #4caf50;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
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
            .info-box {
              background-color: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              margin-top: 10px;
              border-left: 4px solid #ffc107;
            }
            .delivery-box {
              background-color: #e9f7ef;
              padding: 15px;
              border-radius: 5px;
              margin-top: 10px;
              border-left: 4px solid #28a745;
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
            <h1>Purchase History Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>Total Orders: ${purchasedItems.length}</p>
          </div>

          ${purchasedItems.map((order, index) => {
            const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
            const farmerName = hasFarmerInfo 
              ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() 
              : 'Unknown Farmer';
            
            const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
            const deliverymanName = hasDeliverymanInfo 
              ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
              : 'Unknown Deliveryman';

            return `
              <div class="order-item">
                <div class="order-header">
                  <h3>Order #${index + 1}: ${order.item}</h3>
                </div>
                
                <div class="order-details">
                  <div class="detail-item">
                    <strong>Quantity:</strong> ${order.quantity}
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
                </div>

                <div class="detail-item">
                  <span class="status-badge">✓ DELIVERED</span>
                </div>

                <div class="info-box">
                  <p style="margin: 5px 0;"><strong>👤 Purchased from:</strong> ${farmerName}</p>
                  ${hasFarmerInfo && order.farmerId.mobile ? 
                    `<p style="margin: 5px 0;"><strong>Farmer Contact:</strong> ${order.farmerId.mobile}</p>` 
                    : ''}
                </div>

                ${hasDeliverymanInfo ? `
                  <div class="delivery-box">
                    <p style="margin: 5px 0;"><strong>🚚 Delivered by:</strong> ${deliverymanName}</p>
                    ${order.deliverymanId.mobile ? 
                      `<p style="margin: 5px 0;"><strong>Deliveryman Contact:</strong> ${order.deliverymanId.mobile}</p>` 
                      : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <div class="footer">
            <p>This is an automatically generated report</p>
            <p>AgriHub - Connecting Farmers and Sellers</p>
          </div>

          <div class="no-print" style="text-align: center; margin: 30px 0;">
            <button onclick="window.print()" style="
              padding: 12px 30px;
              font-size: 16px;
              background-color: #4caf50;
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
    
    showToast("PDF preview opened. Click Print to save as PDF", "success");
    setShowExportMenu(false);
  };

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          showToast("Please log in to view your orders", "error");
          return;
        }

        const res = await fetch(`${BACKEND_URL}/seller/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok") {
          setSellerId(data.data._id);
          console.log("Seller ID:", data.data._id);
        } else {
          console.error("Failed to fetch seller data:", data);
          showToast("Failed to load user data", "error");
        }
      } catch (err) {
        console.error("Error fetching seller data:", err);
        showToast("Error loading user data", "error");
      }
    };

    fetchSellerData();
  }, []);

  useEffect(() => {
    if (!sellerId) return;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @keyframes slideIn { 
        from { transform: translateX(400px); opacity:0; } 
        to { transform: translateX(0); opacity:1; } 
      }
      .delivery-status-badge.in-transit {
        background-color: #fff3cd;
        color: #856404;
        padding: 8px 12px;
        border-radius: 5px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        margin-top: 10px;
        border: 2px solid #ffc107;
      }
    `;
    document.head.appendChild(styleSheet);

    const fetchData = async () => {
      try {
        const sellerRes = await fetch(`${BACKEND_URL}/sellerorder/seller/${sellerId}`);
        
        if (!sellerRes.ok) {
          throw new Error(`HTTP error! status: ${sellerRes.status}`);
        }
        
        const sellerData = await sellerRes.json();
        console.log("Seller Orders Response:", sellerData);
        
        let orders = [];
        if (Array.isArray(sellerData)) {
          orders = sellerData;
        } else if (sellerData.data && Array.isArray(sellerData.data)) {
          orders = sellerData.data;
        } else if (sellerData.message) {
          console.error("Backend error:", sellerData.message);
          orders = [];
        }

        orders.forEach(order => {
          if (order.status && !notifiedOrdersRef.current.has(order._id) && 
              (order.status === "approved" || order.status === "disapproved")) {
            showToast(
              `Your order for ${order.item} has been ${order.status}!`, 
              order.status === "approved" ? "success" : "error"
            );
            notifiedOrdersRef.current.add(order._id);
          }
        });

        for (const order of orders) {
          // Notification for "in-transit" status (when deliveryman accepts)
          if (order.acceptedByDeliveryman && order.deliveryStatus === "in-transit" && 
              !notifiedOrdersRef.current.has(`in-transit-${order._id}`)) {
            try {
              const name = typeof order.deliverymanId === 'object' 
                ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() || "Deliveryman"
                : "Deliveryman";
              
              showToast(`Your order for ${order.item} is now in transit! Accepted by ${name}`, "success");
            } catch (err) {
              showToast(`Your order for ${order.item} is now in transit!`, "success");
            }
            notifiedOrdersRef.current.add(`in-transit-${order._id}`);
          }

          // Existing notification for delivery acceptance (backward compatibility)
          if (order.acceptedByDeliveryman && order.deliverymanId && 
              !notifiedOrdersRef.current.has(`delivery-${order._id}`)) {
            try {
              const name = typeof order.deliverymanId === 'object' 
                ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() || "Deliveryman"
                : "Deliveryman";
              
              showToast(`Your order for ${order.item} has been accepted by ${name}!`, "success");
            } catch (err) {
              showToast(`Your order for ${order.item} has been accepted by a deliveryman!`, "success");
            }
            notifiedOrdersRef.current.add(`delivery-${order._id}`);
          }

          // Delivered notification
          if ((order.deliveryStatus === "delivered" || order.deliveryStatus === "approved") && 
              !notifiedOrdersRef.current.has(`delivered-${order._id}`)) {
            showToast(`Your order for ${order.item} has been delivered successfully!`, "success");
            notifiedOrdersRef.current.add(`delivered-${order._id}`);
          }
        }

        setSellerOrders(orders);

      } catch (err) {
        console.error("Error fetching data:", err);
        showToast("Error fetching data", "error");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    
    return () => { 
      clearInterval(interval); 
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet); 
      }
    };
  }, [sellerId]);

  const handleImageError = (id, type) => {
    setImageErrors(prev => ({ ...prev, [`${type}-${id}`]: true }));
  };

  const sellerOrdersToDisplay = showAllSellerOrders ? sellerOrders : sellerOrders.slice(0, 4);

  return (
    <div>
      <NavbarRegistered />
      <div className="nothing"></div>

      <div style={styles.toastContainer}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            style={{ 
              ...styles.toast, 
              ...(toast.type === "success" ? styles.toastSuccess : styles.toastError) 
            }}
          >
            <div 
              style={{ 
                ...styles.toastIcon, 
                ...(toast.type === "success" ? styles.toastIconSuccess : styles.toastIconError) 
              }}
            >
              <FontAwesomeIcon icon={toast.type === "success" ? faCheckCircle : faTimesCircle}/>
            </div>
            <div style={styles.toastMessage}>{toast.message}</div>
            <button 
              style={styles.toastClose} 
              onClick={() => removeToast(toast.id)} 
              onMouseEnter={e => e.target.style.color = "#333"} 
              onMouseLeave={e => e.target.style.color = "#999"}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="crop-container">
        <img 
          src="https://www.atoallinks.com/wp-content/uploads/2020/07/Agriculture-Product-Buying-and-Selling-App-Development.jpg"
          alt="seller-banner" 
          className="crop-image"
          onError={e => { 
            e.target.onerror = null; 
            e.target.src = "https://via.placeholder.com/1200x400?text=Seller+Banner"; 
          }}
        />
      </div>

      <div className="type-writer-container">
        <TypeWriter 
          text="Welcome Sellers!" 
          loop={false} 
          className="writer" 
          textStyle={{ fontFamily: "Gill Sans", fontSize: "60px" }} 
        />
      </div>

      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href="/seller/wallet" 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 40px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            textDecoration: 'none',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
          }}
        >
          <FontAwesomeIcon icon={faWallet} style={{ fontSize: '22px' }} />
          <span>My Wallet</span>
        </a>
      </div>

      <div className="categories-container">
        <div className="categories-div">
          <RegCategories/>
        </div>
      </div>
      
      <div className="history-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          className="history-button"
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
        >
          <FontAwesomeIcon icon={faHistory} />
          {showHistory ? 'Hide History' : `View Purchase History (${purchasedItems.length})`}
        </button>
      </div>

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
              <FontAwesomeIcon icon={faHistory} /> Purchase History
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

          {purchasedItems.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#666', padding: '40px' }}>
              No purchase history yet. Your delivered orders will appear here.
            </p>
          ) : (
            <div className="history-list">
              {purchasedItems.map((order) => {
                const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
                const deliverymanName = hasDeliverymanInfo 
                  ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
                  : 'Unknown Deliveryman';

                const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
                const farmerName = hasFarmerInfo 
                  ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown Farmer'
                  : 'Unknown Farmer';

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
                      src={getImageUrl(order.productImage) || fallbackProductImage}
                      alt={order.item}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = fallbackProductImage;
                      }} 
                    />
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{order.item}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <p><strong>Quantity:</strong> {order.quantity}</p>
                        <p><strong>Price:</strong> Rs.{order.price}</p>
                        <p><strong>Status:</strong> <span style={{ color: 'green' }}>✓ DELIVERED</span></p>
                        <p><strong>Date:</strong> {formatDate(order.updatedAt || order.createdAt)}</p>
                      </div>
                      
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: '#fff3cd', 
                        borderRadius: '5px',
                        borderLeft: '4px solid #ffc107'
                      }}>
                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                          <FontAwesomeIcon icon={faUser} /> 
                          <strong> Purchased from:</strong> {farmerName}
                        </p>
                        {hasFarmerInfo && order.farmerId.mobile && (
                          <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <strong>Farmer Contact:</strong> {order.farmerId.mobile}
                          </p>
                        )}
                      </div>

                      {hasDeliverymanInfo && (
                        <div style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          backgroundColor: '#e9f7ef', 
                          borderRadius: '5px',
                          borderLeft: '4px solid #28a745'
                        }}>
                          <p style={{ margin: '5px 0', fontSize: '14px' }}>
                            <FontAwesomeIcon icon={faTruck} /> 
                            <strong> Delivered by:</strong> {deliverymanName}
                          </p>
                          {order.deliverymanId.mobile && (
                            <p style={{ margin: '5px 0', fontSize: '14px' }}>
                              <strong>Deliveryman Contact:</strong> {order.deliverymanId.mobile}
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
      
      <div className="nothing2"></div>
      <div className="topic"><p>Your Orders</p></div>

      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrdersToDisplay.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              You don't have any orders yet.
            </p>
          ) : (
            sellerOrdersToDisplay.map((order, index) => {
              const imageUrl = getImageUrl(order.productImage);
              const displayImage = imageErrors[`order-${order._id || index}`] 
                ? fallbackProductImage 
                : imageUrl || fallbackProductImage;
              
              const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
              const deliverymanName = hasDeliverymanInfo 
                ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim() 
                : 'Assigned';

              const isDelivered = order.deliveryStatus === "delivered" || order.deliveryStatus === "approved";
              const isInTransit = order.deliveryStatus === "in-transit";
              const isAcceptedByDeliveryman = order.acceptedByDeliveryman;

              return (
                <div key={order._id || index} className="order-item">
                  <img 
                    src={displayImage} 
                    alt={order.item || "Product"} 
                    className="order-image"
                    onError={(e) => {
                      handleImageError(order._id || index, "order");
                      e.target.onerror = null;
                      e.target.src = fallbackProductImage;
                    }}
                  />
                  <p><strong>{order.item || "Unknown Item"}</strong></p>
                  {order.quantity && <p>Quantity: {order.quantity}</p>}
                  {order.price && <p>Price: Rs.{order.price}</p>}
                  {order.postedDate && <p>Posted: {order.postedDate}</p>}
                  {order.expireDate && <p>Expires: {order.expireDate}</p>}
                  <p>
                    Status: <b style={{ color: getStatusColor(order.status) }}>
                      {order.status?.toUpperCase() || "PENDING"}
                    </b>
                  </p>
                  
                  {order.status === "approved" && (
                    <>
                      {isDelivered && (
                        <div className="delivery-info" style={{
                          backgroundColor: '#d4edda',
                          padding: '15px',
                          borderRadius: '8px',
                          marginTop: '10px',
                          border: '2px solid #28a745'
                        }}>
                          <p className="deliveryman-info" style={{ color: '#155724', fontWeight: 'bold', marginBottom: '10px' }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '8px' }} />
                            ORDER DELIVERED
                          </p>
                          
                          {hasDeliverymanInfo && (
                            <>
                              <p className="deliveryman-detail" style={{ marginBottom: '5px' }}>
                                <FontAwesomeIcon icon={faTruck} /> Delivered by: <strong>{deliverymanName}</strong>
                              </p>
                              
                              {order.deliverymanId.mobile && (
                                <p className="deliveryman-detail" style={{ marginBottom: '5px' }}>
                                  Contact: {order.deliverymanId.mobile}
                                </p>
                              )}
                            </>
                          )}
                          
                          {getDeliveryStatusBadge(order.deliveryStatus)}
                        </div>
                      )}
                      
                      {!isDelivered && isInTransit && isAcceptedByDeliveryman && (
                        <div className="delivery-info" style={{
                          backgroundColor: '#fff3cd',
                          padding: '15px',
                          borderRadius: '8px',
                          marginTop: '10px',
                          border: '2px solid #ffc107'
                        }}>
                          <p className="deliveryman-info" style={{ color: '#856404', fontWeight: 'bold', marginBottom: '10px' }}>
                            <FontAwesomeIcon icon={faTruck} style={{ marginRight: '8px' }} />
                            IN TRANSIT - ACCEPTED BY DELIVERYMAN
                          </p>
                          
                          <p className="deliveryman-info">
                            <FontAwesomeIcon icon={faTruck} /> 
                            Deliveryman: <strong>{deliverymanName}</strong>
                          </p>
                          
                          {hasDeliverymanInfo && (
                            <>
                              {order.deliverymanId.mobile && (
                                <p className="deliveryman-detail">Mobile: {order.deliverymanId.mobile}</p>
                              )}
                              {order.deliverymanId.email && (
                                <p className="deliveryman-detail">Email: {order.deliverymanId.email}</p>
                              )}
                            </>
                          )}
                          
                          {getDeliveryStatusBadge(order.deliveryStatus)}
                          
                          <p style={{ color: "#856404", fontSize: "14px", marginTop: "10px", fontStyle: 'italic' }}>
                            ✓ Your order is on the way!
                          </p>
                        </div>
                      )}
                      
                      {!isDelivered && !isInTransit && !isAcceptedByDeliveryman && (
                        <div style={{
                          backgroundColor: '#e7f3ff',
                          padding: '10px',
                          borderRadius: '5px',
                          marginTop: '10px',
                          border: '1px solid #007bff'
                        }}>
                          <p style={{ color: '#004085', fontSize: '14px', margin: 0 }}>
                            <FontAwesomeIcon icon={faInfoCircle} /> Waiting for deliveryman to accept...
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {order.status === "disapproved" && (
                    <div className="order-status-message-disapproved">
                      <p>✗ Order Disapproved by Farmer</p>
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
            onClick={() => setShowAllSellerOrders(!showAllSellerOrders)}
          >
            {showAllSellerOrders ? "Show Less" : `View All (${sellerOrders.length})`}
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </button>
        )}
      </div>

      <FooterNew />
    </div>
  );
}

export default RegSellerPage;
