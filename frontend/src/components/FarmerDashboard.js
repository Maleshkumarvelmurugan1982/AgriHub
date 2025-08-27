import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FarmerDashboard.css";

const FarmerDashboard = ({ farmerId }) => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    price: "",
    quantity: "",
    image: null,
  });

  // Fetch farmer products
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`http://localhost:8070/farmerProducts/${farmerId}`);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setNewProduct({ ...newProduct, [name]: files[0] });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("farmerId", farmerId);
    Object.keys(newProduct).forEach((key) => {
      formData.append(key, newProduct[key]);
    });

    try {
      await axios.post("http://localhost:8070/farmerProducts/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Product added!");
      setNewProduct({
        name: "",
        category: "",
        description: "",
        price: "",
        quantity: "",
        image: null,
      });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to add product");
    }
  };

  // Order a product
  const handleOrder = async (productId) => {
    const qty = prompt("Enter quantity to order:");
    if (!qty || isNaN(qty)) return;

    try {
      await axios.post(`http://localhost:8070/farmerProducts/order/${productId}`, {
        quantity: Number(qty),
      });
      alert("Order placed!");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to place order");
    }
  };

  return (
    <div className="farmer-dashboard">
      <h2>Farmer Dashboard</h2>

      {/* Add Product Form */}
      <form className="product-form" onSubmit={handleAddProduct}>
        <h3>Add New Product</h3>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={newProduct.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={newProduct.category}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={newProduct.description}
          onChange={handleChange}
          required
        ></textarea>
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={newProduct.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={newProduct.quantity}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          required
        />
        <button type="submit">Add Product</button>
      </form>

      {/* Products Grid */}
      <h3>My Products</h3>
      <div className="products-grid">
        {products.map((product) => (
          <div className="product-card" key={product._id}>
            {product.image && (
              <img
                src={`http://localhost:8070/uploads/${product.image}`}
                alt={product.name}
              />
            )}
            <h4>{product.name}</h4>
            <p>{product.category}</p>
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
            <p>Stock: {product.quantity}</p>
            <button onClick={() => handleOrder(product._id)}>Order</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmerDashboard;
