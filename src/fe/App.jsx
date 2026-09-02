/**
 * App.jsx — Root application component.
 *
 * Renders the Dashboard feature for the Advaith-dashboard branch.
 * Replace with a router when the team assembles the full app.
 */
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import DashboardPage from "./features/dashboard/components/dashboard-page";
import MapPage from '@fe/features/map/components/map-page';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f5f3eb]">
        {/* Simple Top Navigation Bar */}
        <nav style={{
  display: "flex",
  gap: "1rem",
  padding: "1rem 1.5rem",
  backgroundColor: "#ede9dc",
  borderBottom: "1px solid rgba(42, 62, 52, 0.1)",
  fontFamily: "monospace",
  fontSize: "0.875rem",
  fontWeight: "bold"
}}>
  <Link to="/" style={{ color: "#2a3e34", textDecoration: "none" }}>🍃 Dashboard</Link>
  <Link to="/map" style={{ color: "#2a3e34", textDecoration: "none" }}>🗺️ Biodiversity Map</Link>
</nav>

        {/* Page Routes */}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </div>
    </Router>
  );
}
