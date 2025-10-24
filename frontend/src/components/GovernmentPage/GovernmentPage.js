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

  // Fetch schemes on mount but only if logged in
  useEffect(() => {
    if (loggedIn) {
      fetchSchemes();
    }
  }, [loggedIn]);

  // Fetch schemes from backend
  const fetchSchemes = async () => {
    try {
      const res = await axios.get("http://localhost:8070/schemes");
      setSchemes(res.data);
    } catch (err) {
      console.error("Failed to fetch schemes:", err);
      alert("Failed to load schemes. Please try again later.");
    }
  };

  // Fetch delivery men from backend
  const fetchDeliveryMen = async () => {
    try {
      const res = await axios.get("http://localhost:8070/deliverymen");
      setDeliveryMen(res.data);
    } catch (err) {
      console.error("Failed to fetch delivery men:", err);
      alert("Failed to load delivery men. Please try again later.");
    }
  };

  // Add new scheme
  const handleAddScheme = async () => {
    if (!newScheme.trim()) {
      alert("Please enter a scheme name");
      return;
    }
    try {
      const res = await axios.post("http://localhost:8070/schemes", {
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
      const res = await axios.put(`http://localhost:8070/schemes/${scheme._id}`, {
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
      await axios.delete(`http://localhost:8070/schemes/${scheme._id}`);
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
      await axios.put(`http://localhost:8070/deliverymen/${id}/salary`, {
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
      const res = await axios.get(`http://localhost:8070/schemes/${schemeId}/applicants`);
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
                  </tr>
                ))}
                {deliveryMen.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      No delivery men found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          <FooterNew />
        </>
      )}
    </div>
  );
}

export default GovernmentPage;
