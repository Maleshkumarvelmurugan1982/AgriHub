import React, { useEffect, useState } from "react";

function UserProfile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8070/user/userdata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ token: localStorage.getItem("token") }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "ok") {
          setUser(data.data);
          fetchOrders(data.data.userRole, data.data._id);
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
      .then((data) => {
        setOrders(data);
      })
      .catch((err) => {
        console.error("Failed to fetch orders:", err);
      });
  };

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading user data...</p>;

  return (
    <>
      <style>{`
        .nothing {
          width: 100%;
          height: 74px;
        }

        .crop-container {
          width: 100%;
          height: 455px;
          overflow: hidden;
        }

        .crop-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .type-writer-container {
          position: absolute;
          top: 25%;
          left: 10%;
          max-width: 30%;
          display: flex;
        }

        .writer {
          font-size: 25px;
          font-weight: 700;
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
        }

        .categories-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .request-product {
          padding: 10px 15px;
          border-radius: 10px;
          background-color: hsl(49, 37%, 62%);
          border: none;
          font-size: 20px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          color: black;
          max-width: 250px;
          overflow: hidden;
          white-space: nowrap;
        }

        .request-product:hover {
          color: black;
        }

        .categories-div {
          width: auto;
          padding-right: 30px;
        }

        .first-word {
          font-size: 24px;
          color: black;
          font-family: "Open Sans", sans-serif;
          font-weight: 700;
        }

        .second-word {
          font-size: 24px;
          color: #79ac78;
          font-family: "Open Sans", sans-serif;
          font-weight: 700;
        }

        .product-row {
          display: flex;
          justify-content: space-between;
          margin: 30px;
        }

        .go-to-page {
          font-size: 25px;
          font-weight: 500;
          margin-right: 10px;
          width: auto;
          height: 50px;
        }

        .topic p {
          font-size: 24px;
          font-weight: bold;
          padding: 4px;
          border: 4px solid #79ac78;
          width: 300px;
          padding-left: 30px;
          border-radius: 0 15px 0 15px;
          margin-top: 10px;
          margin-left: 40px;
        }

        .orders-wrapper {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 30px;
          padding-bottom: 70px;
        }

        .orders-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 20px;
          padding: 0;
        }

        .view-all-button, .view-all-button1 {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 200px;
          padding: 10px 20px;
          background-color: #007bff;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.3s;
        }

        .view-all-button1 {
          margin-right: 50px;
        }

        .view-all-button1:hover, .view-all-button:hover {
          background-color: #79ac78;
          color: #fff;
        }

        .arrow-icon {
          margin-left: 10px;
        }

        .order-item, .order-item1 {
          box-sizing: border-box;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease-in-out;
        }

        .order-item {
          width: calc(20% - 20px);
        }

        .order-item1 {
          width: calc(23% - 20px);
        }

        .order-item:hover {
          transform: scale(1.01);
        }

        .order-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 8px 8px 0 0;
        }

        .order-item p {
          margin-top: 10px;
          margin-bottom: 5px;
        }

        .cart-button, .supply-button {
          display: block;
          margin-top: 10px;
          padding: 10px 15px;
          border: none;
          border-radius: 5px;
          background-color: #79ac78;
          color: #fff;
          cursor: pointer;
          transition: background-color 0.3s ease-in-out;
        }

        .cart-button:hover, .supply-button:hover {
          background-color: #0056b3;
        }

        .fa-shopping-cart, .fa-truck {
          margin-right: 5px;
        }

        .nothing2 {
          margin-top: 40px;
        }

        .login-path-set {
          text-decoration: none;
        }
      `}</style>

      <div
        style={{
          padding: "2rem",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #a8d5a3 0%, #e6f0ea 70%, #ffffff 100%)",
          color: "#333",
          boxSizing: "border-box",
        }}
      >
        <h2>Welcome, {user.fname}</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.userRole}</p>

        <hr />
        <h3>Your {user.userRole} Orders:</h3>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul>
            {orders.map((order, index) => (
              <li key={order._id || index} className="order-item">
                {JSON.stringify(order)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default UserProfile;
