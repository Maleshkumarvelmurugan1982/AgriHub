
import React from "react";
import { Link } from "react-router-dom";
import "./RegCategories.css";

function Categories() {
  return (
    <div>
      <div className="image-row" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}>
        <Link to="/regvegetable">
          <img
            src={process.env.PUBLIC_URL + "/Categories/veg.png"}
            alt="Vegetable"
            className="image"
            style={{
              transition: 'transform 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        </Link>
      </div>
    </div>
  );
}

export default Categories;