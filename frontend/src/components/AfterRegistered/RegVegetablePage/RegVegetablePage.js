import React, { useState, useEffect } from "react";
import "./RegVegetablePage.css";
import Navbar from "../../NavbarRegistered/NavbarRegistered";
import FooterNew from "../../Footer/FooterNew";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSquarePlus, faCartPlus, faTimes } from "@fortawesome/free-solid-svg-icons";

function RegVegetablePage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    quantity: "",
    price: "",
    productImage: null,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:8070/product/category/vegetable");
        if (!response.ok) {
          console.error("Error fetching products:", response.status, response.statusText);
          setProducts([]);
          setFilteredProducts([]);
          return;
        }
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setFilteredProducts([]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter((product) =>
      product.productName.toLowerCase().includes(searchQuery.toLowerCase())
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
    try {
      const formData = new FormData();
      formData.append("productName", newProduct.productName);
      formData.append("quantity", newProduct.quantity);
      formData.append("price", newProduct.price);
      formData.append("category", "vegetable");
      if (newProduct.productImage) {
        formData.append("productImage", newProduct.productImage);
      }

      const response = await fetch("http://localhost:8070/product/add", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Failed to add product:", response.status, response.statusText);
        return;
      }

      const addedProduct = await response.json();
      const updatedProducts = [...products, addedProduct];
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setIsModalOpen(false);
      setNewProduct({ productName: "", quantity: "", price: "", productImage: null });
    } catch (err) {
      console.error("Error adding product:", err);
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
      const response = await fetch(`http://localhost:8070/product/${editProduct._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: editProduct.quantity,
          price: editProduct.price,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update product");
        return;
      }

      const updated = await response.json();
      const updatedProducts = products.map((p) =>
        p._id === updated._id ? updated : p
      );
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      setIsEditModalOpen(false);
      setEditProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`http://localhost:8070/product/${productId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error("Failed to delete product");
        return;
      }
      const updatedProducts = products.filter((p) => p._id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="nothing-cateogory-pages-veg"></div>

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

        <button className="add-products-button" onClick={() => setIsModalOpen(true)}>
          <FontAwesomeIcon icon={faSquarePlus} /> Add New Product
        </button>

        <button
          className="make-order-button-veg"
          onClick={() => (window.location.href = "http://localhost:3000/order")}
        >
          <FontAwesomeIcon icon={faCartPlus} /> Make an Order
        </button>
      </div>

      <div className="products-container-veg">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div className="products-item-veg" key={product._id}>
              <a
                href={`/order?image=${encodeURIComponent(product.productImage)}&item=${encodeURIComponent(
                  product.productName
                )}`}
                className="product-item-veg-link"
              >
                <img
                  src={`http://localhost:8070${product.productImage}`}
                  alt={product.productName}
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    outline: "none",
                    boxShadow: "none",
                  }}
                />
                <p>{product.productName}</p>
                <p>Qty: {product.quantity}</p>
                <p>Price: ${product.price}</p>
              </a>
              <button onClick={() => handleEditClick(product)}>Edit</button>
              <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
            </div>
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setIsModalOpen(false)} />
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct}>
              <label>Product Name:</label>
              <input
                type="text"
                name="productName"
                value={newProduct.productName}
                onChange={handleInputChange}
                required
              />

              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={newProduct.quantity}
                onChange={handleInputChange}
                required
              />

              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={handleInputChange}
                required
              />

              <label>Image:</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />

              <button type="submit">Add Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FontAwesomeIcon icon={faTimes} className="close-icon" onClick={() => setIsEditModalOpen(false)} />
            <h2>Edit Product</h2>
            <form onSubmit={handleUpdateProduct}>
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={editProduct.quantity}
                onChange={handleEditInputChange}
                required
              />
              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={editProduct.price}
                onChange={handleEditInputChange}
                required
              />
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
