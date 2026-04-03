import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="main-navbar">
      {/* Brand */}
      <div className="nav-brand" onClick={() => { navigate("/"); closeMenu(); }}>
        <div className="nav-logo-icon">H</div>
        <div className="nav-logo-text">
          Hu<span>koom</span>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${isOpen ? "open" : ""}`} id="nav-links">
        <li><Link to="/" onClick={closeMenu}>Home</Link></li>
        <li><Link to="/about" onClick={closeMenu}>About</Link></li>
        <li><Link to="/contact" onClick={closeMenu}>Contact</Link></li>
        <li><Link to="/profile" onClick={closeMenu}>Profile</Link></li>
        <li><Link to="/aiagent" onClick={closeMenu}>AI Agent</Link></li>
        <li>
          <button className="nav-cta" onClick={() => { navigate("/"); closeMenu(); }}>
            Get Started
          </button>
        </li>
      </ul>

      {/* Mobile Toggle */}
      <div
        className={`nav-toggle ${isOpen ? "active" : ""}`}
        onClick={toggleMenu}
        id="nav-toggle"
        aria-label="Toggle navigation menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  );
}

export default Navbar;