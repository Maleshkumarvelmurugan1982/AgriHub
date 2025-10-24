import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function UserProfile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
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
          setUser(data.data);
          fetchOrders(data.data.role, data.data._id);
        } else {
          setError("Please login again.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setError("Something went wrong");
      });
  }, []);

  const fetchOrders = (role, id) => {
    let url = "";
    if (role === "Farmer") url = `http://localhost:8070/farmerorder/user/${id}`;
    else if (role === "Seller") url = `http://localhost:8070/sellerorder/user/${id}`;
    else if (role === "Deliveryman") url = `http://localhost:8070/deliverypost/user/${id}`;
    else return;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.error("Failed to fetch orders:", err));
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove token
    navigate("/"); // redirect to home page
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading user data...</p>;

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
          justify-content: flex-start;
          padding: 80px 20px 40px 20px;
          min-height: 100vh;
          color: #2e5230;
          box-sizing: border-box;
        }

        h2 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        p {
          font-size: 18px;
          margin: 6px 0;
          text-align: center;
        }

        hr {
          border: none;
          height: 2px;
          background-color: #79ac78;
          margin: 30px 0;
          border-radius: 5px;
          width: 80%;
        }

        .button {
          padding: 12px 25px;
          margin: 10px;
          background-color: #3b6e3b;
          color: white;
          font-weight: 600;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .button:hover {
          background-color: #2e5230;
          transform: scale(1.05);
        }

        .orders-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 25px;
          justify-items: center;
          width: 100%;
          max-width: 1200px;
        }

        .order-item {
          background-color: #e3f4e3;
          border: 1px solid #79ac78;
          border-radius: 15px;
          padding: 20px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
        }

        .order-item:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
        }

        .order-item pre {
          font-family: 'Courier New', Courier, monospace;
          background-color: #d5ead5;
          padding: 10px;
          border-radius: 8px;
          overflow-x: auto;
        }

        .profile-card {
          background-color: #d9f0d9;
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 40px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          text-align: center;
          transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
          width: 100%;
          max-width: 600px;
        }

        .profile-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="container">
        <div className="profile-card">
          <h2>Welcome, {user.username}</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Salary:</strong> ${user.salary || 0}</p>
          <button className="button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <hr />

        <h3>Your Orders:</h3>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-wrapper">
            {orders.map((order, index) => (
              <div key={order._id || index} className="order-item">
                <pre>{JSON.stringify(order, null, 2)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default UserProfile;
