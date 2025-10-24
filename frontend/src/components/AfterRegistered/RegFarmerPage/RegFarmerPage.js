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
  faTimesCircle 
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
    const fetchSellerOrders = async () => {
      try {
        const response = await fetch(`${BASE_URL}/sellerorder/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Seller Orders Response:", data);
        
        if (Array.isArray(data)) {
          setSellerOrders(data);
        } else if (data.data && Array.isArray(data.data)) {
          setSellerOrders(data.data);
        } else if (data.message) {
          console.error("Backend error:", data.message);
          setSellerOrders([]);
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
        setFarmerOrders(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
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
  }, []);

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
      const res = await fetch(`${BASE_URL}/sellerorder/update/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      
      const updatedOrder = await res.json();
      setSellerOrders(prev =>
        prev.map(o => o._id === orderId ? updatedOrder.order : o)
      );
      alert(`Order ${newStatus} successfully!`);
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Error updating order");
    }
  };

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
    }
    return null;
  };

  const sellerOrdersToDisplay = showAllSellerOrders ? sellerOrders : sellerOrders.slice(0, 4);
  const farmerOrdersToDisplay = showAllFarmerOrders ? farmerOrders : farmerOrders.slice(0, 4);
  const deliveryPostsToDisplay = showAllDeliveryPosts ? deliveryPosts : deliveryPosts.slice(0, 4);

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

      {/* Schemes */}
      <div className="topic">
        <p>Government Schemes</p>
        <div className="scheme-buttons-container">
          <button onClick={() => { setShowSchemes(!showSchemes); setShowAppliedSchemes(false); }}>
            View Schemes
          </button>
          <button onClick={() => { setShowAppliedSchemes(!showAppliedSchemes); setShowSchemes(false); }}>
            Applied Schemes
          </button>
        </div>
      </div>
      
      {showSchemes && (
        <div className="schemes-wrapper">
          {schemes.length > 0 ? schemes.map((scheme) => (
            <div key={scheme._id} className="scheme-item">
              <p>{scheme.name}</p>
              <button onClick={() => handleApplyScheme(scheme)}>Apply</button>
            </div>
          )) : <p>No schemes available.</p>}
        </div>
      )}
      
      {showAppliedSchemes && (
        <div className="schemes-wrapper">
          {appliedSchemes.length > 0 ? appliedSchemes.map((scheme) => (
            <div key={scheme._id} className="scheme-item">
              <p>{scheme.name}</p>
            </div>
          )) : <p>You haven't applied for any schemes yet.</p>}
        </div>
      )}

      {/* Seller Orders */}
      <div className="topic">
        <p>Seller Orders</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrdersToDisplay.map((order) => {
            // Safe check for deliveryman data
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
                <p>Quantity: {order.quantity}</p>
                <p>Price: Rs.{order.price}</p>
                <p>
                  Status: <b style={{color: getStatusColor(order.status)}}>
                    {order.status?.toUpperCase() || "PENDING"}
                  </b>
                </p>
                
                {/* Delivery info - only show if deliveryman accepted AND order is approved */}
                {order.acceptedByDeliveryman && order.status === "approved" && (
                  <div className="delivery-info">
                    <p className="deliveryman-info">
                      <FontAwesomeIcon icon={faTruck} /> 
                      Deliveryman: <strong>{deliverymanName}</strong>
                    </p>
                    
                    {/* Display Deliveryman ID */}
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
                    
                    {/* Delivery status badge */}
                    {getDeliveryStatusBadge(order.deliveryStatus)}
                  </div>
                )}
                
                {/* Action buttons - show based on order status */}
                {order.status !== "approved" && order.status !== "disapproved" && !order.acceptedByDeliveryman && (
                  <div className="order-buttons">
                    <button 
                      onClick={() => handleOrderStatus(order._id, "approved")}
                    >
                      <FontAwesomeIcon icon={faThumbsUp}/> Approve
                    </button>
                    <button 
                      onClick={() => handleOrderStatus(order._id, "disapproved")}
                    >
                      <FontAwesomeIcon icon={faThumbsDown}/> Disapprove
                    </button>
                  </div>
                )}
                
                {/* Show action buttons for orders accepted by deliveryman but not yet farmer-approved */}
                {order.acceptedByDeliveryman && order.status !== "approved" && order.status !== "disapproved" && (
                  <div className="order-buttons">
                    <button 
                      onClick={() => handleOrderStatus(order._id, "approved")}
                    >
                      <FontAwesomeIcon icon={faThumbsUp}/> Approve
                    </button>
                    <button 
                      onClick={() => handleOrderStatus(order._id, "disapproved")}
                    >
                      <FontAwesomeIcon icon={faThumbsDown}/> Disapprove
                    </button>
                  </div>
                )}
                
                {/* Show success message only if approved */}
                {order.status === "approved" && order.acceptedByDeliveryman && (
                  <div className="order-status-message">
                    <p>✓ Order accepted by deliveryman</p>
                  </div>
                )}
                
                {/* Show disapproved message */}
                {order.status === "disapproved" && (
                  <div className="order-status-message-disapproved">
                    <p>✗ Order Disapproved</p>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Farmer Orders */}
      <div className="topic">
        <p>Farmer Orders</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {farmerOrdersToDisplay.map((order) => (
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
              <p>Quantity: {order.quantity}</p>
              <p>Price: Rs.{order.price}</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart}/> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faShoppingBag}/> Buy Now
              </button>
            </div>
          ))}
        </div>
        {farmerOrders.length > 4 && (
          <button 
            className="view-all-button1" 
            onClick={() => setShowAllFarmerOrders(prev => !prev)}
          >
            {showAllFarmerOrders ? "Show Less" : `View All (${farmerOrders.length})`} 
            <FontAwesomeIcon icon={faChevronRight}/>
          </button>
        )}
      </div>

      {/* Delivery Services */}
      <div className="topic">
        <p>Delivery Services</p>
      </div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {deliveryPostsToDisplay.map((order) => (
            <div key={order._id} className="order-item1">
              <img 
                src={getImageUrl(order.vehicleImage)} 
                alt={order.model} 
                className="order-image" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }} 
              />
              <p><strong>{order.model}</strong></p>
              <p>Capacity: {order.capacity} kg</p>
              <p>Price: Rs.{order.price}/km</p>
              <button className="cart-button">
                <FontAwesomeIcon icon={faShoppingCart}/> Add to Cart
              </button>
              <button className="supply-button">
                <FontAwesomeIcon icon={faInfoCircle}/> More Details
              </button>
            </div>
          ))}
        </div>
        {deliveryPosts.length > 4 && (
          <button 
            className="view-all-button1" 
            onClick={() => setShowAllDeliveryPosts(prev => !prev)}
          >
            {showAllDeliveryPosts ? "Show Less" : `View All (${deliveryPosts.length})`} 
            <FontAwesomeIcon icon={faChevronRight}/>
          </button>
        )}
      </div>

      <FooterNew />
    </div>
  );
}

export default FarmerPage;