import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./OrderPage.css";

function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [products, setProducts] = useState([
    {
      id: Date.now(),
      productImage: queryParams.get("image") || "",
      productName: queryParams.get("item") || "",
      quantity: "",
      unitPrice: 0,
      availableQuantity: 0,
      totalPrice: 0,
      quantityError: "",
      productId: "",
      farmerId: "",
      isInitial: true,
    },
  ]);

  const [formData, setFormData] = useState({
    district: "",
    company: "",
    mobile: "",
    email: "",
    address: "",
    expireDate: "",
  });

  const [sellerId, setSellerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [allAvailableProducts, setAllAvailableProducts] = useState([]);

  // Backend API URL
  const BASE_URL = "https://agrihub-2.onrender.com";

  const handleBackClick = () => {
    navigate("/regseller");
  };

  const handleCancelOrder = () => {
    const hasData = products.some(p => p.quantity || p.productName);
    const hasFormData = Object.values(formData).some(val => val);

    if (hasData || hasFormData) {
      const confirmCancel = window.confirm(
        "Are you sure you want to cancel this order? All entered data will be lost."
      );
      if (!confirmCancel) return;
    }

    setProducts([
      {
        id: Date.now(),
        productImage: "",
        productName: "",
        quantity: "",
        unitPrice: 0,
        availableQuantity: 0,
        totalPrice: 0,
        quantityError: "",
        productId: "",
        farmerId: "",
        isInitial: true,
      },
    ]);
    setFormData({
      district: "",
      company: "",
      mobile: "",
      email: "",
      address: "",
      expireDate: "",
    });

    alert("Order cancelled successfully!");
    navigate("/regseller");
  };

  // Only fetch seller info, redirect to login if not found
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

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch(`${BASE_URL}/product/category/vegetable`);
        if (!response.ok) return;
        
        const data = await response.json();
        const availableProducts = data.filter(p => p.quantity > 0);
        setAllAvailableProducts(availableProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const productNameFromUrl = queryParams.get("item");
    const priceFromUrl = queryParams.get("price");

    if (!productNameFromUrl) return;

    fetch(`${BASE_URL}/product/name/${productNameFromUrl}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((product) => {
        if (!product) return;

        const farmerIdValue =
          typeof product.farmerId === "object"
            ? product.farmerId._id
            : product.farmerId || product.userId;

        setProducts((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            productName: product.productName || productNameFromUrl,
            unitPrice: Number(product.price || priceFromUrl || 0),
            availableQuantity: Number(product.quantity || 0),
            productId: product._id || "",
            farmerId: farmerIdValue || "",
            productImage: product.productImage || updated[0].productImage,
          };
          return updated;
        });
      })
      .catch(console.error);
  }, [queryParams]);

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        productImage: "",
        productName: "",
        quantity: "",
        unitPrice: 0,
        availableQuantity: 0,
        totalPrice: 0,
        quantityError: "",
        productId: "",
        farmerId: "",
        isInitial: false,
      },
    ]);
  };

  const removeProduct = (id) => {
    const productToRemove = products.find(p => p.id === id);
    if (productToRemove && productToRemove.isInitial) {
      alert("Cannot remove the initial product!");
      return;
    }
    if (products.length === 1) {
      alert("At least one product is required!");
      return;
    }
    const confirmRemove = window.confirm("Are you sure you want to remove this product?");
    if (!confirmRemove) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleProductSelect = (index, selectedProductName) => {
    if (!selectedProductName) return;

    const selectedProduct = allAvailableProducts.find(
      p => p.productName === selectedProductName
    );
    if (!selectedProduct) return;

    const farmerIdValue =
      typeof selectedProduct.farmerId === "object"
        ? selectedProduct.farmerId._id
        : selectedProduct.farmerId || selectedProduct.userId;

    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productName: selectedProduct.productName,
        unitPrice: Number(selectedProduct.price || 0),
        availableQuantity: Number(selectedProduct.quantity || 0),
        productId: selectedProduct._id || "",
        farmerId: farmerIdValue || "",
        productImage: selectedProduct.productImage || "",
        quantity: "",
        totalPrice: 0,
        quantityError: "",
      };
      return updated;
    });
  };

  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      const product = updated[index];

      if (field === "quantity") {
        const quantity = Number(value) || 0;
        const error =
          quantity > product.availableQuantity
            ? `Only ${product.availableQuantity} kg available!`
            : "";
        const totalPrice = quantity * product.unitPrice;

        updated[index] = {
          ...product,
          quantity: value,
          quantityError: error,
          totalPrice: totalPrice,
        };
      }

      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotalPrice = () => {
    return products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  };

  const checkSufficientBalance = () => {
    const totalPrice = calculateTotalPrice();
    return walletBalance >= totalPrice;
  };

  // Only handles login redirection on protected route, not in form/UI
  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasErrors = products.some((p) => p.quantityError);
    if (hasErrors) return alert("Please fix quantity errors!");

    const invalidProduct = products.find(
      (p) => !p.productName || !p.quantity || !p.productId
    );
    if (invalidProduct) {
      return alert("Please complete all product details!");
    }

    if (
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

    const totalPrice = calculateTotalPrice();

    if (!checkSufficientBalance()) {
      return alert(
        `Insufficient wallet balance!\nOrder Total: Rs.${totalPrice.toFixed(
          2
        )}\nWallet: Rs.${walletBalance.toFixed(2)}`
      );
    }

    setIsSubmitting(true);

    try {
      const orderPromises = products.map(async (product) => {
        const orderData = {
          name: formData.company,
          item: product.productName,
          productImage: product.productImage,
          category: "vegetable",
          quantity: Number(product.quantity),
          price: product.totalPrice,
          district: formData.district,
          company: formData.company,
          mobile: formData.mobile,
          email: formData.email,
          address: formData.address,
          postedDate: new Date().toISOString().split("T")[0],
          expireDate: formData.expireDate,
          sellerId,
          farmerId: product.farmerId,
          paymentMethod: "wallet",
          paymentStatus: "completed",
          isPaid: true,
        };

        const res = await fetch(`${BASE_URL}/sellerorder/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Order failed");

        try {
          await fetch(`${BASE_URL}/product/${product.productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quantity: product.availableQuantity - Number(product.quantity),
            }),
          });
        } catch (err) {
          console.error("Error updating product quantity:", err);
        }

        return result;
      });

      await Promise.all(orderPromises);

      const newBalance = walletBalance - totalPrice;
      setWalletBalance(newBalance);

      const productNames = products.map((p) => p.productName).join(", ");
      try {
        await fetch(`${BASE_URL}/wallet/deduct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sellerId,
            amount: totalPrice,
            description: `Order payment for ${productNames}`,
            paymentMethod: "wallet",
          }),
        });
      } catch (err) {
        console.error("Error creating wallet transaction:", err);
      }

      alert(
        `${products.length} order(s) placed successfully!\nTotal Amount Paid: Rs.${totalPrice.toFixed(
          2
        )}\nPayment Method: Wallet`
      );

      navigate("/regseller");
    } catch (err) {
      console.error("Error submitting order:", err);
      alert(`Failed to place order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // NO extra buttons for government, registration or login!
  return (
    <div className="form-container">
      <h3>Place New Order</h3>
      <form onSubmit={handleSubmit}>
        <div className="products-section">
          <div className="products-header">
            <h4>Products ({products.length})</h4>
            <button
              type="button"
              onClick={addProduct}
              className="add-product-btn"
            >
              + Add Another Product
            </button>
          </div>

          {products.map((product, index) => (
            <div key={product.id} className="product-item-order">
              <div className="product-header">
                <h5>Product {index + 1}</h5>
                {!product.isInitial && (
                  <button
                    type="button"
                    onClick={() => removeProduct(product.id)}
                    className="remove-product-btn"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {product.productImage && (
                <div className="image-preview">
                  <img
                    src={product.productImage}
                    alt="Product"
                    onError={(e) =>
                      (e.target.src =
                        "https://via.placeholder.com/200?text=No+Image")
                    }
                  />
                </div>
              )}

              <div className="input-field-container">
                <p>Product Name *</p>
              </div>
              <select
                value={product.productName}
                onChange={(e) => handleProductSelect(index, e.target.value)}
                required
                className="product-select"
              >
                <option value="">-- Select Product --</option>
                {allAvailableProducts.map((p) => (
                  <option key={p._id} value={p.productName}>
                    {p.productName} (Rs.{p.price} - {p.quantity}kg available)
                  </option>
                ))}
              </select>

              {product.productId && (
                <>
                  <div className="input-field-container">
                    <p>Unit Price (Rs.)</p>
                  </div>
                  <div className="category-display">
                    <h4>Rs. {product.unitPrice.toFixed(2)}</h4>
                  </div>

                  <div className="input-field-container">
                    <p>Available Stock</p>
                  </div>
                  <div className="category-display">
                    <h4>{product.availableQuantity} kg</h4>
                  </div>

                  <div className="input-field-container">
                    <p>Quantity (kg) *</p>
                  </div>
                  <input
                    type="number"
                    value={product.quantity}
                    onChange={(e) =>
                      handleProductChange(index, "quantity", e.target.value)
                    }
                    min="0.1"
                    step="0.1"
                    max={product.availableQuantity}
                    className={product.quantityError ? "input-error" : ""}
                    required
                  />
                  {product.quantityError && (
                    <div className="error-message">{product.quantityError}</div>
                  )}

                  <div className="input-field-container">
                    <p>Product Total (Rs.)</p>
                  </div>
                  <div className="category-display">
                    <h4>Rs. {product.totalPrice.toFixed(2)}</h4>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grand-total">
          <div className="input-field-container">
            <p><strong>Order Total (Rs.)</strong></p>
          </div>
          <div className="category-display total-highlight">
            <h3>Rs. {calculateTotalPrice().toFixed(2)}</h3>
          </div>
        </div>

        <div className="input-field-container">
          <p>Payment Method</p>
        </div>
        <div className="category-display">
          <h4>Wallet (Balance: Rs. {walletBalance.toFixed(2)})</h4>
        </div>

        <div className="input-field-container">
          <p><strong>Delivery Details</strong></p>
        </div>
        <input
          type="text"
          name="district"
          placeholder="District *"
          value={formData.district}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="company"
          placeholder="Company *"
          value={formData.company}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile *"
          value={formData.mobile}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email *"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <textarea
          name="address"
          placeholder="Address *"
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
            products.some((p) => p.quantityError) ||
            !checkSufficientBalance()
          }
        >
          {isSubmitting
            ? "Processing Payment..."
            : `Place Order & Pay Rs. ${calculateTotalPrice().toFixed(2)}`}
        </button>

        <button
          type="button"
          onClick={handleCancelOrder}
          className="cancel-order-button"
        >
          Cancel Order
        </button>

        <button
          type="button"
          onClick={handleBackClick}
          className="back-order-button"
        >
          Back
        </button>
      </form>
    </div>
  );
}

export default OrderPage;
