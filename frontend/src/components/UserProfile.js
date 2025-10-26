import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserProfile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [salary, setSalary] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8070/user/userdata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token: localStorage.getItem("token") }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          const userRole = data.data.role || data.data.userRole;

          // Fetch deliveryman details if role is Deliveryman
          if (userRole === "Deliveryman") {
            fetch("http://localhost:8070/deliveryman/userdata", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: localStorage.getItem("token") }),
            })
              .then((res) => res.json())
              .then((deliverymanData) => {
                if (deliverymanData.status === "ok" && deliverymanData.data) {
                  setUser({ ...data.data, ...deliverymanData.data });
                  setSalary(deliverymanData.data.salary || 0);
                } else {
                  setUser(data.data);
                }
              })
              .catch((err) => {
                console.error("Failed to fetch deliveryman details:", err);
                setUser(data.data);
              });
          } else {
            setUser(data.data);
          }
        } else {
          setError("Please login again.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setError("Something went wrong");
      });
  }, []);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading user data...</p>;

  const userRole = user.role || user.userRole;

  return (
    <>
      <style>{`
        body {
          font-family: 'Poppins', sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #c3f0c3 0%, #eaf7ea 70%, #ffffff 100%);
        }

        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          min-height: 100vh;
          color: #2e5230;
          box-sizing: border-box;
          position: relative;
        }

        h2 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 10px;
          color: #2e5230;
        }

        p {
          font-size: 18px;
          margin: 10px 0;
          text-align: center;
        }

        .back-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          padding: 12px 30px;
          background-color: #3b6e3b;
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          font-size: 16px;
          z-index: 1000;
        }

        .back-button:hover {
          background-color: #2e5230;
          transform: scale(1.05);
        }

        .profile-card {
          background-color: #ffffff;
          border-radius: 20px;
          padding: 40px 50px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          text-align: center;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
          width: 100%;
          max-width: 500px;
        }

        .profile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        }

        .salary-highlight {
          background: linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%);
          border: 2px solid #ffc107;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          font-size: 24px;
          font-weight: 700;
          color: #856404;
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
        }

        .no-salary {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          border: 2px solid #f44336;
          padding: 20px;
          border-radius: 15px;
          margin: 20px 0;
          font-size: 24px;
          font-weight: 700;
          color: #721c24;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="container">
        <div className="profile-card">
          <h2>👤 User Profile</h2>

          {userRole === "Deliveryman" ? (
            <div className="salary-highlight">
              💰 Salary: Rs.{salary}
            </div>
          ) : (userRole === "Seller" || userRole === "Farmer") ? (
            <div className="no-salary">
              🚫 No Salary
            </div>
          ) : null}
        </div>

        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
      </div>
    </>
  );
}

export default UserProfile;
