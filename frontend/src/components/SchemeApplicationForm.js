import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function SchemeApplicationForm() {
  const { schemeId } = useParams();
  const navigate = useNavigate();

  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [farmerContact, setFarmerContact] = useState("");
  const [farmerDetails, setFarmerDetails] = useState("");

  useEffect(() => {
    const fetchScheme = async () => {
      try {
        const res = await fetch(`http://localhost:8070/schemes/${schemeId}`);
        if (!res.ok) throw new Error(`Scheme not found (status: ${res.status})`);
        const data = await res.json();
        setScheme(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchScheme();
  }, [schemeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8070/scheme/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemeId, farmerName, farmerContact, farmerDetails }),
      });

      if (!res.ok) throw new Error("Failed to submit application");

      alert("Application submitted successfully!");
      navigate("/regfarmer");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  if (loading) return <p>Loading scheme details...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Apply for Scheme: {scheme.name}</h2>
      <p>{scheme.description}</p>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} required />
        </label>
        <br />
        <label>
          Contact:
          <input type="text" value={farmerContact} onChange={(e) => setFarmerContact(e.target.value)} required />
        </label>
        <br />
        <label>
          Additional Details:
          <textarea value={farmerDetails} onChange={(e) => setFarmerDetails(e.target.value)} />
        </label>
        <br />
        <button type="submit">Submit Application</button>
        <button type="button" onClick={() => navigate("/regfarmer")} style={{ marginLeft: "10px" }}>
          Back
        </button>
      </form>
    </div>
  );
}

export default SchemeApplicationForm;
