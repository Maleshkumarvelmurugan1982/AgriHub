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

  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [walletBalance, setWalletBalance] = useState(0);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });

  const BASE_URL = "http://localhost:8070";

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

        // ✅ Use Cloudinary URL directly
        if (product.productImage) {
          setFormData((prev) => ({
            ...prev,
            productImage: product.productImage, // full Cloudinary URL
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
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const checkSufficientBalance = () => {
    const totalPrice = Number(formData.price);
    return walletBalance >= totalPrice;
  };

  const formatCardNumber = (value) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
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

    if (paymentMethod === "wallet" && !checkSufficientBalance()) {
      return alert(
        `Insufficient wallet balance!\nOrder Total: Rs.${totalPrice}\nWallet: Rs.${walletBalance}`
      );
    }

    if (paymentMethod === "card") {
      if (
        !cardDetails.cardNumber ||
        !cardDetails.cardHolder ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv
      ) {
        return alert("Please fill in all card details!");
      }
      if (cardDetails.cardNumber.length < 16) return alert("Card number must be 16 digits");
      if (cardDetails.cvv.length < 3) return alert("CVV must be 3 digits");
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        name: formData.company,
        item: formData.productName,
        productImage: formData.productImage, // ✅ Cloudinary URL
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
        paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "completed" : "pending",
        isPaid: paymentMethod === "wallet" ? true : false,
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

      // Update wallet if paid
      let newBalance = walletBalance;
      if (paymentMethod === "wallet") {
        newBalance = walletBalance - totalPrice;
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
      }

      alert(
        `Order placed successfully!\nAmount Paid: Rs.${totalPrice.toFixed(
          2
        )}\nPayment Method: ${paymentMethod === "wallet" ? "Wallet" : "Card"}`
      );

      navigate("/regseller");
    } catch (err) {
      console.error("Error submitting order:", err);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h3>Place New Order</h3>
      <form onSubmit={handleSubmit}>
        {formData.productImage && (
          <div className="image-preview">
            <img
              src={formData.productImage} // ✅ Cloudinary URL
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

        {/* Payment Method */}
        <div className="input-field-container">
          <p>Payment Method *</p>
        </div>
        <div className="payment-method-container">
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="wallet"
              checked={paymentMethod === "wallet"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Wallet (Balance: Rs. {walletBalance.toFixed(2)})
          </label>
          <label>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Debit/Credit Card
          </label>
        </div>

        {/* Card details */}
        {paymentMethod === "card" && (
          <div className="card-details-container">
            <input
              type="text"
              name="cardNumber"
              placeholder="Card Number"
              value={formatCardNumber(cardDetails.cardNumber)}
              onChange={handleCardChange}
              maxLength="19"
              required
            />
            <input
              type="text"
              name="cardHolder"
              placeholder="Card Holder"
              value={cardDetails.cardHolder}
              onChange={handleCardChange}
              required
            />
            <input
              type="text"
              name="expiryDate"
              placeholder="MM/YY"
              value={cardDetails.expiryDate}
              onChange={handleCardChange}
              maxLength="5"
              required
            />
            <input
              type="password"
              name="cvv"
              placeholder="CVV"
              value={cardDetails.cvv}
              onChange={handleCardChange}
              maxLength="3"
              required
            />
          </div>
        )}

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

        <button
          type="submit"
          disabled={
            isSubmitting ||
            quantityError ||
            (paymentMethod === "wallet" && !checkSufficientBalance())
          }
        >
          {isSubmitting
            ? "Processing Payment..."
            : `Place Order & Pay Rs. ${formData.price || "0"}`}
        </button>
      </form>
    </div>
  );
}

export default OrderPage;
