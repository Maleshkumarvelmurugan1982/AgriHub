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
  faSort,
  faRoute,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";

function RegDeliverymanPage() {
  const [deliverymanId, setDeliverymanId] = useState("DM001");
  const [availableSellerOrders, setAvailableSellerOrders] = useState([]);
  const [availableFarmerOrders, setAvailableFarmerOrders] = useState([]);
  const [mySellerOrders, setMySellerOrders] = useState([]);
  const [myFarmerOrders, setMyFarmerOrders] = useState([]);
  const [salary, setSalary] = useState(75000);
  const [showSalary, setShowSalary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Enhanced state
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

  // Mock data
  useEffect(() => {
    // Simulating available orders
    setAvailableSellerOrders([
      {
        _id: "1",
        item: "Fresh Tomatoes",
        quantity: 50,
        price: 15000,
        district: "Colombo",
        createdAt: new Date().toISOString(),
        productImage: "https://images.unsplash.com/photo-1546470427-227b4d021095",
        farmerId: { fname: "Kamal", lname: "Perera", mobile: "0771234567" },
        sellerId: { fname: "Sunil", lname: "Silva", mobile: "0779876543" }
      },
      {
        _id: "2",
        item: "Organic Carrots",
        quantity: 30,
        price: 9000,
        district: "Kandy",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        productImage: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37",
        farmerId: { fname: "Nimal", lname: "Fernando", mobile: "0772345678" },
        sellerId: { fname: "Ravi", lname: "Jayasinghe", mobile: "0778765432" }
      }
    ]);

    // Simulating accepted orders
    setMySellerOrders([
      {
        _id: "3",
        item: "Green Beans",
        quantity: 40,
        price: 12000,
        district: "Gampaha",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        productImage: "https://images.unsplash.com/photo-1556801712-76c8eb07bbc9",
        deliveryStatus: "in-transit",
        acceptedByDeliveryman: true,
        farmerId: { fname: "Lakshman", lname: "Wijesinghe", mobile: "0773456789" },
        sellerId: { fname: "Ajith", lname: "Rajapaksa", mobile: "0777654321" }
      },
      {
        _id: "4",
        item: "Fresh Potatoes",
        quantity: 100,
        price: 25000,
        district: "Matara",
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        productImage: "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
        deliveryStatus: "delivered",
        acceptedByDeliveryman: true,
        farmerId: { fname: "Chaminda", lname: "Bandara", mobile: "0774567890" },
        sellerId: { fname: "Prasanna", lname: "Mendis", mobile: "0776543210" }
      }
    ]);
  }, []);

  // Theme toggle function with persistence
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('deliveryDashboardTheme', newMode ? 'dark' : 'light');
    
    // Add smooth transition
    document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('deliveryDashboardTheme');
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    }
  }, []);

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

  const calculateDistance = (order) => {
    const districts = ["Colombo", "Gampaha", "Kandy", "Galle", "Matara", "Jaffna", "Kurunegala", "Anuradhapura", "Batticaloa"];
    const districtIndex = districts.indexOf(order.district || "Unknown");
    return districtIndex >= 0 ? (districtIndex + 1) * 15 : Math.floor(Math.random() * 100) + 10;
  };

  const getAllDistricts = () => {
    const allOrders = [...availableSellerOrders, ...availableFarmerOrders, ...mySellerOrders, ...myFarmerOrders];
    const districts = [...new Set(allOrders.map(order => order.district).filter(Boolean))];
    return districts.sort();
  };

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

  const paginateOrders = (orders) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
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

    const headers = ["Item Name", "Quantity (kg)", "Price (Rs.)", "From (Name)", "From (Contact)", "From (District)", "To (Name)", "To (Contact)", "To (District)", "Distance (km)", "Order Date", "Delivery Date", "Status"];
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
        order.quantity,
        order.price,
        `"${farmerName}"`,
        farmerContact,
        `"${order.district || 'N/A'}"`,
        `"${sellerName}"`,
        sellerContact,
        `"${order.district || 'N/A'}"`,
        calculateDistance(order),
        `"${formatDate(order.createdAt)}"`,
        `"${formatDate(order.updatedAt)}"`,
        "DELIVERED"
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

  const handleAcceptDelivery = (orderId, type) => {
    alert("✅ Order accepted successfully!");
    if (type === "seller") {
      const acceptedOrder = availableSellerOrders.find(o => o._id === orderId);
      if (acceptedOrder) {
        setMySellerOrders(prev => [...prev, { ...acceptedOrder, acceptedByDeliveryman: true, deliveryStatus: "in-transit" }]);
        setAvailableSellerOrders(prev => prev.filter(o => o._id !== orderId));
      }
    }
  };

  const handleDeliveryStatus = (orderId, type, status) => {
    if (type === "seller") {
      setMySellerOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, deliveryStatus: status, updatedAt: new Date().toISOString() } : order
        )
      );
    }
    alert(`✅ Order status updated to ${status} successfully!`);
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

  const OrderCard = ({ order, type, isAvailable }) => {
    const distance = calculateDistance(order);
    const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
    const farmerName = hasFarmerInfo ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() : 'Unknown';
    
    const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
    const sellerName = hasSellerInfo ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() : 'Unknown';
    
    return (
      <div style={{
        backgroundColor: darkMode ? '#2d3748' : 'white',
        border: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}>
        <div style={{ position: 'relative' }}>
          <img
            src={order.productImage}
            alt={order.item}
            style={{ width: '100%', height: '224px', objectFit: 'cover' }}
          />
          {!isAvailable && (
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <StatusBadge status={order.deliveryStatus} />
            </div>
          )}
        </div>
        
        <div style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            {order.item}
          </h3>
          
          {/* Route Display */}
          <div style={{
            backgroundColor: darkMode ? '#4a5568' : '#f8f9fa',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: `2px solid ${darkMode ? '#4a5568' : '#dee2e6'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#28a745' }} />
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{farmerName}</span>
              </div>
              <FontAwesomeIcon icon={faArrowRight} style={{ color: '#ff9800' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ fontWeight: '600', fontSize: '13px' }}>{sellerName}</span>
                <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#007bff' }} />
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e3f2fd', padding: '8px', borderRadius: '8px' }}>
              <FontAwesomeIcon icon={faBox} style={{ color: '#1976d2' }} />
              <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.quantity} kg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '8px' }}>
              <FontAwesomeIcon icon={faDollarSign} style={{ color: '#388e3c' }} />
              <span style={{ fontWeight: '500', fontSize: '14px' }}>Rs. {order.price.toLocaleString()}</span>
            </div>
            {order.district && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff3e0', padding: '8px', borderRadius: '8px' }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f57c00' }} />
                  <span style={{ fontWeight: '500', fontSize: '14px' }}>{order.district}</span>
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
            >
              <FontAwesomeIcon icon={faTruck} />
              Accept Delivery
            </button>
          ) : (
            <div>
              {(order.deliveryStatus === "in-transit" || order.deliveryStatus === "approved") && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleDeliveryStatus(order._id, type, "delivered")}
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
                      gap: '4px'
                    }}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Delivered
                  </button>
                  <button
                    onClick={() => handleDeliveryStatus(order._id, type, "not-delivered")}
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
                      gap: '4px'
                    }}
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
        </div>

        <div>
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
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
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
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="not-delivered">Not Delivered</option>
            </select>

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
                cursor: 'pointer'
              }}
            >
              <option value="all">All Districts</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

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
                cursor: 'pointer'
              }}
            >
              <option value="date-desc">📅 Date (Newest)</option>
              <option value="date-asc">📅 Date (Oldest)</option>
              <option value="price-desc">💰 Price (High to Low)</option>
              <option value="price-asc">💰 Price (Low to High)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === "grid" ? '#007bff' : darkMode ? '#4a5568' : '#e9ecef',
                  color: viewMode === "grid" ? 'white' : darkMode ? 'white' : 'black'
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
                  color: viewMode === "list" ? 'white' : darkMode ? 'white' : 'black'
                }}
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>
          </div>
        </div>
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
          <p style={{ fontSize: '20px', color: '#6c757d', fontWeight: '500' }}>No orders found</p>
        </div>
      );
    }

    return (
      <div style={viewMode === "grid" ? {
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
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: darkMode ? '#1a202c' : '#f8f9fa', 
      color: darkMode ? 'white' : 'black',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
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
              {/* Enhanced Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: darkMode ? '#4a5568' : '#f1f3f5',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  color: darkMode ? '#ffd700' : '#1a202c'
                }}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} style={{ fontSize: '20px' }} />
                <span style={{ fontSize: '14px' }}>{darkMode ? 'Light' : 'Dark'}</span>
              </button>
              
              <button
                onClick={() => setShowSalary(true)}
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
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                <FontAwesomeIcon icon={faMoneyBillWave} />
                Salary
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
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <FontAwesomeIcon icon={faHistory} />
                History
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
                fontSize: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Enhanced History Section with From/To Details */}
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
                <button
                  onClick={exportToCSV}
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
                    gap: '8px'
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} />
                  Export CSV
                </button>
                
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: darkMode ? '#4a5568' : '#f1f3f5'
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} style={{ fontSize: '20px' }} />
                </button>
              </div>
            </div>

            {getDeliveryHistory().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <FontAwesomeIcon icon={faBox} style={{ fontSize: '64px', color: '#6c757d', marginBottom: '16px' }} />
                <p style={{ fontSize: '20px', color: '#6c757d', fontWeight: '500' }}>No delivery history yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {getDeliveryHistory().map((order) => {
                  const hasFarmerInfo = order.farmerId && typeof order.farmerId === 'object';
                  const farmerName = hasFarmerInfo 
                    ? `${order.farmerId.fname || ''} ${order.farmerId.lname || ''}`.trim() || 'Unknown'
                    : 'Unknown';
                  const farmerContact = hasFarmerInfo && order.farmerId.mobile ? order.farmerId.mobile : 'N/A';

                  const hasSellerInfo = order.sellerId && typeof order.sellerId === 'object';
                  const sellerName = hasSellerInfo 
                    ? `${order.sellerId.fname || ''} ${order.sellerId.lname || ''}`.trim() || 'Unknown'
                    : 'Unknown';
                  const sellerContact = hasSellerInfo && order.sellerId.mobile ? order.sellerId.mobile : 'N/A';

                  const distance = calculateDistance(order);

                  return (
                    <div
                      key={order._id}
                      style={{
                        backgroundColor: darkMode ? '#4a5568' : '#f8f9fa',
                        borderRadius: '12px',
                        padding: '24px',
                        border: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', marginBottom: '20px' }}>
                        <img
                          src={order.productImage}
                          alt={order.item}
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{order.item}</h3>
                            <StatusBadge status="delivered" />
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e3f2fd', padding: '6px 10px', borderRadius: '6px' }}>
                              <FontAwesomeIcon icon={faBox} style={{ color: '#1976d2', fontSize: '14px' }} />
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{order.quantity} kg</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e8f5e9', padding: '6px 10px', borderRadius: '6px' }}>
                              <FontAwesomeIcon icon={faDollarSign} style={{ color: '#388e3c', fontSize: '14px' }} />
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>Rs. {order.price.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff3e0', padding: '6px 10px', borderRadius: '6px' }}>
                              <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#f57c00', fontSize: '14px' }} />
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{order.district}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f3e5f5', padding: '6px 10px', borderRadius: '6px' }}>
                              <FontAwesomeIcon icon={faRoute} style={{ color: '#7b1fa2', fontSize: '14px' }} />
                              <span style={{ fontSize: '13px', fontWeight: '500' }}>{distance} km</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced From/To Section */}
                      <div style={{
                        backgroundColor: darkMode ? '#2d3748' : 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        border: `2px solid ${darkMode ? '#4a5568' : '#e2e8f0'}`,
                        marginBottom: '16px'
                      }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#007bff'
                        }}>
                          <FontAwesomeIcon icon={faRoute} />
                          Delivery Route Details
                        </h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
                          {/* FROM Section */}
                          <div style={{
                            backgroundColor: darkMode ? '#4a5568' : '#f0f9ff',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '2px solid #28a745',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-12px',
                              left: '12px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              FROM (FARMER)
                            </div>
                            
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <FontAwesomeIcon icon={faUser} style={{ color: '#28a745', fontSize: '20px' }} />
                                <div>
                                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{farmerName}</p>
                                  <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>Farmer</p>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FontAwesomeIcon icon={faPhone} style={{ color: '#28a745' }} />
                                <span style={{ fontSize: '14px' }}>{farmerContact}</span>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#28a745' }} />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{order.district}</span>
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div style={{ textAlign: 'center' }}>
                            <FontAwesomeIcon 
                              icon={faTruck} 
                              style={{ 
                                fontSize: '32px', 
                                color: '#ff9800',
                                animation: 'slideRight 2s ease-in-out infinite'
                              }} 
                            />
                            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>{distance} km</p>
                          </div>

                          {/* TO Section */}
                          <div style={{
                            backgroundColor: darkMode ? '#4a5568' : '#f0f9ff',
                            padding: '16px',
                            borderRadius: '10px',
                            border: '2px solid #007bff',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-12px',
                              right: '12px',
                              backgroundColor: '#007bff',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              TO (SELLER)
                            </div>
                            
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <FontAwesomeIcon icon={faShoppingCart} style={{ color: '#007bff', fontSize: '20px' }} />
                                <div>
                                  <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{sellerName}</p>
                                  <p style={{ fontSize: '12px', color: '#6c757d', margin: 0 }}>Seller</p>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FontAwesomeIcon icon={faPhone} style={{ color: '#007bff' }} />
                                <span style={{ fontSize: '14px' }}>{sellerContact}</span>
                              </div>
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: '#007bff' }} />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>{order.district}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Dates */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ backgroundColor: darkMode ? '#2d3748' : '#fff', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}` }}>
                          <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>ORDER DATE</p>
                          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FontAwesomeIcon icon={faCalendar} style={{ color: '#007bff' }} />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        
                        <div style={{ backgroundColor: darkMode ? '#2d3748' : '#fff', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}` }}>
                          <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px', fontWeight: '600' }}>DELIVERED DATE</p>
                          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ color: '#28a745' }} />
                            {formatDate(order.updatedAt)}
                          </p>
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
        {/* Available Orders */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={faBox} style={{ color: '#ff9800', fontSize: '40px' }} />
            Available Orders
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

        {/* My Accepted Orders */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FontAwesomeIcon icon={faTruck} style={{ color: '#007bff', fontSize: '40px' }} />
            My Accepted Orders
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
      </div>

      <style>{`
        @keyframes slideRight {
          0%, 100% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
        }
        
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default RegDeliverymanPage;
