import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderPage.css";

function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [formData, setFormData] = useState({
    productImage: queryParams.get("image") || "",
    productName: queryParams.get("item") || "",
    quantity: "",
    price: "",
    district: "",
    company: "",
    mobile: "",
    email: "",
    address: "",
    expireDate: "",
  });

  const [unitPrice, setUnitPrice] = useState(0);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [quantityError, setQuantityError] = useState("");
  const [productId, setProductId] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);

  // NEW: State for balance alert modal
  const [showBalanceAlert, setShowBalanceAlert] = useState(false);
  const [balanceAlertMessage, setBalanceAlertMessage] = useState("");

  const BASE_URL = "https://agrihub-2.onrender.com";

  // Fetch logged-in seller data
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        const res = await fetch(`${BASE_URL}/seller/userdata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.status === "ok" && data.data) {
          setSellerId(data.data._id);
          setWalletBalance(data.data.walletBalance || 0);
          setFormData((prev) => ({
            ...prev,
            email: data.data.email || prev.email,
            district: data.data.district || prev.district,
            mobile: data.data.mobile || prev.mobile,
          }));
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Error fetching seller data:", err);
        navigate("/login");
      }
    };
    fetchSellerData();
  }, [navigate]);

  // Fetch product details
  useEffect(() => {
    const productNameFromUrl = queryParams.get("item");
    const priceFromUrl = queryParams.get("price");
    if (priceFromUrl) setUnitPrice(Number(priceFromUrl));

    if (!productNameFromUrl) return;

    fetch(`${BASE_URL}/product/name/${productNameFromUrl}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((product) => {
        if (!product) return;
        if (product.price) setUnitPrice(Number(product.price));
        if (product.quantity) setAvailableQuantity(Number(product.quantity));
        if (product._id) setProductId(product._id);

        const farmerIdValue =
          typeof product.farmerId === "object"
            ? product.farmerId._id
            : product.farmerId || product.userId;

        if (farmerIdValue) setFarmerId(farmerIdValue);

        if (product.productImage) {
          setFormData((prev) => ({
            ...prev,
            productImage: product.productImage,
          }));
        }
      })
      .catch(console.error);
  }, [queryParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      const quantity = Number(value) || 0;
      if (quantity > availableQuantity)
        setQuantityError(`Only ${availableQuantity} kg available!`);
      else setQuantityError("");

      const totalPrice = quantity * unitPrice;
      setFormData((prev) => ({
        ...prev,
        quantity: value,
        price: totalPrice > 0 ? totalPrice.toFixed(2) : "",
      }));

      // NEW: Check balance when quantity changes
      if (totalPrice > walletBalance && totalPrice > 0) {
        setBalanceAlertMessage(
          `Insufficient Wallet Balance!\n\nOrder Total: Rs. ${totalPrice.toFixed(2)}\nWallet Balance: Rs. ${walletBalance.toFixed(2)}\nShortfall: Rs. ${(totalPrice - walletBalance).toFixed(2)}\n\nPlease reduce quantity or top up your wallet.`
        );
        setShowBalanceAlert(true);
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const checkSufficientBalance = () => {
    const totalPrice = Number(formData.price);
    return walletBalance >= totalPrice;
  };

  // NEW: Handle cancel order
  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order? All entered information will be lost.")) {
      navigate("/regseller");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantityError) return alert("Please enter a valid quantity!");
    if (
      !formData.quantity ||
      !formData.district ||
      !formData.company ||
      !formData.mobile ||
      !formData.email ||
      !formData.address ||
      !formData.expireDate
    ) {
      return alert("Please fill in all required fields!");
    }
    if (!sellerId) return navigate("/login");
    if (!farmerId) return alert("Product owner info missing!");

    const totalPrice = Number(formData.price);

    if (!checkSufficientBalance()) {
      setBalanceAlertMessage(
        `Insufficient Wallet Balance!\n\nOrder Total: Rs. ${totalPrice.toFixed(2)}\nWallet Balance: Rs. ${walletBalance.toFixed(2)}\nShortfall: Rs. ${(totalPrice - walletBalance).toFixed(2)}\n\nPlease top up your wallet before placing order.`
      );
      setShowBalanceAlert(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        name: formData.company,
        item: formData.productName,
        productImage: formData.productImage,
        category: "vegetable",
        quantity: Number(formData.quantity),
        price: totalPrice,
        district: formData.district,
        company: formData.company,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        postedDate: new Date().toISOString().split("T")[0],
        expireDate: formData.expireDate,
        sellerId,
        farmerId,
        paymentMethod: "wallet",
        paymentStatus: "completed",
        isPaid: true,
      };

      console.log("🚀 Sending order data:", orderData);

      const res = await fetch(`${BASE_URL}/sellerorder/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Order failed");

      // Reduce product quantity immediately
      try {
        await fetch(`${BASE_URL}/product/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: availableQuantity - Number(formData.quantity),
          }),
        });
      } catch (err) {
        console.error("Error updating product quantity:", err);
      }

      // Update wallet balance
      let newBalance = walletBalance - totalPrice;
      setWalletBalance(newBalance);

      try {
        await fetch(`${BASE_URL}/wallet/deduct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId,
            amount: totalPrice,
            description: `Order payment for ${formData.productName} (${formData.quantity} kg)`,
            paymentMethod: "wallet",
            relatedOrder: result.order?._id || null,
          }),
        });
      } catch (err) {
        console.error("Error creating wallet transaction:", err);
      }

      alert(
        `Order placed successfully!\nAmount Paid: Rs.${totalPrice.toFixed(2)}\nPayment Method: Wallet`
      );

      navigate("/regseller");
    } catch (err) {
      console.error("Error submitting order:", err);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/regseller");
  };

  return (
    <div className="form-container">
      {/* NEW: Balance Alert Modal */}
      {showBalanceAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>⚠️ Insufficient Balance</h3>
            <p style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: '1.6',
              color: '#333',
              marginBottom: '20px'
            }}>
              {balanceAlertMessage}
            </p>
            <button
              onClick={() => setShowBalanceAlert(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <h3>Place New Order</h3>
      <form onSubmit={handleSubmit}>
        {formData.productImage && (
          <div className="image-preview">
            <img
              src={formData.productImage}
              alt="Product"
              onError={(e) =>
                (e.target.src = "https://via.placeholder.com/200?text=No+Image")
              }
            />
          </div>
        )}

        {/* Product Info */}
        <div className="input-field-container">
          <p>Product Name</p>
        </div>
        <div className="category-display">
          <h4>{formData.productName}</h4>
        </div>

        <div className="input-field-container">
          <p>Unit Price (Rs.)</p>
        </div>
        <div className="category-display">
          <h4>Rs. {unitPrice.toFixed(2)}</h4>
        </div>

        <div className="input-field-container">
          <p>Available Stock</p>
        </div>
        <div className="category-display">
          <h4>{availableQuantity} kg</h4>
        </div>

        <div className="input-field-container">
          <p>Quantity (kg) *</p>
        </div>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="0.1"
          step="0.1"
          max={availableQuantity}
          className={quantityError ? "input-error" : ""}
          required
        />
        {quantityError && <div className="error-message">{quantityError}</div>}

        <div className="input-field-container">
          <p>Total Price (Rs.)</p>
        </div>
        <input
          type="text"
          name="price"
          value={formData.price}
          readOnly
          className="readonly-field"
        />

        {/* Wallet Balance Display */}
        <div className="input-field-container">
          <p>Wallet Balance</p>
        </div>
        <div className="category-display" style={{ backgroundColor: '#e8f5e9' }}>
          <h4 style={{ color: '#2e7d32' }}>Rs. {walletBalance.toFixed(2)}</h4>
        </div>

        {/* Other fields */}
        <input
          type="text"
          name="district"
          placeholder="District"
          value={formData.district}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company"
          placeholder="Company"
          value={formData.company}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          required
        ></textarea>
        <input
          type="date"
          name="expireDate"
          value={formData.expireDate}
          onChange={handleChange}
          min={new Date().toISOString().split("T")[0]}
          required
        />

        {/* NEW: Updated Buttons Container with 3 buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flex: '0 0 auto'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
          >
            ← Back
          </button>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancelOrder}
            style={{
              padding: '12px 25px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              flex: '0 0 auto'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            ✕ Cancel Order
          </button>

          {/* Place Order Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              quantityError ||
              !checkSufficientBalance()
            }
            style={{
              flex: '1',
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: '600',
              opacity: (isSubmitting || quantityError || !checkSufficientBalance()) ? 0.6 : 1
            }}
          >
            {isSubmitting
              ? "Processing Payment..."
              : `Place Order & Pay Rs. ${formData.price || "0"}`}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OrderPage;
