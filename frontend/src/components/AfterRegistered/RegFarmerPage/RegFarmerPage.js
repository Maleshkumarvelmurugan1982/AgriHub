import React, { useState, useEffect } from "react";
import "./RegFarmerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../../AfterRegistered/RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faThumbsUp,
  faThumbsDown,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faHistory,
  faTimes,
  faWallet,
  faCreditCard,
  faMoneyBillWave,
  faInfoCircle,
  faDownload,
  faFileDownload
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
  const [showAllSellerOrders, setShowAllSellerOrders] = useState(true);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const BASE_URL = "https://agrihub-2.onrender.com";

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
        const data = await response.json();
        if (data.status === "ok" && data.orders) {
          setSellerOrders(data.orders);
        } else if (Array.isArray(data)) {
          setSellerOrders(data);
        } else if (data.data && Array.isArray(data.data)) {
          setSellerOrders(data.data);
        } else {
          setSellerOrders([]);
        }
      } catch (err) {
        setSellerOrders([]);
      }
    };

    const fetchFarmerOrders = async () => {
      try {
        const response = await fetch(`${BASE_URL}/farmerorder/`);
        const data = await response.json();
        const orders = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
        const filteredOrders = orders.filter(order => order.farmerId !== farmerId);
        setFarmerOrders(filteredOrders);
      } catch (err) {
        setFarmerOrders([]);
      }
    };

    const fetchDeliveryPosts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/deliverypost/`);
        const data = await response.json();
        setDeliveryPosts(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
      } catch (err) {
        setDeliveryPosts([]);
      }
    };

    const fetchSchemes = async () => {
      try {
        const response = await fetch(`${BASE_URL}/schemes/`);
        const data = await response.json();
        setSchemes(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
      } catch (err) {
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

  const restoreProductQuantity = async (order, result) => {
    try {
      console.log("🔍 Starting quantity restoration...");
      console.log("📦 Order data:", order);

      let productId;
      if (order.productId && typeof order.productId === 'object' && order.productId._id) {
        productId = order.productId._id;
        console.log("📌 Extracted productId from object:", productId);
      } else if (order.productId && typeof order.productId === 'string') {
        productId = order.productId;
        console.log("📌 Using productId as string:", productId);
      } else {
        console.error("❌ Invalid productId format:", order.productId);
        productId = null;
      }

      const restoreQty = Number(order.quantity) || 0;

      console.log("🆔 Final Product ID:", productId);
      console.log("📊 Quantity to restore:", restoreQty, "kg");

      if (!productId || productId === 'undefined' || productId === 'null') {
        console.error("❌ Product ID not found in order");
        alert("❌ ERROR: Product ID not found in order.\nCannot restore quantity.\n\nThis may be an old order created before the system update.\nPlease update inventory manually.");
        return { success: false, error: "Product ID not found" };
      }

      if (restoreQty <= 0 || isNaN(restoreQty)) {
        console.error("❌ Invalid quantity:", restoreQty);
        alert(`❌ ERROR: Invalid quantity to restore: ${restoreQty}\n\nPlease update inventory manually.`);
        return { success: false, error: "Invalid quantity" };
      }

      console.log(`🔄 Will restore ${restoreQty} kg to product ID: ${productId}`);

      console.log("🌐 GET request to:", `${BASE_URL}/product/${productId}`);
      const getProd = await fetch(`${BASE_URL}/product/${productId}`);
      
      console.log("📡 GET Status:", getProd.status, getProd.statusText);
      
      if (!getProd.ok) {
        const errorText = await getProd.text();
        console.error("❌ Failed to fetch product:", errorText);
        alert(`❌ ERROR: Cannot fetch product from database.\nStatus: ${getProd.status}\nProduct ID: ${productId}\n\nPlease update inventory manually.`);
        return { success: false, error: `Fetch failed: ${getProd.status}` };
      }

      const productData = await getProd.json();
      console.log("📦 Received product data:", productData);
      
      const currentQty = Number(productData.quantity) || 0;
      const productName = productData.productName || order.item || "Unknown Product";
      const restoredQty = currentQty + restoreQty;

      console.log(`📦 Product: ${productName}`);
      console.log(`📊 Current DB quantity: ${currentQty} kg`);
      console.log(`➕ Restoring: ${restoreQty} kg`);
      console.log(`✅ New total: ${restoredQty} kg`);

      console.log("🌐 PATCH request to:", `${BASE_URL}/product/${productId}`);
      console.log("📤 Sending data:", { quantity: restoredQty });
      
      const updateRes = await fetch(`${BASE_URL}/product/${productId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ quantity: restoredQty })
      });

      console.log("📡 PATCH Status:", updateRes.status, updateRes.statusText);

      if (!updateRes.ok) {
        const errorText = await updateRes.text();
        console.error("❌ Update failed:", errorText);
        alert(`❌ ERROR: Failed to update product quantity in database.\nStatus: ${updateRes.status}\nProduct: ${productName}\nTried to set: ${restoredQty} kg\n\nPlease update inventory manually to: ${restoredQty} kg`);
        return { success: false, error: `Update failed: ${updateRes.status}` };
      }

      const updateResult = await updateRes.json();
      console.log("✅ Update response:", updateResult);

      console.log("🔍 Verifying update...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const verifyRes = await fetch(`${BASE_URL}/product/${productId}`);
      if (verifyRes.ok) {
        const verifiedData = await verifyRes.json();
        const verifiedQty = Number(verifiedData.quantity) || 0;
        console.log("🔍 Verified quantity in DB:", verifiedQty, "kg");
        
        if (Math.abs(verifiedQty - restoredQty) < 0.01) {
          console.log("✅✅✅ VERIFICATION PASSED!");
        } else {
          console.warn(`⚠️ Verification mismatch! Expected: ${restoredQty}, Got: ${verifiedQty}`);
        }
      }

      window.dispatchEvent(new CustomEvent("orderDisapproved", {
        detail: { 
          productId: productId, 
          quantity: restoreQty,
          newQuantity: restoredQty 
        }
      }));

      window.dispatchEvent(new CustomEvent("productQuantityRestored", {
        detail: { 
          productId: productId, 
          restoredQuantity: restoreQty,
          totalQuantity: restoredQty 
        }
      }));

      console.log(`✅✅✅ Restoration complete: ${currentQty} + ${restoreQty} = ${restoredQty} kg`);
      
      return { success: true, restoredQty, newTotal: restoredQty, productName };
      
    } catch (restoreErr) {
      console.error("❌❌❌ EXCEPTION in restoreProductQuantity:");
      console.error("Error:", restoreErr);
      console.error("Stack:", restoreErr.stack);
      alert(`❌ CRITICAL ERROR: ${restoreErr.message}\n\nOrder was disapproved but quantity restoration failed.\n\nPlease manually restore ${order.quantity} kg to "${order.item}".\n\nCheck browser console (F12) for technical details.`);
      return { success: false, error: restoreErr.message };
    }
  };

  const showSuccessMessage = (newStatus, result, order, restoreResult) => {
    if (newStatus === 'disapproved') {
      let message = `✅ Order disapproved successfully!\n\n`;
      
      if (result.refunded && order.paymentStatus === 'paid') {
        message += `💰 Refund Details:\n`;
        message += `   Amount: Rs. ${result.refundAmount || order.price}\n`;
        message += `   Status: Refunded to seller's ${order.paymentMethod || 'wallet'}\n\n`;
      }
      
      if (restoreResult && restoreResult.success) {
        message += `📦 Inventory Update:\n`;
        message += `   Product: ${restoreResult.productName || order.item}\n`;
        message += `   Restored: +${restoreResult.restoredQty} kg\n`;
        message += `   New Total: ${restoreResult.newTotal} kg`;
      } else if (restoreResult && !restoreResult.success) {
        message += `⚠️ Inventory Warning:\n`;
        message += `   Automatic restoration failed\n`;
        message += `   Please manually add ${order.quantity} kg to "${order.item}"`;
      }
      
      alert(message);
    } else if (newStatus === 'approved') {
      alert(`✅ Order approved successfully!`);
    }
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const order = sellerOrders.find(o => o._id === orderId);
      if (!order) {
        alert("Order not found");
        return;
      }

      if (newStatus === 'disapproved') {
        const confirmMessage = order.paymentStatus === 'paid' 
          ? `Are you sure you want to disapprove this order?\n\n⚠️ Actions that will be taken:\n• Seller will be refunded Rs. ${order.price}\n• Payment Method: ${order.paymentMethod || 'wallet'}\n• Product quantity (${order.quantity} kg) will be restored to inventory`
          : `Are you sure you want to disapprove this order?\n\n⚠️ Product quantity (${order.quantity} kg) will be restored to inventory`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      const res = await fetch(`${BASE_URL}/sellerorder/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: orderId, 
          status: newStatus, 
          farmerId: farmerId 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update order");
      }
      
      const result = await res.json();

      if (result.status === 'ok') {
        setSellerOrders(prev =>
          prev.map(o => o._id === orderId ? result.order : o)
        );

        let restoreResult = null;
        if (newStatus === 'disapproved') {
          restoreResult = await restoreProductQuantity(order, result);
        }

        showSuccessMessage(newStatus, result, order, restoreResult);
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
      .filter(order => order.status === "approved" && (order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"))
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });
  };

  const soldProducts = getSoldProducts();

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

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalQuantity = filteredOrders.reduce((sum, order) => sum + (Number(order.quantity) || 0), 0);

    // Product breakdown
    const productStats = {};
    filteredOrders.forEach(order => {
      const productName = order.item || 'Unknown';
      if (!productStats[productName]) {
        productStats[productName] = {
          quantity: 0,
          revenue: 0,
          orders: 0
        };
      }
      productStats[productName].quantity += Number(order.quantity) || 0;
      productStats[productName].revenue += Number(order.price) || 0;
      productStats[productName].orders += 1;
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
      totalRevenue,
      totalOrders,
      totalQuantity,
      productStats,
      paymentStats,
      orders: filteredOrders
    };
  };

  // Download as CSV
  const downloadCSV = (period) => {
    const stats = calculateStatistics(soldProducts, period);
    
    let csv = `Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csv += `Generated on: ${new Date().toLocaleString()}\n`;
    csv += `Period: ${stats.startDate.toLocaleDateString()} to ${stats.endDate.toLocaleDateString()}\n\n`;
    
    csv += `Summary\n`;
    csv += `Total Orders,${stats.totalOrders}\n`;
    csv += `Total Revenue (Rs.),${stats.totalRevenue.toFixed(2)}\n`;
    csv += `Total Quantity Sold (kg),${stats.totalQuantity.toFixed(2)}\n`;
    csv += `Average Order Value (Rs.),${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : 0}\n\n`;
    
    csv += `Product Breakdown\n`;
    csv += `Product Name,Quantity Sold (kg),Revenue (Rs.),Number of Orders,Average Price per kg (Rs.)\n`;
    Object.entries(stats.productStats).forEach(([product, data]) => {
      csv += `${product},${data.quantity.toFixed(2)},${data.revenue.toFixed(2)},${data.orders},${(data.revenue / data.quantity).toFixed(2)}\n`;
    });
    
    csv += `\nPayment Method Breakdown\n`;
    csv += `Method,Number of Transactions,Total Amount (Rs.)\n`;
    csv += `Wallet,${stats.paymentStats.wallet.count},${stats.paymentStats.wallet.amount.toFixed(2)}\n`;
    csv += `Card,${stats.paymentStats.card.count},${stats.paymentStats.card.amount.toFixed(2)}\n`;
    csv += `Other,${stats.paymentStats.other.count},${stats.paymentStats.other.amount.toFixed(2)}\n`;
    
    csv += `\nDetailed Orders\n`;
    csv += `Order Number,Date,Product,Quantity (kg),Price (Rs.),Payment Status,Payment Method,Seller,Deliveryman\n`;
    stats.orders.forEach(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt).toLocaleDateString();
      const sellerInfo = getSellerInfo(order);
      const deliverymanName = order.deliverymanId && typeof order.deliverymanId === 'object'
        ? `${order.deliverymanId.fname || ''} ${order.deliverymanId.lname || ''}`.trim()
        : 'N/A';
      
      csv += `${order.orderNumber || order._id},${orderDate},${order.item},${order.quantity},${order.price},${order.paymentStatus || 'N/A'},${order.paymentMethod || 'N/A'},${sellerInfo.name},${deliverymanName}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download as PDF using HTML to print
  const downloadPDF = (period) => {
    const stats = calculateStatistics(soldProducts, period);
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</title>
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
          .payment-table th {
            background-color: #ffc107;
            color: #333;
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
          <h1>Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}</h1>
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
              <h3>Total Revenue</h3>
              <div class="value">Rs. ${stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Total Quantity Sold</h3>
              <div class="value">${stats.totalQuantity.toFixed(2)} kg</div>
            </div>
            <div class="summary-card">
              <h3>Average Order Value</h3>
              <div class="value">Rs. ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : 0}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Product Breakdown</h2>
          <table class="product-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Avg Price/kg</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats.productStats).map(([product, data]) => `
                <tr>
                  <td>${product}</td>
                  <td>${data.quantity.toFixed(2)} kg</td>
                  <td>Rs. ${data.revenue.toFixed(2)}</td>
                  <td>${data.orders}</td>
                  <td>Rs. ${(data.revenue / data.quantity).toFixed(2)}</td>
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
                <th>Seller</th>
              </tr>
            </thead>
            <tbody>
              ${stats.orders.slice(0, 20).map(order => {
                const sellerInfo = getSellerInfo(order);
                return `
                  <tr>
                    <td>${order.orderNumber || order._id.substring(0, 8)}</td>
                    <td>${new Date(order.updatedAt || order.createdAt).toLocaleDateString()}</td>
                    <td>${order.item}</td>
                    <td>${order.quantity} kg</td>
                    <td>Rs. ${order.price}</td>
                    <td>${order.paymentStatus || 'N/A'}</td>
                    <td>${sellerInfo.name}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>This is an automatically generated sales report</p>
          <p>© AgriHub - Farm Management System</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    printWindow.onload = function() {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (user can cancel)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      }, 250);
    };
  };

  const getPlaceFromSeller = (sellerObj = {}) => {
    const placeParts = [];
    const maybe = (field) => {
      const v = sellerObj[field];
      if (v && typeof v === "string" && v.trim()) placeParts.push(v.trim());
    };
    maybe("village");
    maybe("place");
    maybe("city");
    maybe("address");
    maybe("taluk");
    maybe("district");
    maybe("state");
    return placeParts.join(", ");
  };

  const getSellerInfo = (order) => {
    const sellerSource = order.sellerId && typeof order.sellerId === "object"
      ? order.sellerId
      : (order.seller && typeof order.seller === "object" ? order.seller : null);
    
    if (sellerSource) {
      const name = `${sellerSource.fname || sellerSource.firstName || ""} ${sellerSource.lname || sellerSource.lastName || ""}`.trim() || "Unknown Seller";
      const place = getPlaceFromSeller(sellerSource);
      return { name, place };
    }
    
    if (order.sellerId && typeof order.sellerId === "string") {
      return { name: `Seller ID: ${order.sellerId}`, place: "" };
    }
    
    return { name: "Unknown Seller", place: "" };
  };

  const sellerOrdersToDisplay = showAllSellerOrders ? sellerOrders : sellerOrders.slice(0, 4);

  return (
    <div>
      <NavbarRegistered />

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

      <div className="categories-container">
        <div className="categories-div">
          <RegCategories />
        </div>
      </div>

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
                const { name: sellerName } = getSellerInfo(order);

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
              const { name: sellerName, place: sellerPlace } = getSellerInfo(order);

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

                  <p style={{ marginTop: '6px', fontSize: '14px', color: '#333' }}>
                    <strong>Seller:</strong> {sellerName}
                    {sellerPlace ? <span style={{ color: '#666', marginLeft: '8px' }}> - {sellerPlace}</span> : null}
                  </p>

                  <p>
                    Status: <b style={{color: getStatusColor(order.status)}}>
                      {order.status?.toUpperCase() || "PENDING"}
                    </b>
                  </p>
                  
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
                      <p style={{ fontSize: '12px', marginTop: '5px', color: '#28a745' }}>
                        📦 Quantity restored to inventory
                      </p>
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
