import React from "react";
import "./footerNew.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebook,
  faTwitter,
  faGoogle,
  faInstagram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

import { FaHome, FaEnvelope, FaPhone, FaPrint } from "react-icons/fa";

function FooterNew() {
  return (
    <footer>
      <div className="footer-col">
        <h4>Categories</h4>
        <ul>
          <li>
            <a href="/farmer">Farmer Section</a>
          </li>
          <li>
            <a href="/seller">Seller Section</a>
          </li>
          <li>
            <a href="/deliveryman">Deliveryman Section</a>
          </li>
          <li>
            <a href="/GovernmentPage">Government Section</a>
          </li>

        </ul>
      </div>
      <div className="footer-col">
        <h4>Useful Links</h4>
        <ul>
          <li>
            <a href="#">About Company</a>
          </li>
          <li>
            <a href="#">Terms & Conditions</a>
          </li>
          <li>
            <a href="#">Register Now</a>
          </li>
          <li>
            <a href="#">Help</a>
          </li>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Legal</h4>
        <ul>
          <p>
            <FaHome className="fas fa-home me-3" /> TamilNadu ,India
          </p>
          <p>
            <FaEnvelope className="fas fa-envelope me-3" />
            malesh26032006@gmail.com
          </p>
          <p>
            <FaPhone className="fas fa-phone me-3" /> +91 9942371733
          </p>
          <p>
            <FaPrint className="fas fa-print me-3" /> +91 9865654033
          </p>
        </ul>
      </div>
      <div className="footer-col">
        <h4>Contact Us</h4>
        <div className="links">
          <a
            href="https://x.com/VMKCreations1"
            className="icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faTwitter} />
          </a>
          <a
            href="https://www.instagram.com/thalapathy_rasigan1277/"
            className="icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a
            href="https://www.linkedin.com/in/maleshkumar-v-8311aa333/"
            className="icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FontAwesomeIcon icon={faLinkedin} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default FooterNew;
