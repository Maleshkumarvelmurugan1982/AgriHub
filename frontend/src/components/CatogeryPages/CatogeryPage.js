import React, { useState, useEffect } from "react";
import "./CatogeryPage.css";
import Navbar from "../../components/NavbarRegistered/NavbarRegistered";
import FooterNew from "../../components/Footer/FooterNew";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

function CatogeryPage() {
  const [products, setProducts] = useState([]);
  const [catogery, setCatogery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = "";

        switch (catogery) {
          case "Veg":
            url = "https://agrihub-1.onrender.com/product/Vegetable";
            break;
          case "Fruit":
            url = "https://agrihub-1.onrender.com/product/fruit";
            break;
          case "Grain":
            url = "https://agrihub-1.onrender.com/product/Grain";
            break;
          case "Spices":
            url = "https://agrihub-1.onrender.com/product/spices";
            break;
          case "Other":
            url = "https://agrihub-1.onrender.com/product/other";
            break;
          default:
            break;
        }

        console.log(catogery);
        const response = await fetch(url);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      }
      /*

      try {
        const response_add = await fetch("https://agrihub-1.onrender.com/product/add");
        const data = await response_add.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      }
      */
    };

    fetchProducts();
  }, [catogery]);

  return (
    <div>
      <Navbar />
      <div className="nothing-cateogory-section"></div>
      <div className="search-item-container">
        <input
          type="text"
          placeholder="Search item..."
          className="search-item-input"
        />
        <button className="search-item-button">
          <FontAwesomeIcon icon={faSearch} />
        </button>
        <button className="add-new-item">Add Item</button>
      </div>
      <div className="all-products-container">
        {products.length > 0 ? (
          products.map((product) => (
            <div className="all-products-item" key={product._id}>
              <img src={product.productImage} alt={product.productName} />
              <p>{product.productName}</p>
            </div>
          ))
        ) : (
          <p>No item found.</p>
        )}
      </div>
      <div className="nothing-cateogory-pages-below-section"></div>
      <FooterNew />
    </div>
  );
}

export default CatogeryPage;
