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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch only vegetable products
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
      formData.append("category", "vegetable"); // ensure category is vegetable
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
                  src={`http://localhost:8070/${product.productImage}`}
                  alt={product.productName}
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    outline: "none",   // remove blue shadow
                    boxShadow: "none", // remove any shadow
                  }}
                />
                <p>{product.productName}</p>
                <p>Qty: {product.quantity}</p>
                <p>Price: ${product.price}</p>
              </a>
            </div>
          ))
        ) : (
          <p>No products found.</p>
        )}
      </div>

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

      <div className="nothing-cateogory-pages-below-veg"></div>
      <FooterNew />
    </div>
  );
}

export default RegVegetablePage;
