import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        AI Cold Email Factory
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/setup">Setup</NavLink>
        <NavLink to="/generate">Generate</NavLink>
        <NavLink to="/batches">Batches</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
