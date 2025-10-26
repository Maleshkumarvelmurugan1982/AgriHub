import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function SchemeApplication() {
  const { schemeId } = useParams();
  const [scheme, setScheme] = useState(null);
  const [formData, setFormData] = useState({
    farmerName: "",
    contact: "",
    details: "",
  });
  const [message, setMessage] = useState("");

  // Fetch scheme details
  useEffect(() => {
    const fetchScheme = async () => {
      try {
        const response = await fetch(`http://localhost:8070/schemes/${schemeId}`);
        const data = await response.json();
        setScheme(data);
      } catch (err) {
        console.error("Error fetching scheme:", err);
      }
    };

    fetchScheme();
  }, [schemeId]);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8070/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: scheme._id,
          schemeName: scheme.name,
          ...formData,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Application submitted successfully!");
        setFormData({ farmerName: "", contact: "", details: "" });
      } else {
        setMessage(data.error || "Failed to submit application");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      setMessage("Error submitting application");
    }
  };

  if (!scheme) return <p>Loading scheme details...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Apply for: {scheme.name}</h1>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input
            type="text"
            name="farmerName"
            value={formData.farmerName}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Contact:
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
          />
        </label>
        <br />
        <label>
          Details:
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            required
          ></textarea>
        </label>
        <br />
        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
}

export default SchemeApplication;
