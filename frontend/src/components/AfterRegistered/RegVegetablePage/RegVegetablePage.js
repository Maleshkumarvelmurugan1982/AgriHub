import React, { useState, useEffect } from "react";
import "./RegVegetablePage.css";
import Navbar from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSquarePlus, faCartPlus, faTimes, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function RegVegetablePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [userType, setUserType] = useState(""); // 'farmer' or 'seller'
  const [newProduct, setNewProduct] = useState({
    productName: "",
    quantity: "",
    price: "",
    productImage: null,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const BASE_URL = "http://localhost:8070";

  const handleBackClick = () => {
    if (userType === "farmer") {
      navigate("/regfarmer");
    } else if (userType === "seller") {
      navigate("/regseller");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("Please login first");
          return;
        }

        try {
          const farmerRes = await fetch(`${BASE_URL}/farmer/userdata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const farmerData = await farmerRes.json();
          if (farmerData.status === "ok") {
            setFarmerId(farmerData.data._id);
            setUserType("farmer");
            return;
          }
        } catch {}

        try {
          const sellerRes = await fetch(`${BASE_URL}/seller/userdata`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const sellerData = await sellerRes.json();
          if (sellerData.status === "ok") {
            setSellerId(sellerData.data._id);
            setUserType("seller");
            return;
          }
        } catch {}

        alert("Unable to identify user type. Please login again.");
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!userType) return;

    const fetchProducts = async () => {
      try {
        let response;
        if (userType === "farmer") {
          if (!farmerId) return;
          response = await fetch(`${BASE_URL}/product/farmer/${farmerId}/category/vegetable`);
        } else if (userType === "seller") {
          response = await fetch(`${BASE_URL}/product/category/vegetable`);
        }

        if (!response.ok) {
          setProducts([]);
          setFilteredProducts([]);
          return;
        }

        const data = await response.json();
        if (userType === "seller") {
          const availableProducts = data.filter(p => p.quantity > 0);
          setProducts(availableProducts);
          setFilteredProducts(availableProducts);
        } else {
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch (error) {
        setProducts([]);
        setFilteredProducts([]);
      }
    };

    fetchProducts();
  }, [userType, farmerId]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.productName && product.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewProduct({ ...newProduct, productImage: e.target.files[0] });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!farmerId) return alert("Farmer ID not found. Please login again.");

    try {
      const formData = new FormData();
      formData.append("productName", newProduct.productName);
      formData.append("quantity", newProduct.quantity);
      formData.append("price", newProduct.price);
      formData.append("category", "vegetable");
      formData.append("farmerId", farmerId);
      if (newProduct.productImage) formData.append("productImage", newProduct.productImage);

      const response = await fetch(`${BASE_URL}/product/add`, { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        return alert(`Failed to add product: ${errorData.message || 'Unknown error'}`);
      }

      const addedProduct = await response.json();
      const updatedProducts = [...products, addedProduct];
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setIsModalOpen(false);
      setNewProduct({ productName: "", quantity: "", price: "", productImage: null });
      alert("Product added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error adding product. Please try again.");
    }
  };

  const handleEditClick = (product) => {
    setEditProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProduct({ ...editProduct, [name]: value });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/product/${editProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: editProduct.quantity, price: editProduct.price }),
      });
      if (!response.ok) return alert("Failed to update product");

      const updated = await response.json();
      const updatedProducts = products.map(p => p._id === updated._id ? updated : p);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setIsEditModalOpen(false);
      setEditProduct(null);
      alert("Product updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(`${BASE_URL}/product/${productId}`, { method: "DELETE" });
      if (!response.ok) return alert("Failed to delete product");

      const updatedProducts = products.filter(p => p._id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      alert("Product deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting product. Please try again.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="nothing-cateogory-pages-veg"></div>

      {userType && (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={handleBackClick}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: '600',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#5a6268'; e.target.style.transform = 'translateX(-5px)'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = '#6c757d'; e.target.style.transform = 'translateX(0)'; }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to {userType === "farmer" ? "Farmer" : "Seller"} Page
          </button>
        </div>
      )}

      <div className="search-container-veg">
        <input
          type="text"
          placeholder="Search products..."
          className="search-input-veg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-button-veg">
          <FontAwesomeIcon icon={faSearch} />
        </button>

        {userType === "farmer" && (
          <button className="add-products-button" onClick={() => setIsModalOpen(true)}>
            <FontAwesomeIcon icon={faSquarePlus} /> Add New Product
          </button>
        )}
        {userType === "seller" && (
          <button className="make-order-button-veg" onClick={() => (window.location.href = "/order")}>
            <FontAwesomeIcon icon={faCartPlus} /> Make an Order
          </button>
        )}
      </div>

      <div className="products-container-veg">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div className="products-item-veg" key={product._id}>
              {userType === "seller" ? (
                <a
                  href={`/order?image=${encodeURIComponent(product.productImage)}&item=${encodeURIComponent(product.productName)}`}
                  className="product-item-veg-link"
                >
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                  />
                  <p><strong>{product.productName}</strong></p>
                  <p>Qty: {product.quantity} kg</p>
                  <p>Price: Rs.{product.price}</p>
                </a>
              ) : (
                <div className="product-item-veg-view">
                  <img
                    src={product.productImage}
                    alt={product.productName}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "8px" }}
                  />
                  <p><strong>{product.productName}</strong></p>
                  <p>Qty: {product.quantity} kg</p>
                  <p>Price: Rs.{product.price}</p>
                </div>
              )}

              {userType === "farmer" && (
                <div className="product-actions">
                  <button onClick={() => handleEditClick(product)}>Edit</button>
                  <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>{userType === "farmer" ? "No products found. Add your first product!" : "No products available for ordering."}</p>
        )}
      </div>

      {isModalOpen && userType === "farmer" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setIsModalOpen(false)} />
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <label>Product Name:</label>
              <input type="text" name="productName" value={newProduct.productName} onChange={handleInputChange} required />
              <label>Quantity (kg):</label>
              <input type="number" name="quantity" value={newProduct.quantity} onChange={handleInputChange} min="0" step="0.1" required />
              <label>Price (Rs.):</label>
              <input type="number" name="price" value={newProduct.price} onChange={handleInputChange} min="0" step="0.01" required />
              <label>Image:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
              <button type="submit">Add Product</button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editProduct && userType === "farmer" && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setIsEditModalOpen(false)} />
            <h2>Edit Product</h2>
            <form onSubmit={handleUpdateProduct}>
              <label>Product Name:</label>
              <input type="text" value={editProduct.productName} disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
              <label>Quantity (kg):</label>
              <input type="number" name="quantity" value={editProduct.quantity} onChange={handleEditInputChange} min="0" step="0.1" required />
              <label>Price (Rs.):</label>
              <input type="number" name="price" value={editProduct.price} onChange={handleEditInputChange} min="0" step="0.01" required />
              <button type="submit">Update Product</button>
            </form>
          </div>
        </div>
      )}

      <div className="nothing-cateogory-pages-below-veg"></div>
      <FooterNew />
    </div>
  );
}

export default RegVegetablePage;
