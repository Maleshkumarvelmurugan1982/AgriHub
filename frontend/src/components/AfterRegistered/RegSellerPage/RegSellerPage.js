import React, { useState, useEffect, useRef } from "react";
import "./RegSellerPage.css";
import NavbarRegistered from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import RegCategories from "../RegCatoegories/RegCategories";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import TypeWriter from "../../AutoWritingText/TypeWriter";
import axios from "axios";

function RegSellerPage() {
  const [sellerOrders, setSellerOrders] = useState([]);
  const [deliveryPosts, setDeliveryPosts] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [showAllSellerOrders, setShowAllSellerOrders] = useState(false);
  const [showAllDeliveryPosts, setShowAllDeliveryPosts] = useState(false);
  const notifiedOrdersRef = useRef(new Set());

  const BACKEND_URL = "http://localhost:8070";
  const fallbackProductImage = "https://via.placeholder.com/300x200?text=Product+Image";
  const fallbackVehicleImage = "https://via.placeholder.com/300x200?text=Vehicle+Image";

  const styles = {
    toastContainer: { position: 'fixed', top: '80px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' },
    toast: { display: 'flex', alignItems: 'center', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: '#fff', animation: 'slideIn 0.3s ease-out', minWidth: '300px', maxWidth: '400px' },
    toastSuccess: { borderLeft: '4px solid #4caf50' },
    toastError: { borderLeft: '4px solid #f44336' },
    toastIcon: { fontSize: '24px', marginRight: '15px', display: 'flex', alignItems: 'center' },
    toastIconSuccess: { color: '#4caf50' },
    toastIconError: { color: '#f44336' },
    toastMessage: { flex: 1, fontSize: '14px', color: '#333', lineHeight: '1.5' },
    toastClose: { background: 'none', border: 'none', fontSize: '24px', color: '#999', cursor: 'pointer', padding: 0, marginLeft: '10px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' },
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `${BACKEND_URL}${imagePath}`;
    if (imagePath.startsWith('uploads/')) return `${BACKEND_URL}/${imagePath}`;
    return `${BACKEND_URL}/uploads/${imagePath}`;
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `@keyframes slideIn { from { transform: translateX(400px); opacity:0; } to { transform: translateX(0); opacity:1; } }`;
    document.head.appendChild(styleSheet);

    const fetchData = async () => {
      try {
        const sellerRes = await axios.get(`${BACKEND_URL}/sellerorder`);
        const sellerData = sellerRes.data;

        // Seller order notifications (farmer approved/disapproved)
        sellerData.forEach(order => {
          if (order.status && !notifiedOrdersRef.current.has(order._id) && (order.status === "approved" || order.status === "disapproved")) {
            showToast(`Your order for ${order.item} has been ${order.status}!`, order.status === "approved" ? "success" : "error");
            notifiedOrdersRef.current.add(order._id);
          }
        });

        // Deliveryman acceptance notifications
        for (const order of sellerData) {
          if (order.acceptedByDeliveryman && order.deliverymanId && !notifiedOrdersRef.current.has(order._id)) {
            try {
              const deliveryRes = await axios.get(`${BACKEND_URL}/deliveryman/${order.deliverymanId}`);
              const name = deliveryRes.data.name || "Deliveryman";
              showToast(`Your order for ${order.item} has been accepted by ${name}!`, "success");
            } catch {
              showToast(`Your order for ${order.item} has been accepted by a deliveryman!`, "success");
            }
            notifiedOrdersRef.current.add(order._id);
          }
        }

        setSellerOrders(sellerData);

        const deliveryRes = await axios.get(`${BACKEND_URL}/deliverypost/`);
        setDeliveryPosts(deliveryRes.data);

      } catch (err) {
        console.error(err);
        showToast("Error fetching data", "error");
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => { clearInterval(interval); document.head.removeChild(styleSheet); };
  }, []);

  const handleImageError = (id, type, src) => setImageErrors(prev => ({ ...prev, [`${type}-${id}`]: true }));

  const sellerOrdersToDisplay = showAllSellerOrders ? sellerOrders : sellerOrders.slice(0, 4);
  const deliveryPostsToDisplay = showAllDeliveryPosts ? deliveryPosts : deliveryPosts.slice(0, 4);

  return (
    <div>
      <NavbarRegistered />
      <div className="nothing"></div>

      {/* Toast Container */}
      <div style={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ ...styles.toast, ...(toast.type==="success"?styles.toastSuccess:styles.toastError) }}>
            <div style={{ ...styles.toastIcon, ...(toast.type==="success"?styles.toastIconSuccess:styles.toastIconError) }}>
              <FontAwesomeIcon icon={toast.type==="success"?faCheckCircle:faTimesCircle}/>
            </div>
            <div style={styles.toastMessage}>{toast.message}</div>
            <button style={styles.toastClose} onClick={() => removeToast(toast.id)} onMouseEnter={e=>e.target.style.color="#333"} onMouseLeave={e=>e.target.style.color="#999"}>&times;</button>
          </div>
        ))}
      </div>

      <div className="crop-container">
        <img src="https://www.atoallinks.com/wp-content/uploads/2020/07/Agriculture-Product-Buying-and-Selling-App-Development.jpg"
          alt="seller-banner" className="crop-image"
          onError={e => { e.target.onerror = null; e.target.src="https://via.placeholder.com/1200x400?text=Seller+Banner"; }}
        />
      </div>

      <div className="type-writer-container">
        <TypeWriter text="Welcome Sellers!" loop={false} className="writer" textStyle={{ fontFamily:"Gill Sans", fontSize:"60px" }} />
      </div>

      <div className="categories-container"><div className="categories-div"><RegCategories/></div></div>
      <div className="nothing2"></div>
      <div className="topic"><p>Your Orders</p></div>

      {/* Seller Orders */}
      <div className="orders-wrapper">
        <div className="orders-container">
          {sellerOrdersToDisplay.map((order, index) => {
            const imageUrl = getImageUrl(order.productImage);
            const displayImage = imageErrors[`order-${order._id || index}`]?fallbackProductImage:imageUrl||fallbackProductImage;
            return (
              <div key={order._id || index} className="order-item">
                <img src={displayImage} alt={order.item||"Product"} className="order-image"
                  onError={e=>{handleImageError(order._id||index,"order",e.target.src);e.target.onerror=null;e.target.src=fallbackProductImage}}/>
                <p><strong>{order.item||"Unknown Item"}</strong></p>
                {order.quantity && <p>Quantity: {order.quantity}</p>}
                {order.price && <p>Price: Rs.{order.price}</p>}
                {order.postedDate && <p>Posted: {order.postedDate}</p>}
                {order.expireDate && <p>Expires: {order.expireDate}</p>}
                <p>Status: {order.status||"Pending"}</p>
                {order.acceptedByDeliveryman && <p style={{color:"green"}}>Accepted by Deliveryman</p>}
              </div>
            );
          })}
        </div>
                {sellerOrders.length > 4 && (
          <button
            className="view-all-button1"
            onClick={() => setShowAllSellerOrders(!showAllSellerOrders)}
          >
            {showAllSellerOrders ? "Show Less" : "View All"}
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </button>
        )}
      </div>

      <div className="topic"><p>Delivery Services</p></div>
      <div className="orders-wrapper">
        <div className="orders-container">
          {deliveryPostsToDisplay.map((post, index) => {
            const imageUrl = getImageUrl(post.vehicleImage);
            const displayImage = imageErrors[`delivery-${post._id || index}`] ? fallbackVehicleImage : imageUrl || fallbackVehicleImage;
            return (
              <div key={post._id || index} className="order-item">
                <img
                  src={displayImage}
                  alt={post.model || "Vehicle"}
                  className="order-image"
                  onError={(e) => { handleImageError(post._id || index, "delivery", e.target.src); e.target.onerror = null; e.target.src = fallbackVehicleImage; }}
                />
                <p><strong>{post.model || "Unknown Model"}</strong></p>
                {post.capacity && <p>Capacity: {post.capacity} kg</p>}
                {post.price && <p>Price: Rs.{post.price}/km</p>}
              </div>
            );
          })}
        </div>
        {deliveryPosts.length > 4 && (
          <button
            className="view-all-button1"
            onClick={() => setShowAllDeliveryPosts(!showAllDeliveryPosts)}
          >
            {showAllDeliveryPosts ? "Show Less" : "View All"}
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </button>
        )}
      </div>

      <FooterNew />
    </div>
  );
}

export default RegSellerPage;
