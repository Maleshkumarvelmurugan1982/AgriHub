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
  faDownload,
  faSearch,
  faFilter,
  faSort,
  faTrash,
  faMoon,
  faSun,
  faChevronLeft,
  faCalendar,
  faBox,
  faCheck
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
  const [darkMode, setDarkMode] = useState(false);
  
  // New states for search, filter, sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const ordersPerPage = 8;
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
      backgroundColor: darkMode ? '#2d2d2d' : '#fff', 
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
      color: darkMode ? '#fff' : '#333', 
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

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    const styleId = 'hide-auth-links-regseller';
    if (document.getElementById(styleId)) return;
    const css = `
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
      
      body.dark-mode {
        background-color: #1a1a1a;
        color: #e0e0e0;
      }
      
      body.dark-mode .orders-container,
      body.dark-mode .order-item {
        background-color: #2d2d2d;
        color: #e0e0e0;
        border-color: #404040;
      }
      
      body.dark-mode .history-section {
        background-color: #2d2d2d !important;
      }
      
      body.dark-mode .history-item {
        background-color: #383838 !important;
        color: #e0e0e0 !important;
      }
      
      body.dark-mode .topic p {
        color: #e0e0e0;
      }
      
      body.dark-mode input,
      body.dark-mode select {
        background-color: #383838;
        color: #e0e0e0;
        border-color: #505050;
      }
      
      body.dark-mode .modal-content {
        background-color: #2d2d2d;
        color: #e0e0e0;
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

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/sellerorder/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSellerOrders(prev => prev.filter(order => order._id !== orderId));
        showToast("Order cancelled successfully", "success");
      } else {
        showToast("Failed to cancel order", "error");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      showToast("Error cancelling order", "error");
    }
  };

  const getFilteredAndSortedOrders = () => {
    let filtered = [...sellerOrders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(order => {
        if (filterStatus === "pending") return !order.status || order.status === "pending";
        if (filterStatus === "approved") return order.status === "approved";
        if (filterStatus === "disapproved") return order.status === "disapproved";
        if (filterStatus === "delivered") return order.deliveryStatus === "delivered" || order.deliveryStatus === "approved";
        if (filterStatus === "in-transit") return order.deliveryStatus === "in-transit";
        return true;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "name-asc":
          return (a.item || "").localeCompare(b.item || "");
        case "name-desc":
          return (b.item || "").localeCompare(a.item || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredOrders = getFilteredAndSortedOrders();
  
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const OrderTrackingModal = ({ order, onClose }) => {
    if (!order) return null;

    const getTimelineSteps = () => {
      const steps = [
        {
          label: "Order Placed",
          completed: true,
          date: order.createdAt,
          icon: faShoppingCart
        },
        {
          label: "Order Approved",
          completed: order.status === "approved" || order.deliveryStatus === "delivered" || order.deliveryStatus === "in-transit",
          date: order.status === "approved" ? order.updatedAt : null,
          icon: faCheckCircle
        },
        {
          label: "In Transit",
          completed: order.deliveryStatus === "in-transit" || order.deliveryStatus === "delivered",
          date: order.deliveryStatus === "in-transit" ? order.updatedAt : null,
          icon: faTruck
        },
        {
          label: "Delivered",
          completed: order.deliveryStatus === "delivered" || order.deliveryStatus === "approved",
          date: order.deliveryStatus === "delivered" ? order.updatedAt : null,
          icon: faBox
        }
      ];

      return steps;
    };

    const timelineSteps = getTimelineSteps();

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
      }}>
        <div className="modal-content" style={{
          backgroundColor: darkMode ? '#2d2d2d' : 'white',
          padding: '30px',
          borderRadius: '15px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: darkMode ? '#e0e0e0' : '#333'
          }}>
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <h2 style={{ marginBottom: '20px', color: darkMode ? '#e0e0e0' : '#333' }}>
            <FontAwesomeIcon icon={faTruck} /> Order Tracking
          </h2>

          <div style={{
            backgroundColor: darkMode ? '#383838' : '#f5f5f5',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: darkMode ? '#e0e0e0' : '#333' }}>{order.item}</h3>
            <p style={{ margin: '5px 0', color: darkMode ? '#b0b0b0' : '#666' }}>Order ID: {order._id}</p>
            <p style={{ margin: '5px 0', color: darkMode ? '#b0b0b0' : '#666' }}>Quantity: {order.quantity}</p>
            <p style={{ margin: '5px 0', color: darkMode ? '#b0b0b0' : '#666' }}>Price: Rs.{order.price}</p>
          </div>

          <div style={{ position: 'relative' }}>
            {timelineSteps.map((step, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '30px',
                position: 'relative'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: step.completed ? '#4caf50' : darkMode ? '#505050' : '#ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  flexShrink: 0,
                  zIndex: 2,
                  position: 'relative'
                }}>
                  <FontAwesomeIcon icon={step.icon} />
                </div>

                {index < timelineSteps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '25px',
                    top: '50px',
                    width: '2px',
                    height: '30px',
                    backgroundColor: step.completed ? '#4caf50' : darkMode ? '#505050' : '#ddd',
                    zIndex: 1
                  }} />
                )}

                <div style={{ marginLeft: '20px', flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 5px 0', 
                    color: step.completed ? '#4caf50' : darkMode ? '#808080' : '#999' 
                  }}>
                    {step.label}
                    {step.completed && <FontAwesomeIcon icon={faCheck} style={{ marginLeft: '10px', fontSize: '14px' }} />}
                  </h4>
                  {step.date && (
                    <p style={{ margin: 0, fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                      {formatDate(step.date)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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

  const exportToPDF = () => {
    if (purchasedItems.length === 0) {
      showToast("No purchase history to export", "error");
      return;
    }

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

  return (
    <div>
      <NavbarRegistered />
      <div className="nothing"></div>

      <div style={{
        position: 'fixed',
        top: '100px',
        left: '20px',
        zIndex: 9999
      }}>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '12px',
            backgroundColor: darkMode ? '#ffd700' : '#333',
            color: darkMode ? '#333' : '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
        </button>
      </div>

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
          backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
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
            <h2 style={{ margin: 0, color: darkMode ? '#e0e0e0' : '#333' }}>
              <FontAwesomeIcon icon={faHistory} /> Purchase History
            </h2>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                    backgroundColor: darkMode ? '#383838' : 'white',
                    border: `1px solid ${darkMode ? '#505050' : '#ddd'}`,
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
                        transition: 'background-color 0.2s',
                        color: darkMode ? '#e0e0e0' : '#333'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#2d2d2d' : '#f5f5f5'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <FontAwesomeIcon icon={faFilePdf} style={{ color: '#dc3545' }} />
                      Export as PDF
                    </button>
                    
                    <div style={{ height: '1px', backgroundColor: darkMode ? '#505050' : '#eee', margin: '0 10px' }} />
                    
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
                        transition: 'background-color 0.2s',
                        color: darkMode ? '#e0e0e0' : '#333'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = darkMode ? '#2d2d2d' : '#f5f5f5'}
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
                  color: darkMode ? '#b0b0b0' : '#666'
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          {purchasedItems.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: darkMode ? '#b0b0b0' : '#666', padding: '40px' }}>
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
                      backgroundColor: darkMode ? '#383838' : 'white',
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
                      <h3 style={{ margin: '0 0 10px 0', color: darkMode ? '#e0e0e0' : '#333' }}>{order.item}</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}><strong>Quantity:</strong> {order.quantity}</p>
                        <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}><strong>Price:</strong> Rs.{order.price}</p>
                        <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}><strong>Status:</strong> <span style={{ color: 'green' }}>✓ DELIVERED</span></p>
                        <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}><strong>Date:</strong> {formatDate(order.updatedAt || order.createdAt)}</p>
                      </div>
                      
                      <div style={{ 
                        marginTop: '10px', 
                        padding: '10px', 
                        backgroundColor: darkMode ? '#4a3800' : '#fff3cd', 
                        borderRadius: '5px',
                        borderLeft: '4px solid #ffc107'
                      }}>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: darkMode ? '#e0e0e0' : '#333' }}>
                          <FontAwesomeIcon icon={faUser} /> 
                          <strong> Purchased from:</strong> {farmerName}
                        </p>
                        {hasFarmerInfo && order.farmerId.mobile && (
                          <p style={{ margin: '5px 0', fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
                            <strong>Farmer Contact:</strong> {order.farmerId.mobile}
                          </p>
                        )}
                      </div>

                      {hasDeliverymanInfo && (
                        <div style={{ 
                          marginTop: '10px', 
                          padding: '10px', 
                          backgroundColor: darkMode ? '#1a3d1a' : '#e9f7ef', 
                          borderRadius: '5px',
                          borderLeft: '4px solid #28a745'
                        }}>
                          <p style={{ margin: '5px 0', fontSize: '14px', color: darkMode ? '#e0e0e0' : '#333' }}>
                            <FontAwesomeIcon icon={faTruck} /> 
                            <strong> Delivered by:</strong> {deliverymanName}
                          </p>
                          {order.deliverymanId.mobile && (
                            <p style={{ margin: '5px 0', fontSize: '14px', color: darkMode ? '#b0b0b0' : '#666' }}>
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
      <div className="topic"><p style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Your Orders</p></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px',
        padding: '20px',
        backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon 
              icon={faSearch} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: darkMode ? '#808080' : '#999'
              }} 
            />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: `1px solid ${darkMode ? '#505050' : '#ddd'}`,
                borderRadius: '5px',
                fontSize: '14px',
                backgroundColor: darkMode ? '#383838' : 'white',
                color: darkMode ? '#e0e0e0' : '#333'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon 
              icon={faFilter} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: darkMode ? '#808080' : '#999'
              }} 
            />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: `1px solid ${darkMode ? '#505050' : '#ddd'}`,
                borderRadius: '5px',
                fontSize: '14px',
                backgroundColor: darkMode ? '#383838' : 'white',
                color: darkMode ? '#e0e0e0' : '#333',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="disapproved">Disapproved</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <FontAwesomeIcon 
              icon={faSort} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: darkMode ? '#808080' : '#999'
              }} 
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: `1px solid ${darkMode ? '#505050' : '#ddd'}`,
                borderRadius: '5px',
                fontSize: '14px',
                backgroundColor: darkMode ? '#383838' : 'white',
                color: darkMode ? '#e0e0e0' : '#333',
                cursor: 'pointer'
              }}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontSize: '14px',
          color: darkMode ? '#b0b0b0' : '#666'
        }}>
          <span>Showing {currentOrders.length} of {filteredOrders.length} orders</span>
          {(searchTerm || filterStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setSortBy("date-desc");
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="orders-wrapper">
        <div className="orders-container">
          {currentOrders.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#b0b0b0' : '#666' }}>
              {searchTerm || filterStatus !== "all" 
                ? "No orders match your search criteria." 
                : "You don't have any orders yet."}
            </p>
          ) : (
            currentOrders.map((order, index) => {
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
              const isPending = !order.status || order.status === "pending";

              return (
                <div key={order._id || index} className="order-item" style={{
                  backgroundColor: darkMode ? '#2d2d2d' : 'white',
                  position: 'relative'
                }}>
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
                  <p style={{ color: darkMode ? '#e0e0e0' : '#333' }}><strong>{order.item || "Unknown Item"}</strong></p>
                  {order.quantity && <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Quantity: {order.quantity}</p>}
                  {order.price && <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Price: Rs.{order.price}</p>}
                  {order.postedDate && <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Posted: {order.postedDate}</p>}
                  {order.expireDate && <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Expires: {order.expireDate}</p>}
                  <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
                    Status: <b style={{ color: getStatusColor(order.status) }}>
                      {order.status?.toUpperCase() || "PENDING"}
                    </b>
                  </p>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginTop: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {(order.status === "approved" || isInTransit || isDelivered) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowTrackingModal(true);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <FontAwesomeIcon icon={faTruck} />
                        Track Order
                      </button>
                    )}

                    {isPending && (
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        Cancel Order
                      </button>
                    )}
                  </div>
                  
                  {order.status === "approved" && (
                    <>
                      {isDelivered && (
                        <div className="delivery-info" style={{
                          backgroundColor: darkMode ? '#1a3d1a' : '#d4edda',
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
                              <p className="deliveryman-detail" style={{ marginBottom: '5px', color: darkMode ? '#b0b0b0' : '#333' }}>
                                <FontAwesomeIcon icon={faTruck} /> Delivered by: <strong>{deliverymanName}</strong>
                              </p>
                              
                              {order.deliverymanId.mobile && (
                                <p className="deliveryman-detail" style={{ marginBottom: '5px', color: darkMode ? '#b0b0b0' : '#333' }}>
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
                          backgroundColor: darkMode ? '#4a3800' : '#fff3cd',
                          padding: '15px',
                          borderRadius: '8px',
                          marginTop: '10px',
                          border: '2px solid #ffc107'
                        }}>
                          <p className="deliveryman-info" style={{ color: '#856404', fontWeight: 'bold', marginBottom: '10px' }}>
                            <FontAwesomeIcon icon={faTruck} style={{ marginRight: '8px' }} />
                            IN TRANSIT - ACCEPTED BY DELIVERYMAN
                          </p>
                          
                          <p className="deliveryman-info" style={{ color: darkMode ? '#e0e0e0' : '#333' }}>
                            <FontAwesomeIcon icon={faTruck} /> 
                            Deliveryman: <strong>{deliverymanName}</strong>
                          </p>
                          
                          {hasDeliverymanInfo && (
                            <>
                              {order.deliverymanId.mobile && (
                                <p className="deliveryman-detail" style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Mobile: {order.deliverymanId.mobile}</p>
                              )}
                              {order.deliverymanId.email && (
                                <p className="deliveryman-detail" style={{ color: darkMode ? '#b0b0b0' : '#666' }}>Email: {order.deliverymanId.email}</p>
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
                          backgroundColor: darkMode ? '#1a2a3a' : '#e7f3ff',
                          padding: '10px',
                          borderRadius: '5px',
                          marginTop: '10px',
                          border: '1px solid #007bff'
                        }}>
                          <p style={{ color: darkMode ? '#6db3f2' : '#004085', fontSize: '14px', margin: 0 }}>
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
        
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '10px 15px',
                backgroundColor: currentPage === 1 ? (darkMode ? '#404040' : '#ccc') : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Previous
            </button>

            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      style={{
                        padding: '10px 15px',
                        backgroundColor: currentPage === pageNum ? '#28a745' : (darkMode ? '#383838' : '#f8f9fa'),
                        color: currentPage === pageNum ? 'white' : (darkMode ? '#e0e0e0' : '#333'),
                        border: `1px solid ${darkMode ? '#505050' : '#ddd'}`,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} style={{ padding: '10px 5px', color: darkMode ? '#808080' : '#666' }}>...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 15px',
                backgroundColor: currentPage === totalPages ? (darkMode ? '#404040' : '#ccc') : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>

      {showTrackingModal && selectedOrder && (
        <OrderTrackingModal 
          order={selectedOrder} 
          onClose={() => {
            setShowTrackingModal(false);
            setSelectedOrder(null);
          }} 
        />
      )}

      <FooterNew />
    </div>
  );
}

export default RegSellerPage;
