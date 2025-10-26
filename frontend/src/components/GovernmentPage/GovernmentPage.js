import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GovernmentPage.css";
import Navbar from "../Navbar/Navbar";
import FooterNew from "../Footer/FooterNew";
import { useNavigate } from "react-router-dom";

function GovernmentPage() {
  const navigate = useNavigate();
  // Login states
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Schemes states
  const [schemes, setSchemes] = useState([]);
  const [newScheme, setNewScheme] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editScheme, setEditScheme] = useState("");

  // Delivery men states
  const [deliveryMen, setDeliveryMen] = useState([]);
  const [showDeliveryMen, setShowDeliveryMen] = useState(false);
  const [salaryInputs, setSalaryInputs] = useState({});

  // Applicants states
  const [applicants, setApplicants] = useState([]);
  const [showApplicantsFor, setShowApplicantsFor] = useState(null);

  // Delivery history states
  const [selectedDeliverymanId, setSelectedDeliverymanId] = useState(null);
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  const BASE_URL = "http://localhost:8070";

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

  // Fetch schemes on mount but only if logged in
  useEffect(() => {
    if (loggedIn) {
      fetchSchemes();
    }
  }, [loggedIn]);

  // Fetch schemes from backend
  const fetchSchemes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/schemes`);
      setSchemes(res.data);
    } catch (err) {
      console.error("Failed to fetch schemes:", err);
      alert("Failed to load schemes. Please try again later.");
    }
  };

  // Fetch delivery men from backend
  const fetchDeliveryMen = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/deliverymen`);
      setDeliveryMen(res.data);
    } catch (err) {
      console.error("Failed to fetch delivery men:", err);
      alert("Failed to load delivery men. Please try again later.");
    }
  };

  // Fetch delivery history for a specific deliveryman
  const fetchDeliveryHistory = async (deliverymanId) => {
    try {
      // Fetch seller orders
      const sellerOrdersRes = await axios.get(`${BASE_URL}/sellerorder/deliveryman/${deliverymanId}`);
      const sellerOrders = Array.isArray(sellerOrdersRes.data) ? sellerOrdersRes.data : [];

      // Fetch farmer orders
      let farmerOrders = [];
      try {
        const farmerOrdersRes = await axios.get(`${BASE_URL}/farmerorder/deliveryman/${deliverymanId}`);
        farmerOrders = Array.isArray(farmerOrdersRes.data) ? farmerOrdersRes.data : [];
      } catch (err) {
        console.log("No farmer orders found");
      }

      // Combine and filter delivered orders only
      const allOrders = [...sellerOrders, ...farmerOrders].filter(
        order => order.deliveryStatus === "delivered" || order.deliveryStatus === "approved"
      );

      // Sort by date (newest first)
      allOrders.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB - dateA;
      });

      setDeliveryHistory(allOrders);
      calculateMonthlyStats(allOrders);
      setSelectedDeliverymanId(deliverymanId);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to fetch delivery history:", err);
      alert("Failed to fetch delivery history. Please try again.");
    }
  };

  // Calculate monthly statistics
  const calculateMonthlyStats = (orders) => {
    const stats = {};
    
    orders.forEach(order => {
      const date = new Date(order.updatedAt || order.createdAt);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!stats[monthYear]) {
        stats[monthYear] = 0;
      }
      stats[monthYear]++;
    });

    setMonthlyStats(stats);
  };

  // Format date
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

  // Add new scheme
  const handleAddScheme = async () => {
    if (!newScheme.trim()) {
      alert("Please enter a scheme name");
      return;
    }
    try {
      const res = await axios.post(`${BASE_URL}/schemes`, {
        name: newScheme.trim(),
      });
      setSchemes((prev) => [...prev, res.data]);
      setNewScheme("");
    } catch (err) {
      console.error("Error adding scheme:", err);
      alert("Failed to add scheme. Please try again.");
    }
  };

  // Edit scheme handlers
  const handleEditScheme = (index) => {
    setEditIndex(index);
    setEditScheme(schemes[index].name);
  };

  const handleSaveEdit = async (index) => {
    if (!editScheme.trim()) {
      alert("Scheme name cannot be empty");
      return;
    }
    const scheme = schemes[index];
    try {
      const res = await axios.put(`${BASE_URL}/schemes/${scheme._id}`, {
        name: editScheme.trim(),
      });
      const updatedSchemes = [...schemes];
      updatedSchemes[index] = res.data;
      setSchemes(updatedSchemes);
      setEditIndex(null);
    } catch (err) {
      console.error("Error updating scheme:", err);
      alert("Failed to update scheme. Please try again.");
    }
  };

  // Delete scheme handler
  const handleDeleteScheme = async (index) => {
    const scheme = schemes[index];
    try {
      await axios.delete(`${BASE_URL}/schemes/${scheme._id}`);
      setSchemes((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error deleting scheme:", err);
      alert("Failed to delete scheme. Please try again.");
    }
  };

  // Handle salary input change
  const handleSalaryChange = (id, value) => {
    setSalaryInputs((prev) => ({ ...prev, [id]: value }));
  };

  // Provide salary to delivery man
  const provideSalary = async (id) => {
    if (!salaryInputs[id]) {
      alert("Please enter a salary amount");
      return;
    }

    const numericSalary = Number(salaryInputs[id]);

    if (isNaN(numericSalary)) {
      alert("Salary must be a valid number");
      return;
    }

    try {
      await axios.put(`${BASE_URL}/deliverymen/${id}/salary`, {
        salary: numericSalary,
      });
      alert("Salary updated successfully!");
      fetchDeliveryMen();
    } catch (err) {
      console.error("Failed to update salary:", err);
      alert("Failed to update salary. Please try again.");
    }
  };

  // Fetch applicants for a scheme
  const fetchApplicants = async (schemeId) => {
    try {
      const res = await axios.get(`${BASE_URL}/schemes/${schemeId}/applicants`);
      setApplicants(res.data);
      setShowApplicantsFor(schemeId);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
      alert("Failed to fetch applicants. Please try again.");
    }
  };

  // Handle login submit
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
      setLoggedIn(true);
      setLoginError("");
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Invalid username or password");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setLoggedIn(false);
    setSchemes([]);
    setDeliveryMen([]);
    setShowDeliveryMen(false);
    setSalaryInputs({});
    setApplicants([]);
    setShowApplicantsFor(null);
    setShowHistory(false);
    setDeliveryHistory([]);
    setSelectedDeliverymanId(null);
  };

  return (
    <div className="container">
      <button
        style={{
          backgroundColor: "black",
          color: "white",
          padding: "10px 20px",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
          borderRadius: "4px",
        }}
        onClick={() => navigate('/')}
      >
        Back to Home Page
      </button>

      {loggedIn && (
        <button
          onClick={handleLogout}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "10px 20px",
            backgroundColor: "#c00",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            zIndex: 9999,
          }}
        >
          Logout
        </button>
      )}

      {!loggedIn ? (
        <div style={{ maxWidth: "400px", margin: "100px auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Government Login</h2>
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
            {loginError && (
              <p style={{ color: "red", textAlign: "center" }}>{loginError}</p>
            )}
            <button type="submit" className="add-button">
              Login
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              style={{
                backgroundColor: "black",
                color: "white",
                padding: "10px 20px",
                border: "none",
                cursor: "pointer",
                borderRadius: "4px",
              }}
              onClick={() => navigate('/')}
            >
              Back to Home Page
            </button>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <div className="government-banner">
            <h1 className="government-title">Government Schemes Management</h1>
          </div>

          <div className="input-section">
            <input
              type="text"
              placeholder="Enter new scheme"
              value={newScheme}
              onChange={(e) => setNewScheme(e.target.value)}
              className="input-field"
            />
            <button className="add-button" onClick={handleAddScheme}>
              Add Scheme
            </button>
          </div>

          <table className="schemes-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Actions</th>
                <th>Applicants</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((scheme, index) => (
                <tr key={scheme._id}>
                  <td>
                    {editIndex === index ? (
                      <input
                        type="text"
                        value={editScheme}
                        onChange={(e) => setEditScheme(e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      scheme.name
                    )}
                  </td>
                  <td>
                    {editIndex === index ? (
                      <>
                        <button
                          className="save-btn"
                          onClick={() => handleSaveEdit(index)}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => setEditIndex(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleEditScheme(index)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteScheme(index)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => fetchApplicants(scheme._id)}
                      style={{ padding: "5px 10px", cursor: "pointer" }}
                    >
                      View Applicants
                    </button>
                  </td>
                </tr>
              ))}
              {schemes.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No schemes available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Applicants section */}
          {showApplicantsFor && (
            <div className="applicants-section" style={{ marginTop: "20px" }}>
              <h3>Applicants:</h3>
              {applicants.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app, idx) => (
                      <tr key={idx}>
                        <td>{app.username}</td>
                        <td>{app.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No applicants yet for this scheme.</p>
              )}
            </div>
          )}

          <div style={{ marginTop: "30px", marginBottom: "20px" }}>
            <button
              className="toggle-deliverymen-btn"
              onClick={() => {
                if (!showDeliveryMen) fetchDeliveryMen();
                setShowDeliveryMen(!showDeliveryMen);
              }}
            >
              {showDeliveryMen ? "Hide Delivery Men" : "View Delivery Men"}
            </button>
          </div>

          {showDeliveryMen && (
            <table className="deliverymen-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>District</th>
                  <th>Current Salary</th>
                  <th>Set New Salary</th>
                  <th>Action</th>
                  <th>View History</th>
                </tr>
              </thead>
              <tbody>
                {deliveryMen.map((dm) => (
                  <tr key={dm._id}>
                    <td>{dm.fname} {dm.lname}</td>
                    <td>{dm.email}</td>
                    <td>{dm.district}</td>
                    <td>{dm.salary !== null && dm.salary !== undefined ? dm.salary : "Not set"}</td>
                    <td>
                      <input
                        type="number"
                        value={salaryInputs[dm._id] || ""}
                        onChange={(e) => handleSalaryChange(dm._id, e.target.value)}
                        placeholder="Enter salary"
                        className="salary-input"
                      />
                    </td>
                    <td>
                      <button onClick={() => provideSalary(dm._id)}>Provide Salary</button>
                    </td>
                    <td>
                      <button 
                        onClick={() => fetchDeliveryHistory(dm._id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#4CAF50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
                {deliveryMen.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No delivery men found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Delivery History Section */}
          {showHistory && (
            <div style={{
              margin: "30px auto",
              maxWidth: "1400px",
              padding: "30px",
              backgroundColor: "#f5f5f5",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: "20px"
              }}>
                <h2 style={{ margin: 0, color: "#333" }}>
                  Delivery History - {deliveryMen.find(dm => dm._id === selectedDeliverymanId)?.fname} {deliveryMen.find(dm => dm._id === selectedDeliverymanId)?.lname}
                </h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>

              {/* Monthly Statistics */}
              <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}>
                <h3 style={{ marginTop: 0, color: "#333" }}>Monthly Delivery Statistics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
                  {Object.entries(monthlyStats).map(([month, count]) => (
                    <div key={month} style={{
                      padding: "15px",
                      backgroundColor: "#e3f2fd",
                      borderRadius: "5px",
                      textAlign: "center",
                      borderLeft: "4px solid #2196f3"
                    }}>
                      <div style={{ fontSize: "14px", color: "#666", marginBottom: "5px" }}>{month}</div>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2196f3" }}>{count} deliveries</div>
                    </div>
                  ))}
                </div>
                {Object.keys(monthlyStats).length === 0 && (
                  <p style={{ textAlign: "center", color: "#666" }}>No delivery statistics available</p>
                )}
              </div>

              {/* Detailed Delivery History */}
              <div>
                <h3 style={{ color: "#333" }}>Detailed Delivery History ({deliveryHistory.length} total deliveries)</h3>
                {deliveryHistory.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "16px", color: "#666" }}>
                    No delivery history found for this deliveryman.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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
                          style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            display: "grid",
                            gridTemplateColumns: "150px 1fr",
                            gap: "20px"
                          }}
                        >
                          <img 
                            src={getImageUrl(order.productImage)}
                            alt={order.item}
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px"
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                          <div>
                            <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>{order.item}</h4>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "15px" }}>
                              <div>
                                <strong>Quantity:</strong> {order.quantity} kg
                              </div>
                              <div>
                                <strong>Price:</strong> Rs.{order.price}
                              </div>
                              <div>
                                <strong>Status:</strong> <span style={{ color: "green", fontWeight: "bold" }}>✓ DELIVERED</span>
                              </div>
                              <div>
                                <strong>Delivery Date:</strong> {formatDate(order.updatedAt || order.createdAt)}
                              </div>
                              {order.district && (
                                <div>
                                  <strong>District:</strong> {order.district}
                                </div>
                              )}
                            </div>

                            {/* Delivery Route */}
                            <div style={{
                              padding: "15px",
                              backgroundColor: "#e8f5e9",
                              borderRadius: "5px",
                              borderLeft: "4px solid #4caf50"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                                <div style={{ flex: 1, minWidth: "200px" }}>
                                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                    <strong>FROM (Farmer):</strong>
                                  </div>
                                  <div style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}>
                                    👨‍🌾 {farmerName}
                                  </div>
                                  {hasFarmerInfo && order.farmerId.mobile && (
                                    <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>
                                      📞 {order.farmerId.mobile}
                                    </div>
                                  )}
                                  {hasFarmerInfo && order.farmerId.district && (
                                    <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>
                                      📍 {order.farmerId.district}
                                    </div>
                                  )}
                                </div>

                                <div style={{ fontSize: "24px", color: "#4caf50" }}>
                                  🚚 ➔
                                </div>

                                <div style={{ flex: 1, minWidth: "200px" }}>
                                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                                    <strong>TO (Seller):</strong>
                                  </div>
                                  <div style={{ fontSize: "16px", color: "#333", fontWeight: "bold" }}>
                                    🏪 {sellerName}
                                  </div>
                                  {hasSellerInfo && order.sellerId.mobile && (
                                    <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>
                                      📞 {order.sellerId.mobile}
                                    </div>
                                  )}
                                  {hasSellerInfo && order.sellerId.district && (
                                    <div style={{ fontSize: "14px", color: "#666", marginTop: "3px" }}>
                                      📍 {order.sellerId.district}
                                    </div>
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

          <FooterNew />
        </>
      )}
    </div>
  );
}

export default GovernmentPage;