import React from 'react';
import { API_BASE_URL } from '../services/api';

export default function Navbar({ studentCount }) {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="logo-icon">🎓</span>
          <div>
            <h1>Student REST Client</h1>
            <p className="subtitle">SOA Lab 4 - React Web Client (Full CRUD)</p>
          </div>
        </div>
        <div className="navbar-info">
          <span className="api-badge">
            <span className="status-dot"></span> REST API: {API_BASE_URL}
          </span>
        </div>
      </div>
    </header>
  );
}
