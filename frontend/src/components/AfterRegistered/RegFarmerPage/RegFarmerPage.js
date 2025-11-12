import React, { useState, useEffect, useCallback } from "react";
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
  faFileDownload,
  faSearch,
  faFilter,
  faCheckSquare,
  faSquare,
  faExclamationTriangle,
  faUndo,
  faChevronLeft,
  faChevronDown,
  faFileExport,
  faBell
} from "@fortawesome/free-solid-svg-icons";

function FarmerPage() {
  const [farmerId, setFarmerId] = useState("");
  const [sellerOrders, setSellerOrders] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [appliedSchemes, setAppliedSchemes] = useState([]);
  const [showSchemes, setShowSchemes] = useState(false);
  const [showAppliedSchemes, setShowAppliedSchemes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk Actions States
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(8);
  
  // Undo States
  const [undoStack, setUndoStack] = useState([]);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  
  // Inventory Alerts States
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [showInventoryAlerts, setShowInventoryAlerts] = useState(false);

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
    fetchSchemes();
  }, [farmerId]);

  // Check inventory and generate alerts
  useEffect(() => {
    const checkInventory = async () => {
      try {
        const response = await fetch(`${BASE_URL}/product/`);
        const products = await response.json();
        
        const alerts = [];
        products.forEach(product => {
          const qty = Number(product.quantity) || 0;
          if (qty === 0) {
            alerts.push({
              type: 'out-of-stock',
              severity: 'high',
              product: product.productName,
              message: `${product.productName} is out of stock!`,
              productId: product._id
            });
          } else if (qty < 10) {
            alerts.push({
              type: 'low-stock',
              severity: 'medium',
              product: product.productName,
              message: `${product.productName} is running low (${qty} kg remaining)`,
              quantity: qty,
              productId: product._id
            });
          }
        });
        
        setInventoryAlerts(alerts);
      } catch (err) {
        console.error("Error checking inventory:", err);
      }
    };

    if (farmerId) {
      checkInventory();
      const interval = setInterval(checkInventory, 60000);
      return () => clearInterval(interval);
    }
  }, [farmerId, sellerOrders]);

  // Undo timer
  useEffect(() => {
    if (undoStack.length > 0) {
      const timer = setTimeout(() => {
        setUndoStack([]);
        setShowUndoNotification(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [undoStack]);

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

  const restoreProductQuantity = async (order) => {
    try {
      let productId;
      if (order.productId && typeof order.productId === 'object' && order.productId._id) {
        productId = order.productId._id;
      } else if (order.productId && typeof order.productId === 'string') {
        productId = order.productId;
      } else {
        productId = null;
      }

      const restoreQty = Number(order.quantity) || 0;

      if (!productId || productId === 'undefined' || productId === 'null') {
        alert("❌ ERROR: Product ID not found in order.\nCannot restore quantity.");
        return { success: false, error: "Product ID not found" };
      }

      if (restoreQty <= 0 || isNaN(restoreQty)) {
        alert(`❌ ERROR: Invalid quantity to restore: ${restoreQty}`);
        return { success: false, error: "Invalid quantity" };
      }

      const getProd = await fetch(`${BASE_URL}/product/${productId}`);
      
      if (!getProd.ok) {
        alert(`❌ ERROR: Cannot fetch product from database.`);
        return { success: false, error: `Fetch failed: ${getProd.status}` };
      }

      const productData = await getProd.json();
      const currentQty = Number(productData.quantity) || 0;
      const productName = productData.productName || order.item || "Unknown Product";
      const restoredQty = currentQty + restoreQty;

      const updateRes = await fetch(`${BASE_URL}/product/${productId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ quantity: restoredQty })
      });

      if (!updateRes.ok) {
        alert(`❌ ERROR: Failed to update product quantity in database.`);
        return { success: false, error: `Update failed: ${updateRes.status}` };
      }

      return { success: true, restoredQty, newTotal: restoredQty, productName };
      
    } catch (restoreErr) {
      alert(`❌ CRITICAL ERROR: ${restoreErr.message}`);
      return { success: false, error: restoreErr.message };
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
          ? `Are you sure you want to disapprove this order?\n\n⚠️ Actions:\n• Seller refunded Rs. ${order.price}\n• Quantity (${order.quantity} kg) restored`
          : `Are you sure you want to disapprove this order?\n\n⚠️ Quantity (${order.quantity} kg) will be restored`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      const previousState = {
        orderId: orderId,
        previousStatus: order.status,
        order: { ...order },
        timestamp: Date.now()
      };

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
          restoreResult = await restoreProductQuantity(order);
          previousState.quantityRestored = true;
          previousState.restoreResult = restoreResult;
        }

        setUndoStack([previousState]);
        setShowUndoNotification(true);

        let message = newStatus === 'approved' 
          ? '✅ Order approved successfully!' 
          : '✅ Order disapproved successfully!';
        
        if (newStatus === 'disapproved' && restoreResult?.success) {
          message += `\n\n📦 Inventory: +${restoreResult.restoredQty} kg restored`;
        }
        
        alert(message);
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order: " + err.message);
    }
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[0];
    const timeSinceAction = Date.now() - lastAction.timestamp;

    if (timeSinceAction > 30000) {
      alert("Undo time limit exceeded (30 seconds)");
      setUndoStack([]);
      setShowUndoNotification(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/sellerorder/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          orderId: lastAction.orderId, 
          status: lastAction.previousStatus, 
          farmerId: farmerId 
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSellerOrders(prev =>
          prev.map(o => o._id === lastAction.orderId ? result.order : o)
        );

        if (lastAction.quantityRestored && lastAction.restoreResult) {
          const order = lastAction.order;
          let productId;
          if (order.productId && typeof order.productId === 'object') {
            productId = order.productId._id;
          } else {
            productId = order.productId;
          }

          if (productId) {
            const getProd = await fetch(`${BASE_URL}/product/${productId}`);
            if (getProd.ok) {
              const productData = await getProd.json();
              const currentQty = Number(productData.quantity) || 0;
              const restoreQty = Number(order.quantity) || 0;
              const newQty = currentQty - restoreQty;

              await fetch(`${BASE_URL}/product/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity: newQty })
              });
            }
          }
        }

        setUndoStack([]);
        setShowUndoNotification(false);
        alert("Action undone successfully!");
      }
    } catch (err) {
      console.error("Error undoing action:", err);
      alert("Failed to undo action: " + err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      alert("Please select orders first");
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} ${selectedOrders.length} order(s)?`;
    if (!window.confirm(confirmMessage)) return;

    const results = [];
    for (const orderId of selectedOrders) {
      try {
        await handleOrderStatus(orderId, action);
        results.push({ orderId, success: true });
      } catch (err) {
        results.push({ orderId, success: false, error: err.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    alert(`Bulk action completed!\nSuccessful: ${successful}/${selectedOrders.length}`);
    
    setSelectedOrders([]);
    setShowBulkActions(false);
  };

  const exportSelectedOrders = () => {
    if (selectedOrders.length === 0) {
      alert("Please select orders to export");
      return;
    }

    const ordersToExport = sellerOrders.filter(o => selectedOrders.includes(o._id));
    
    let csv = `Order Export\nExported on: ${new Date().toLocaleString()}\n\n`;
    csv += `Order ID,Product,Quantity,Price,Status,Payment Status,Date\n`;
    
    ordersToExport.forEach(order => {
      const orderDate = new Date(order.createdAt).toLocaleDateString();
      csv += `${order._id},${order.item},${order.quantity},${order.price},${order.status},${order.paymentStatus || 'N/A'},${orderDate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `selected_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setSelectedOrders([]);
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    const allFilteredIds = getFilteredOrders().map(o => o._id);
    setSelectedOrders(allFilteredIds);
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getFilteredOrders = useCallback(() => {
    let filtered = [...sellerOrders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderNumber = (order.orderNumber || order._id).toLowerCase();
        const productName = (order.item || '').toLowerCase();
        const sellerInfo = getSellerInfo(order);
        const sellerName = sellerInfo.name.toLowerCase();
        
        return orderNumber.includes(term) || 
               productName.includes(term) || 
               sellerName.includes(term);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (statusFilter === 'pending') {
          return !order.status || order.status === 'pending';
        }
        return order.status === statusFilter;
      });
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(dateFrom);
      });
    }
    if (dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate <= new Date(dateTo);
      });
    }

    return filtered;
  }, [sellerOrders, searchTerm, statusFilter, paymentFilter, dateFrom, dateTo]);

  const filteredOrders = getFilteredOrders();
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const downloadCSV = (period) => {
    let csv = `Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}\n`;
    csv += `Generated on: ${new Date().toLocaleString()}\n\n`;
    csv += `Order ID,Product,Quantity,Price,Status,Date\n`;
    
    soldProducts.forEach(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt).toLocaleDateString();
      csv += `${order._id},${order.item},${order.quantity},${order.price},${order.status},${orderDate}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
    
    return { name: "Unknown Seller", place: "" };
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Undo Notification */}
      {showUndoNotification && undoStack.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fff',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          border: '2px solid #007bff'
        }}>
          <span>Action completed! You have 30 seconds to undo.</span>
          <button
            onClick={handleUndo}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: '600'
            }}
          >
            <FontAwesomeIcon icon={faUndo} /> Undo
          </button>
          <button
            onClick={() => {
              setUndoStack([]);
              setShowUndoNotification(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* Inventory Alerts */}
      {inventoryAlerts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 9999
        }}>
          <button
            onClick={() => setShowInventoryAlerts(!showInventoryAlerts)}
            style={{
              padding: '12px 20px',
              backgroundColor: inventoryAlerts.some(a => a.severity === 'high') ? '#dc3545' : '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          >
            <FontAwesomeIcon icon={faBell} />
            Inventory Alerts
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: 'white',
              color: '#dc3545',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '2px solid #dc3545'
            }}>
              {inventoryAlerts.length}
            </span>
          </button>

          {showInventoryAlerts && (
            <div style={{
              marginTop: '10px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              maxWidth: '400px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <div style={{
                padding: '15px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <strong>Inventory Alerts</strong>
                <button
                  onClick={() => setShowInventoryAlerts(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              {inventoryAlerts.map((alert, index) => (
                <div
                  key={index}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    backgroundColor: alert.severity === 'high' ? '#fff5f5' : '#fff9e6'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}>
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      style={{
                        color: alert.severity === 'high' ? '#dc3545' : '#ffc107',
                        marginTop: '2px'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: '600',
                        color: alert.severity === 'high' ? '#dc3545' : '#856404',
                        marginBottom: '5px'
                      }}>
                        {alert.type === 'out-of-stock' ? 'OUT OF STOCK' : 'LOW STOCK'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#333' }}>
                        {alert.message}
                      </div>
                      {alert.type === 'low-stock' && (
                        <button
                          style={{
                            marginTop: '10px',
                            padding: '6px 12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => alert(`Reorder suggestion for ${alert.product}: Order at least ${20 - alert.quantity} kg`)}
                        >
                          Reorder Suggestion
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
        <img
          src="https://www.abers-tourisme.com/assets/uploads/sites/8/2022/12/vente-legumes.jpg"
          alt="farmers"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '48px',
          color: 'white',
          textShadow: '2px 2px 6px rgba(0,0,0,0.6)',
          fontWeight: 'bold'
        }}>
          Welcome Farmers!
        </div>
      </div>

      {/* Government Schemes */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Government Schemes</h2>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
                {scheme.name}
              </p>
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
                  cursor: appliedSchemes.find((s) => s._id === scheme._id) ? 'not-allowed' : 'pointer'
                }}
              >
                {appliedSchemes.find((s) => s._id === scheme._id) ? '✓ Already Applied' : 'Apply Now'}
              </button>
            </div>
          )) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              No schemes available.
            </p>
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
                border: '2px solid #28a745',
                position: 'relative'
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
              <p style={{ fontSize: '18px', fontWeight: '600', paddingRight: '80px' }}>
                {scheme.name}
              </p>
            </div>
          )) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              You haven't applied for any schemes yet.
            </p>
          )}
        </div>
      )}

      {/* Sales History Button */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <button 
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
            gap: '10px'
          }}
        >
          <FontAwesomeIcon icon={faHistory} />
          {showHistory ? 'Hide History' : `View Sales History (${soldProducts.length})`}
        </button>
      </div>

      {/* Sales History */}
      {showHistory && soldProducts.length > 0 && (
        <div style={{
          margin: '20px auto',
          maxWidth: '1200px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2><FontAwesomeIcon icon={faHistory} /> Sales History</h2>
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              style={{
                padding: '8px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              <FontAwesomeIcon icon={faDownload} /> Download
            </button>
          </div>
          {soldProducts.slice(0, 10).map((order) => (
            <div key={order._id} style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '10px'
            }}>
              <strong>{order.item}</strong> - {order.quantity} kg - Rs.{order.price}
            </div>
          ))}
        </div>
      )}

      {/* Seller Orders Section */}
      <div style={{ textAlign: 'center', margin: '40px 0' }}>
        <h2 style={{ fontSize: '32px' }}>Seller Orders</h2>
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 20px',
        padding: '0 20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {/* Search Bar */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FontAwesomeIcon 
                icon={faSearch} 
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }}
              />
              <input
                type="text"
                placeholder="Search by order number, product name, or seller..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 45px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '12px 24px',
                backgroundColor: showFilters ? '#007bff' : 'white',
                color: showFilters ? 'white' : '#007bff',
                border: '2px solid #007bff',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600'
              }}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="disapproved">Disapproved</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Payment Status
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Summary and Bulk Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '15px',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Showing {currentOrders.length} of {filteredOrders.length} orders
              {filteredOrders.length !== sellerOrders.length && ` (filtered from ${sellerOrders.length} total)`}
            </div>

            {selectedOrders.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {selectedOrders.length} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Bulk Actions
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {selectedOrders.length === 0 && filteredOrders.length > 0 && (
              <button
                onClick={selectAllOrders}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#007bff',
                  border: '2px solid #007bff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Select All
              </button>
            )}
          </div>

          {/* Bulk Actions Menu */}
          {showBulkActions && selectedOrders.length > 0 && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#e7f3ff',
              borderRadius: '8px',
              border: '2px solid #007bff'
            }}>
              <div style={{ marginBottom: '10px', fontWeight: '600' }}>
                Bulk Actions for {selectedOrders.length} order(s):
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleBulkAction('approved')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsUp} /> Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('disapproved')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <FontAwesomeIcon icon={faThumbsDown} /> Disapprove All
                </button>
                <button
                  onClick={exportSelectedOrders}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  <FontAwesomeIcon icon={faFileExport} /> Export Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        {currentOrders.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <FontAwesomeIcon 
              icon={faSearch} 
              style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}
            />
            <p style={{ fontSize: '18px', color: '#666' }}>
              {sellerOrders.length === 0 
                ? 'No orders found.' 
                : 'No orders match your filters.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {currentOrders.map((order) => {
              const { name: sellerName, place: sellerPlace } = getSellerInfo(order);
              const isSelected = selectedOrders.includes(order._id);

              return (
                <div 
                  key={order._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,123,255,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                    border: isSelected ? '3px solid #007bff' : '1px solid #eee',
                    position: 'relative'
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleOrderSelection(order._id)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      cursor: 'pointer',
                      fontSize: '24px',
                      color: isSelected ? '#007bff' : '#ccc'
                    }}
                  >
                    <FontAwesomeIcon icon={isSelected ? faCheckSquare : faSquare} />
                  </div>

                  <img 
                    src={getImageUrl(order.productImage)} 
                    alt={order.item}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}
                  />

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{order.item}</h3>
                  
                  {order.orderNumber && (
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                      Order #: {order.orderNumber}
                    </p>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Quantity:</strong> {order.quantity} kg
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Price:</strong> Rs.{order.price}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Seller:</strong> {sellerName}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Status:</strong>{' '}
                      <span style={{ 
                        color: getStatusColor(order.status),
                        fontWeight: 'bold'
                      }}>
                        {order.status?.toUpperCase() || "PENDING"}
                      </span>
                    </p>
                  </div>

                  {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}

                  {order.status !== "approved" && order.status !== "disapproved" && (
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '15px'
                    }}>
                      <button 
                        onClick={() => handleOrderStatus(order._id, "approved")}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsUp}/> Approve
                      </button>
                      <button 
                        onClick={() => handleOrderStatus(order._id, "disapproved")}
                        style={{
                          flex: 1,
                          padding: '10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        <FontAwesomeIcon icon={faThumbsDown}/> Disapprove
                      </button>
                    </div>
                  )}

                  {order.status === "disapproved" && (
                    <div style={{
                      marginTop: '15px',
                      padding: '10px',
                      backgroundColor: '#f8d7da',
                      borderRadius: '6px',
                      textAlign: 'center',
                      color: '#721c24'
                    }}>
                      <p style={{ fontWeight: '600', margin: 0 }}>✗ Order Disapproved</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > ordersPerPage && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            marginTop: '30px',
            marginBottom: '40px'
          }}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '10px 20px',
                backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                color: currentPage === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: currentPage === pageNum ? '#007bff' : 'white',
                      color: currentPage === pageNum ? 'white' : '#007bff',
                      border: '2px solid #007bff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      minWidth: '45px'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 20px',
                backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
                color: currentPage === totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              Next <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FarmerPage;
