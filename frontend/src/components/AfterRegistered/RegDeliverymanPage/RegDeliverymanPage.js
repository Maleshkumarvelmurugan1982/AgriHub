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
  faDownload,
  faSearch,
  faFilter,
  faChevronDown,
  faChevronUp,
  faMoon,
  faSun,
  faBox,
  faClock,
  faMapMarkerAlt,
  faPhone,
  faCalendar,
  faDollarSign,
  faFileAlt,
  faThLarge,
  faList,
  faChevronLeft,
  faChevronRight as faChevronRightAlt,
  faEye,
  faSort
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
  
  // New state for enhanced features
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const BASE_URL = "https://agrihub-2.onrender.com";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150?text=No+Image';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
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

  // Calculate distance between two points (simplified version)
  const calculateDistance = (order) => {
    const districts = ["Colombo", "Gampaha", "Kandy", "Galle", "Matara", "Jaffna", "Kurunegala", "Anuradhapura", "Batticaloa"];
    const districtIndex = districts.indexOf(order.district || "Unknown");
    return districtIndex >= 0 ? (districtIndex + 1) * 15 : Math.floor(Math.random() * 100) + 10;
  };

  // Get all unique districts from orders
  const getAllDistricts = () => {
    const allOrders = [...availableSellerOrders, ...availableFarmerOrders, ...mySellerOrders, ...myFarmerOrders];
    const districts = [...new Set(allOrders.map(order => order.district).filter(Boolean))];
    return districts.sort();
  };

  // Filter and sort orders
  const filterAndSortOrders = (orders) => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.district?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(order => order.deliveryStatus === filterStatus);
    }

    if (filterDistrict !== "all") {
      filtered = filtered.filter(order => order.district === filterDistrict);
    }

    filtered.sort((a, b) => {
      switch(sortBy) {
        case "date-desc":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-asc":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "quantity-desc":
          return (b.quantity || 0) - (a.quantity || 0);
        case "quantity-asc":
          return (a.quantity || 0) - (b.quantity || 0);
        case "district":
          return (a.district || "").localeCompare(b.district || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Pagination logic
  const paginateOrders = (orders) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  };

  const fetchAndDisplaySalary = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please log in again.");
        return;
      }

      const res = await fetch(`${BASE_URL}/deliveryman/userdata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (data.status === "ok" && data.data) {
        setSalary(data.data.salary ?? 0);
        setShowSalary(true);
      } else {
        alert("Failed to fetch salary data");
      }
    } catch (err) {
      console.error("Error fetching salary:", err);
      alert(`Failed to fetch salary: ${err.message}`);
    }
  };

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

  const exportToCSV = () => {
    const history = getDeliveryHistory();
    if (history.length === 0) {
      alert("No delivery history to export");
      return;
    }

    const headers = ["Item Name", "Quantity", "Price (Rs.)", "Order Date", "Delivery Date", "From (Farmer)", "Farmer Contact", "To (Seller)", "Seller Contact", "District", "Distance (km)", "Status", "Current Salary (Rs.)"];
    const csvRows = [headers.join(",")];

    history.forEach(order => {
      const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
      const farmerName = hasFarmerInfo ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() : 'Unknown';
      const farmerContact = hasFarmerInfo && order.farmerId.mobile ? order.farmerId.mobile : 'N/A';

      const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
      const sellerName = hasSellerInfo ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() : 'Unknown';
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
        calculateDistance(order),
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

  useEffect(() => {
    const fetchDeliverymanData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BASE_URL}/deliveryman/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok" && data.data) {
          setDeliverymanId(data.data._id);
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
        setAvailableSellerOrders(Array.isArray(availableSellerResponse.data) ? availableSellerResponse.data : []);

        try {
          const availableFarmerResponse = await axios.get(`${BASE_URL}/farmerorder/deliveryman/available`);
          setAvailableFarmerOrders(Array.isArray(availableFarmerResponse.data) ? availableFarmerResponse.data : []);
        } catch (err) {
          setAvailableFarmerOrders([]);
        }

        const mySellerResponse = await axios.get(`${BASE_URL}/sellerorder/deliveryman/${deliverymanId}`);
        setMySellerOrders(Array.isArray(mySellerResponse.data) ? mySellerResponse.data : []);

        try {
          const myFarmerResponse = await axios.get(`${BASE_URL}/farmerorder/deliveryman/${deliverymanId}`);
          setMyFarmerOrders(Array.isArray(myFarmerResponse.data) ? myFarmerResponse.data : []);
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
        console.error("Error fetching data:", err);
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
        await axios.put(`${BASE_URL}/sellerorder/${orderId}/accept`, { deliverymanId });
        const acceptedOrder = availableSellerOrders.find(o => o._id === orderId);
        if (acceptedOrder) {
          setMySellerOrders(prev => [...prev, { ...acceptedOrder, acceptedByDeliveryman: true, deliveryStatus: "in-transit" }]);
          setAvailableSellerOrders(prev => prev.filter(o => o._id !== orderId));
        }
      } else {
        await axios.put(`${BASE_URL}/farmerorder/${orderId}/accept`, { deliverymanId });
        const acceptedOrder = availableFarmerOrders.find(o => o._id === orderId);
        if (acceptedOrder) {
          setMyFarmerOrders(prev => [...prev, { ...acceptedOrder, acceptedByDeliveryman: true, deliveryStatus: "in-transit" }]);
          setAvailableFarmerOrders(prev => prev.filter(o => o._id !== orderId));
        }
      }
      
      alert("✅ Order accepted successfully!");
      
    } catch (err) {
      console.error("Error accepting delivery:", err);
      alert(`Failed to accept order: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDeliveryStatus = async (orderId, type, status) => {
    try {
      const url = type === "seller" 
        ? `${BASE_URL}/sellerorder/${orderId}/status`
        : `${BASE_URL}/farmerorder/${orderId}/status`;
      
      await axios.put(url, { status });

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
      console.error("Error updating delivery status:", err);
      alert(`Failed to update: ${err.response?.data?.message || err.message}`);
    }
  };

  const StatusBadge = ({ status }) => {
    const configs = {
      delivered: { icon: faCheckCircle, color: "#28a745", text: "Delivered" },
      "not-delivered": { icon: faTimesCircle, color: "#dc3545", text: "Not Delivered" },
      "in-transit": { icon: faTruck, color: "#007bff", text: "In Transit" },
      approved: { icon: faCheckCircle, color: "#6f42c1", text: "Approved" }
    };

    const config = configs[status] || configs["in-transit"];

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        color: 'white',
        backgroundColor: config.color,
        fontSize: '14px',
        fontWeight: '600'
      }}>
        <FontAwesomeIcon icon={config.icon} />
        {config.text}
      </span>
    );
  };

  const OrderTimeline = ({ order }) => {
    const timelineSteps = [
      { label: "Order Placed", date: order.createdAt, status: "completed" },
      { label: "Accepted by Deliveryman", date: order.acceptedByDeliveryman ? order.updatedAt : null, status: order.acceptedByDeliveryman ? "completed" : "pending" },
      { label: "In Transit", date: order.deliveryStatus === "in-transit" ? order.updatedAt : null, status: order.deliveryStatus === "in-transit" ? "active" : order.deliveryStatus === "delivered" ? "completed" : "pending" },
      { label: "Delivered", date: order.deliveryStatus === "delivered" ? order.updatedAt : null, status: order.deliveryStatus === "delivered" ? "completed" : "pending" }
    ];

    return (
      <div style={{
        backgroundColor: darkMode ? '#2d3748' : 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FontAwesomeIcon icon={faClock} />
          Order Timeline - {order.item}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {timelineSteps.map((step, index) => (
            <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: step.status === "completed" ? "#28a745" : step.status === "active" ? "#007bff" : "#6c757d",
                  color: 'white'
                }}>
                  <FontAwesomeIcon icon={step.status === "completed" ? faCheckCircle : faClock} />
                </div>
                {index < timelineSteps.length - 1 && (
                  <div style={{
                    width: '2px',
                    height: '64px',
                    backgroundColor: step.status === "completed" ? "#28a745" : "#6c757d"
                  }} />
                )}
              </div>
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <p style={{ fontWeight: '600', fontSize: '18px', color: step.status === "active" ? "#007bff" : "" }}>
                  {step.label}
                </p>
                {step.date && (
                  <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>{formatDate(step.date)}</p>
                )}
                {!step.date && step.status === "pending" && (
                  <p style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>Pending</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const OrderCard = ({ order, type, isAvailable }) => {
    const distance = calculateDistance(order);
    
    return (
      <div className="order-card" style={{
        backgroundColor: darkMode ? '#2d3748' : 'white',
        border: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}>
        <div style={{ position: 'relative' }}>
          <img
            src={getImageUrl(order.productImage)}
            alt={order.item}
            style={{ width: '100%', height: '224px', objectFit: 'cover' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
          {!isAvailable && (
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <StatusBadge status={order.deliveryStatus} />
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {order.item}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '8px' }}>
              <FontAwesomeIcon icon={faBox} style={{ color: '#1976d2' }} />
              <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.quantity} kg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '8px' }}>
              <FontAwesomeIcon icon={faDollarSign} style={{ color: '#388e3c' }} />
              <span style={{ fontWeight: '500', fontSize: '14px' }}>Rs. {order.price}</span>
            </div>
            {order.district && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff3e0', padding: '8px', borderRadius: '8px' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f57c00' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.district}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3e5f5', padding: '8px', borderRadius: '8px' }}>
                  <FontAwesomeIcon icon={faTruck} style={{ color: '#7b1fa2' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>~{distance} km</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6c757d', backgroundColor: darkMode ? '#4a5568' : '#f8f9fa', padding: '8px', borderRadius: '8px', marginBottom: '16px' }}>
            <FontAwesomeIcon icon={faCalendar} />
            <span>{formatDate(order.createdAt)}</span>
          </div>

          {isAvailable ? (
            <button
              onClick={() => handleAcceptDelivery(order._id, type)}
              className="cart-button"
              style={{
                width: '100%',
                backgroundColor: '#28a745',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
            >
              <FontAwesomeIcon icon={faTruck} />
              Accept Delivery
            </button>
          ) : (
            <div>
              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowTimeline(true);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
              >
                <FontAwesomeIcon icon={faEye} />
                View Timeline
              </button>
              
              {(order.deliveryStatus === "in-transit" || order.deliveryStatus === "approved") && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleDeliveryStatus(order._id, type, "delivered")}
                    className="delivered-button"
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Delivered
                  </button>
                  <button
                    onClick={() => handleDeliveryStatus(order._id, type, "not-delivered")}
                    className="not-delivered-button"
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} />
                    Not Delivered
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const FilterBar = () => {
    const districts = getAllDistricts();
    
    return (
      <div style={{
        backgroundColor: darkMode ? '#2d3748' : 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FontAwesomeIcon icon={faFilter} />
            Filters & Search
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg-hidden"
            style={{
              background: 'none',
              border: 'none',
              color: '#007bff',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
          </button>
        </div>

        <div style={{ display: showFilters || window.innerWidth >= 1024 ? 'block' : 'none' }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <FontAwesomeIcon 
              icon={faSearch} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d'
              }}
            />
            <input
              type="text"
              placeholder="Search by item name or district..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: `2px solid ${darkMode ? '#4a5568' : '#dee2e6'}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: darkMode ? '#4a5568' : 'white',
                color: darkMode ? 'white' : 'black',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = darkMode ? '#4a5568' : '#dee2e6'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '12px 16px',
                border: `2px solid ${darkMode ? '#4a5568' : '#dee2e6'}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: darkMode ? '#4a5568' : 'white',
                color: darkMode ? 'white' : 'black',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Status</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="not-delivered">Not Delivered</option>
              <option value="approved">Approved</option>
            </select>

            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '12px 16px',
                border: `2px solid ${darkMode ? '#4a5568' : '#dee2e6'}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: darkMode ? '#4a5568' : 'white',
                color: darkMode ? 'white' : 'black',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '12px 16px',
                border: `2px solid ${darkMode ? '#4a5568' : '#dee2e6'}`,
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: darkMode ? '#4a5568' : 'white',
                color: darkMode ? 'white' : 'black',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="date-desc">📅 Date (Newest First)</option>
              <option value="date-asc">📅 Date (Oldest First)</option>
              <option value="price-desc">💰 Price (High to Low)</option>
              <option value="price-asc">💰 Price (Low to High)</option>
              <option value="quantity-desc">📦 Quantity (High to Low)</option>
              <option value="quantity-asc">📦 Quantity (Low to High)</option>
              <option value="district">📍 District (A-Z)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>View:</span>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === "grid" ? '#007bff' : darkMode ? '#4a5568' : '#e9ecef',
                  color: viewMode === "grid" ? 'white' : darkMode ? 'white' : 'black',
                  transition: 'all 0.3s ease'
                }}
              >
                <FontAwesomeIcon icon={faThLarge} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === "list" ? '#007bff' : darkMode ? '#4a5568' : '#e9ecef',
                  color: viewMode === "list" ? 'white' : darkMode ? 'white' : 'black',
                  transition: 'all 0.3s ease'
                }}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterDistrict("all");
                setSortBy("date-desc");
                setCurrentPage(1);
              }}
              style={{
                color: '#dc3545',
                fontSize: '14px',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Pagination = ({ totalItems, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pageNumbers.push(i);
      } else if (pageNumbers[pageNumbers.length - 1] !== '...') {
        pageNumbers.push('...');
      }
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
            color: currentPage === 1 ? '#6c757d' : 'white',
            opacity: currentPage === 1 ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        {pageNumbers.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} style={{ padding: '8px 12px' }}>...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                backgroundColor: currentPage === page ? '#007bff' : darkMode ? '#4a5568' : '#e9ecef',
                color: currentPage === page ? 'white' : darkMode ? 'white' : 'black',
                transition: 'all 0.3s ease'
              }}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
            color: currentPage === totalPages ? '#6c757d' : 'white',
            opacity: currentPage === totalPages ? 0.5 : 1,
            transition: 'all 0.3s ease'
          }}
        >
          <FontAwesomeIcon icon={faChevronRightAlt} />
        </button>
        
        <span style={{ marginLeft: '16px', fontSize: '14px', color: '#6c757d' }}>
          Page {currentPage} of {totalPages} ({totalItems} items)
        </span>
      </div>
    );
  };

  const renderOrders = (orders, type, isAvailable) => {
    const filtered = filterAndSortOrders(orders);
    const paginated = paginateOrders(filtered);

    if (filtered.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <FontAwesomeIcon icon={faBox} style={{ fontSize: '64px', color: '#6c757d', marginBottom: '16px' }} />
          <p style={{ fontSize: '20px', color: '#6c757d', fontWeight: '500', marginBottom: '8px' }}>No orders found</p>
          <p style={{ fontSize: '14px', color: '#adb5bd' }}>Try adjusting your filters</p>
        </div>
      );
    }

    return (
      <>
        <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6c757d' }}>
          Showing {paginated.length} of {filtered.length} orders
        </div>
        
        <div className={viewMode === "grid" ? "orders-container" : ""} style={viewMode === "grid" ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        } : {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {paginated.map(order => (
            <OrderCard key={order._id} order={order} type={type} isAvailable={isAvailable} />
          ))}
        </div>
        
        <Pagination 
          totalItems={filtered.length}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </>
    );
  };

  if (loading) {
    return (
      <div>
        <NavbarRegistered />
        <div style={{
          minHeight: '100vh',
          backgroundColor: darkMode ? '#1a202c' : '#f8f9fa',
          color: darkMode ? 'white' : 'black',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid #e9ecef',
              borderTopColor: '#007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ fontSize: '20px', fontWeight: '600' }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#1a202c' : '#f8f9fa', color: darkMode ? 'white' : 'black' }}>
      <NavbarRegistered />
      
      {/* Header */}
      <div style={{
        backgroundColor: darkMode ? '#2d3748' : 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: '#ff9800', fontSize: '36px' }} />
              <span>Delivery Dashboard</span>
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: darkMode ? '#4a5568' : '#f1f3f5',
                  transition: 'all 0.3s ease'
                }}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} style={{ fontSize: '20px' }} />
              </button>
              
              <button
                onClick={fetchAndDisplaySalary}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} />
                <span className="hidden-mobile">View Salary</span>
              </button>
              
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <FontAwesomeIcon icon={faHistory} />
                <span className="hidden-mobile">History</span>
                <span style={{
                  backgroundColor: 'white',
                  color: '#ff9800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {getDeliveryHistory().length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Banner */}
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

      {/* Salary Modal */}
      {showSalary && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '448px',
            width: '100%',
            boxShadow: '0 20px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={faMoneyBillWave} style={{ color: '#28a745', fontSize: '32px' }} />
              Your Salary Details
            </h2>
            <div style={{
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              padding: '32px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 16px rgba(40,167,69,0.3)'
            }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Government Provided Salary
              </p>
              <p style={{ fontSize: '48px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Rs. {salary.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowSalary(false)}
              style={{
                width: '100%',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {showTimeline && selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{ maxWidth: '768px', width: '100%', margin: '32px 0' }}>
            <OrderTimeline order={selectedOrder} />
            <button
              onClick={() => {
                setShowTimeline(false);
                setSelectedOrder(null);
              }}
              style={{
                width: '100%',
                marginTop: '16px',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              Close Timeline
            </button>
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : 'white',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                <FontAwesomeIcon icon={faHistory} style={{ color: '#ff9800', fontSize: '32px' }} />
                Delivery History
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Export
                  </button>
                  
                  {showExportMenu && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '8px',
                      width: '224px',
                      backgroundColor: darkMode ? '#4a5568' : 'white',
                      borderRadius: '8px',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                      border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                      overflow: 'hidden',
                      zIndex: 10
                    }}>
                      <button
                        onClick={exportToCSV}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          color: darkMode ? 'white' : 'black'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? '#4a5568' : '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <FontAwesomeIcon icon={faFileCsv} style={{ color: '#28a745', fontSize: '20px' }} />
                        <span style={{ fontWeight: '500' }}>Export as CSV</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: darkMode ? '#4a5568' : '#f1f3f5',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = darkMode ? '#4a5568' : '#e9ecef'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = darkMode ? '#4a5568' : '#f1f3f5'}
                >
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: '20px' }} />
                </button>
              </div>
            </div>

            {/* Salary Display in History */}
            <div style={{
              background: 'linear-gradient(135deg, #ffc107, #ff9800)',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(255,193,7,0.3)'
            }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#744210', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: 0, marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faMoneyBillWave} />
                Current Salary: Rs. {salary.toLocaleString()}
              </h3>
              <p style={{ fontSize: '14px', color: '#856404', margin: 0, fontWeight: '500' }}>Provided by Government of Sri Lanka</p>
            </div>

            {getDeliveryHistory().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <FontAwesomeIcon icon={faBox} style={{ fontSize: '64px', color: '#6c757d', marginBottom: '16px' }} />
                <p style={{ fontSize: '20px', color: '#6c757d', fontWeight: '500', marginBottom: '8px' }}>No delivery history yet</p>
                <p style={{ fontSize: '14px', color: '#adb5bd' }}>Your completed deliveries will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {getDeliveryHistory().map((order) => {
                  const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
                  const farmerName = hasFarmerInfo 
                    ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown'
                    : 'Unknown';

                  const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
                  const sellerName = hasSellerInfo 
                    ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() || 'Unknown'
                    : 'Unknown';

                  const distance = calculateDistance(order);

                  return (
                    <div
                      key={order._id}
                      style={{
                        backgroundColor: darkMode ? '#4a5568' : '#f8f9fa',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '20px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <img
                        src={getImageUrl(order.productImage)}
                        alt={order.item}
                        style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{order.item}</h3>
                          <StatusBadge status="delivered" />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '6px' }}>
                            <FontAwesomeIcon icon={faBox} style={{ color: '#1976d2' }} />
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.quantity} kg</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '6px' }}>
                            <FontAwesomeIcon icon={faDollarSign} style={{ color: '#388e3c' }} />
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>Rs. {order.price}</span>
                          </div>
                          {order.district && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff3e0', padding: '8px', borderRadius: '6px' }}>
                              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f57c00' }} />
                              <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.district}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f3e5f5', padding: '8px', borderRadius: '6px' }}>
                            <FontAwesomeIcon icon={faTruck} style={{ color: '#7b1fa2' }} />
                            <span style={{ fontWeight: '500', fontSize: '14px' }}>~{distance} km</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6c757d', backgroundColor: darkMode ? '#4a5568' : '#e9ecef', padding: '8px', borderRadius: '6px' }}>
                          <FontAwesomeIcon icon={faCalendar} />
                          <span>Delivered on: {formatDate(order.updatedAt)}</span>
                        </div>

                        <div style={{
                          backgroundColor: darkMode ? '#4a5568' : '#e3f2fd',
                          padding: '16px',
                          borderRadius: '8px',
                          borderLeft: '4px solid #007bff'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>From</p>
                              <p style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                <FontAwesomeIcon icon={faUser} style={{ color: '#007bff' }} />
                                {farmerName}
                              </p>
                              {hasFarmerInfo && order.farmerId.mobile && (
                                <p style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: '#6c757d' }}>
                                  <FontAwesomeIcon icon={faPhone} />
                                  {order.farmerId.mobile}
                                </p>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FontAwesomeIcon icon={faTruck} style={{ fontSize: '28px', color: '#ff9800' }} />
                            </div>
                            
                            <div style={{ flex: 1, minWidth: '200px', textAlign: 'right' }}>
                              <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>To</p>
                              <p style={{ fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', margin: 0 }}>
                                {sellerName}
                                <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#007bff' }} />
                              </p>
                              {hasSellerInfo && order.sellerId.mobile && (
                                <p style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', color: '#6c757d' }}>
                                  {order.sellerId.mobile}
                                  <FontAwesomeIcon icon={faPhone} />
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
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Available Seller Orders */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={faBox} style={{ color: '#ff9800', fontSize: '40px' }} />
            Available Seller Orders
          </h2>
          
          <FilterBar />
          
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '24px'
          }}>
            {renderOrders(availableSellerOrders, "seller", true)}
          </div>
        </section>

        {/* My Accepted Seller Orders */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={faTruck} style={{ color: '#007bff', fontSize: '40px' }} />
            My Accepted Seller Orders
          </h2>
          
          <FilterBar />
          
          <div style={{
            backgroundColor: darkMode ? '#2d3748' : 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '24px'
          }}>
            {renderOrders(mySellerOrders, "seller", false)}
          </div>
        </section>

        {/* Available Farmer Orders */}
        {availableFarmerOrders.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={faBox} style={{ color: '#28a745', fontSize: '40px' }} />
              Available Farmer Orders
            </h2>
            
            <FilterBar />
            
            <div style={{
              backgroundColor: darkMode ? '#2d3748' : 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '24px'
            }}>
              {renderOrders(availableFarmerOrders, "farmer", true)}
            </div>
          </section>
        )}

        {/* My Accepted Farmer Orders */}
        {myFarmerOrders.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FontAwesomeIcon icon={faTruck} style={{ color: '#6f42c1', fontSize: '40px' }} />
              My Accepted Farmer Orders
            </h2>
            
            <FilterBar />
            
            <div style={{
              backgroundColor: darkMode ? '#2d3748' : 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              padding: '24px'
            }}>
              {renderOrders(myFarmerOrders, "farmer", false)}
            </div>
          </section>
        )}
      </div>

      <FooterNew />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
          .lg-hidden {
            display: block !important;
          }
        }
        
        @media (min-width: 1024px) {
          .lg-hidden {
            display: none !important;
          }
        }
        
        .order-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }
      `}</style>
    </div>
  );
}

export default RegDeliverymanPage;
