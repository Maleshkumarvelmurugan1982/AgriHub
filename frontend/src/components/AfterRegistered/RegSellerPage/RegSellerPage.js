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
  faDownload,
  faFileDownload
} from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";

function RegSellerPage() {
  const [sellerId, setSellerId] = useState("");
  const [sellerOrders, setSellerOrders] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showAllSellerOrders, setShowAllSellerOrders] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
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

  // Statistics calculation functions
  const calculateStatistics = (orders, period) => {
    const now = new Date();
    let startDate;

    if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      return orderDate >= startDate && orderDate <= now;
    });

    const totalSpent = filteredOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalQuantity = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) || 0), 0);

    // Product breakdown
    const productStats = {};
    filteredOrders.forEach(order => {
      const productName = order.item || 'Unknown';
      if (!productStats[productName]) {
        productStats[productName] = {
          quantity: 0,
          spent: 0,
          orders: 0
        };
      }
      productStats[productName].quantity += Number(order.quantity) || 0;
      productStats[productName].spent += Number(order.price) || 0;
      productStats[productName].orders += 1;
    });

    // Farmer breakdown
    const farmerStats = {};
    filteredOrders.forEach(order => {
      const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
      const farmerName = hasFarmerInfo 
        ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown Farmer'
        : 'Unknown Farmer';
      
      if (!farmerStats[farmerName]) {
        farmerStats[farmerName] = {
          orders: 0,
          spent: 0,
          quantity: 0
        };
      }
      farmerStats[farmerName].orders += 1;
      farmerStats[farmerName].spent += Number(order.price) || 0;
      farmerStats[farmerName].quantity += Number(order.quantity) || 0;
    });

    // Payment method breakdown
    const paymentStats = {
      wallet: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    };

    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'other';
      const category = method === 'wallet' ? 'wallet' : (method === 'card' ? 'card' : 'other');
      paymentStats[category].count += 1;
      paymentStats[category].amount += Number(order.price) || 0;
    });

    return {
      period,
      startDate,
      endDate: now,
      totalSpent,
      totalOrders,
      totalQuantity,
      productStats,
      farmerStats,
      paymentStats,
      orders: filteredOrders
    };
  };

  // Get Farmer Info Helper
  const getFarmerInfo = (order) => {
    const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
    const farmerName = hasFarmerInfo 
      ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown Farmer'
      : 'Unknown Farmer';
    return { name: farmerName, info: order.farmerId };
  };

  // Download as CSV
  const downloadCSV = (period) => {
    const stats = calculateStatistics(purchasedItems, period);
    
    let csv = `Purchase Report - ${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csv += `Generated on: ${new Date().toLocaleString()}\n`;
    csv += `Period: ${stats.startDate.toLocaleDateString()} to ${stats.endDate.toLocaleDateString()}\n\n`;
    
    csv += `Summary\n`;
    csv += `Total Orders,${stats.totalOrders}\n`;
    csv += `Total Spent (Rs.),${stats.totalSpent.toFixed(2)}\n`;
    csv += `Total Quantity Purchased (kg),${stats.totalQuantity.toFixed(2)}\n`;
    csv += `Average Order Value (Rs.),${stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : 0}\n\n`;
    
    csv += `Product Breakdown\n`;
    csv += `Product Name,Quantity Purchased (kg),Total Spent (Rs.),Number of Orders,Average Price per kg (Rs.)\n`;
    Object.entries(stats.productStats).forEach(([product, data]) => {
      csv += `${product},${data.quantity.toFixed(2)},${data.spent.toFixed(2)},${data.orders},${(data.spent / data.quantity).toFixed(2)}\n`;
    });
    
    csv += `\nFarmer Breakdown\n`;
    csv += `Farmer Name,Total Orders,Total Spent (Rs.),Total Quantity (kg)\n`;
    Object.entries(stats.farmerStats).forEach(([farmer, data]) => {
      csv += `${farmer},${data.orders},${data.spent.toFixed(2)},${data.quantity.toFixed(2)}\n`;
    });
    
    csv += `\nPayment Method Breakdown\n`;
    csv += `Method,Number of Transactions,Total Amount (Rs.)\n`;
    csv += `Wallet,${stats.paymentStats.wallet.count},${stats.paymentStats.wallet.amount.toFixed(2)}\n`;
    csv += `Card,${stats.paymentStats.card.count},${stats.paymentStats.card.amount.toFixed(2)}\n`;
    csv += `Other,${stats.paymentStats.other.count},${stats.paymentStats.other.amount.toFixed(2)}\n`;
    
    csv += `\nDetailed Orders\n`;
    csv += `Order Number,Date,Product,Quantity (kg),Price (Rs.),Payment Status,Payment Method,Farmer,Deliveryman\n`;
    stats.orders.forEach(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt).toLocaleDateString();
      const farmerInfo = getFarmerInfo(order);
      const hasDeliverymanInfo = order.deliverymanId && typeof order.deliverymanId === 'object';
      const deliverymanName = hasDeliverymanInfo
        ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim()
        : 'N/A';
      
      csv += `${order.orderNumber || order._id},${orderDate},${order.item},${order.quantity},${order.price},${order.paymentStatus || 'N/A'},${order.paymentMethod || 'N/A'},${farmerInfo.name},${deliverymanName}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `purchase_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download as PDF using HTML to print
  const downloadPDF = (period) => {
    const stats = calculateStatistics(purchasedItems, period);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
          }
          h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
          }
          .meta {
            color: #666;
            font-size: 12px;
            margin-top: 10px;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          h2 {
            color: #333;
            border-bottom: 2px solid #28a745;
            padding-bottom: 10px;
            font-size: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            page-break-inside: avoid;
          }
          th {
            background-color: #007bff;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          tr:hover {
            background-color: #e9ecef;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
          }
          .product-table th {
            background-color: #28a745;
          }
          .farmer-table th {
            background-color: #ffc107;
            color: #333;
          }
          .payment-table th {
            background-color: #17a2b8;
          }
          .order-table th {
            background-color: #dc3545;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body {
              padding: 20px;
            }
            .section {
              page-break-inside: avoid;
            }
            table {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Purchase Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</h1>
          <div class="meta">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Period: ${stats.startDate.toLocaleDateString()} to ${stats.endDate.toLocaleDateString()}</p>
          </div>
        </div>

        <div class="section">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total Orders</h3>
              <div class="value">${stats.totalOrders}</div>
            </div>
            <div class="summary-card">
              <h3>Total Spent</h3>
              <div class="value">Rs. ${stats.totalSpent.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Total Quantity Purchased</h3>
              <div class="value">${stats.totalQuantity.toFixed(2)} kg</div>
            </div>
            <div class="summary-card">
              <h3>Average Order Value</h3>
              <div class="value">Rs. ${stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : 0}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Product Breakdown</h2>
          <table class="product-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Purchased</th>
                <th>Total Spent</th>
                <th>Orders</th>
                <th>Avg Price/kg</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats.productStats).map(([product, data]) => `
                <tr>
                  <td>${product}</td>
                  <td>${data.quantity.toFixed(2)} kg</td>
                  <td>Rs. ${data.spent.toFixed(2)}</td>
                  <td>${data.orders}</td>
                  <td>Rs. ${(data.spent / data.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Farmer Breakdown (Purchase History by Farmer)</h2>
          <table class="farmer-table">
            <thead>
              <tr>
                <th>Farmer Name</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Total Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats.farmerStats).map(([farmer, data]) => `
                <tr>
                  <td>${farmer}</td>
                  <td>${data.orders}</td>
                  <td>Rs. ${data.spent.toFixed(2)}</td>
                  <td>${data.quantity.toFixed(2)} kg</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Payment Method Breakdown</h2>
          <table class="payment-table">
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Number of Transactions</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Wallet</td>
                <td>${stats.paymentStats.wallet.count}</td>
                <td>Rs. ${stats.paymentStats.wallet.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Card</td>
                <td>${stats.paymentStats.card.count}</td>
                <td>Rs. ${stats.paymentStats.card.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Other</td>
                <td>${stats.paymentStats.other.count}</td>
                <td>Rs. ${stats.paymentStats.other.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Recent Orders (Latest 20)</h2>
          <table class="order-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Farmer</th>
              </tr>
            </thead>
            <tbody>
              ${stats.orders.slice(0, 20).map(order => {
                const farmerInfo = getFarmerInfo(order);
                return `
                  <tr>
                    <td>${order.orderNumber || order._id.substring(0, 8)}</td>
                    <td>${new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</td>
                    <td>${order.item}</td>
                    <td>${order.quantity} kg</td>
                    <td>Rs. ${order.price}</td>
                    <td>${order.paymentStatus || 'N/A'}</td>
                    <td>${farmerInfo.name}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This is an automatically generated purchase report</p>
          <p>© AgriHub - Farm Management System</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      }, 250);
    };
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
            marginBottom: '20px'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>
              <FontAwesomeIcon icon={faHistory} /> Purchase History
            </h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Download Report
                </button>
                {showDownloadMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '5px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '200px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '10px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
                      <strong style={{ fontSize: '14px', color: '#333' }}>Select Report Type</strong>
                    </div>
                    <button 
                      onClick={() => { downloadPDF('monthly'); setShowDownloadMenu(false); }}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <FontAwesomeIcon icon={faFileDownload} style={{ marginRight: '10px', color: '#dc3545' }} />
                      Monthly Report (PDF)
                    </button>
                    <button 
                      onClick={() => { downloadCSV('monthly'); setShowDownloadMenu(false); }}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <FontAwesomeIcon icon={faFileDownload} style={{ marginRight: '10px', color: '#28a745' }} />
                      Monthly Report (CSV)
                    </button>
                    <button 
                      onClick={() => { downloadPDF('yearly'); setShowDownloadMenu(false); }}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f0f0f0',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <FontAwesomeIcon icon={faFileDownload} style={{ marginRight: '10px', color: '#dc3545' }} />
                      Yearly Report (PDF)
                    </button>
                    <button 
                      onClick={() => { downloadCSV('yearly'); setShowDownloadMenu(false); }}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: 'none',
                        backgroundColor: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <FontAwesomeIcon icon={faFileDownload} style={{ marginRight: '10px', color: '#28a745' }} />
                      Yearly Report (CSV)
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
