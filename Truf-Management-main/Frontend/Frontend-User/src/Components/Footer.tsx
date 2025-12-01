import React from "react";
import "../styles/Footer.css";

// Logo image
import logo from "../assets/logo.svg";

// Social and contact icons
import {
  FaFacebookF,
  FaInstagram,
  FaPhoneAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";

// Footer functional component
const Footer: React.FC = () => {
  return (
    <footer className="turf-footer">
      <div className="footer-container">
        {/* Top section of the footer */}
        <div className="footer-top">

          {/* Logo Section (Left Side) */}
          <div className="footer-section logo-section">
            <div className="footer-logo">
              <img src={logo} alt="Turf Zone Logo" className="logo-img" />
            </div>
          </div>

          {/* Contact & Social Media Section (Right Side) */}
          <div className="footer-section contact-section">
            <h3 className="section-title">Get in Touch</h3>
            <div className="social-icons">

              {/* Phone Call Link */}
              <a href="tel:+919363712134" title="Call">
                <FaPhoneAlt />
              </a>

              {/* WhatsApp Chat Link */}
              <a
                href="https://wa.me/919363712134"
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
              >
                <FaWhatsapp />
              </a>

              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=turrfzone7@gmail.com&su=Booking%20Inquiry&body=Hello%20Turf%20Zone,"
                target="_blank"
                rel="noreferrer"
                title="Email"
              >
                <MdEmail />
              </a>

              {/* Facebook Page Link */}
              <a
                href="https://www.facebook.com/Turrfzone7"
                target="_blank"
                rel="noreferrer"
                title="Facebook"
              >
                <FaFacebookF />
              </a>

              {/* Instagram Profile Link */}
              <a
                href="https://instagram.com/turrfzone7"
                target="_blank"
                rel="noreferrer"
                title="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        {/* Map Section (Bottom Full Width) */}
        <div className="footer-map">
          <h3 className="section-title">Our Location :</h3>

          {/* Clickable address linking to Google Maps */}
          <a
            href="https://maps.app.goo.gl/C4sJUz4TwWfzKVuHA"
            target="_blank"
            rel="noreferrer"
            className="brand-address"
          >
            Turrf Zone, 7H7V+Q6, Perundurai, Tamil Nadu 638052
          </a>

          {/* Embedded Google Maps Iframe */}
          <iframe
            title="TURRF ZONE Location"
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15651.760976926118!2d77.590881!3d11.265803!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba96d00619941b3%3A0x66cda023ab54d61d!2sTURRF%20ZONE!5e0!3m2!1sen!2sin!4v1752647013881!5m2!1sen!2sin"
            width="100%"
            height="200"
            style={{ border: 0, borderRadius: "8px" }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
