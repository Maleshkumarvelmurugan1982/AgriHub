import React, { useState, useEffect } from "react";
import axios from "axios";
import "./schemes.css"; // You can reuse the same css or create a new one
import Navbar from "../Navbar/Navbar";
import FooterNew from "../Footer/FooterNew";

function Schemes() {
  const [schemes, setSchemes] = useState([]);
  const [newScheme, setNewScheme] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editScheme, setEditScheme] = useState("");

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await axios.get("http://localhost:8070/schemes");
      setSchemes(res.data);
    } catch (err) {
      console.error("Failed to fetch schemes:", err);
      alert("Failed to load schemes. Please try again later.");
    }
  };

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

  return (
    <div className="container">
      <Navbar />

      <div className="government-banner">
        <h1 className="government-title">Government Schemes Management</h1>
      </div>

      {/* Add Scheme Input */}
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

      {/* Schemes Table */}
      <table className="schemes-table">
        <thead>
          <tr>
            <th>Scheme Name</th>
            <th>Actions</th>
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
                    <button className="save-btn" onClick={() => handleSaveEdit(index)}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={() => setEditIndex(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-btn" onClick={() => handleEditScheme(index)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteScheme(index)}>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {schemes.length === 0 && (
            <tr>
              <td colSpan="2" style={{ textAlign: "center" }}>
                No schemes available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <FooterNew />
    </div>
  );
}

export default Schemes;
