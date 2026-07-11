import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        AI Cold Email Factory
      </NavLink>
      <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
        <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
      </button>
      <div className={`navbar-links ${menuOpen ? 'navbar-links-open' : ''}`}>
        <NavLink to="/" end onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
        <NavLink to="/setup" onClick={() => setMenuOpen(false)}>Setup</NavLink>
        <NavLink to="/generate" onClick={() => setMenuOpen(false)}>Generate</NavLink>
        <NavLink to="/batches" onClick={() => setMenuOpen(false)}>Batches</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
