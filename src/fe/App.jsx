/**
 * App.jsx — Root application component.
 * Global sidebar wraps all routes so the hamburger menu is always accessible.
 */
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Menu, X, MessageSquare, MapPin, Award, Camera, Leaf, User } from "lucide-react";

import DashboardPage from "./features/dashboard/components/dashboard-page";
import MapPage from "@fe/features/map/components/map-page";
import BotanistChatWindow from "@fe/features/botanist_chat/components/botanist-chat-window";
import GamificationPage from "@fe/features/gamification/components/gamification-page";
import "./app-layout.css";

function AppLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Listen for "Ask the guide" button on the dashboard card
  useEffect(() => {
    const handler = () => setIsChatOpen(true);
    window.addEventListener("aranya:open-chat", handler);
    return () => window.removeEventListener("aranya:open-chat", handler);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  const goTo = (path) => {
    closeSidebar();
    navigate(path);
  };

  return (
    <>
      {/* ── Global Sidebar ─────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div className="agl-sidebar-overlay" onClick={closeSidebar}>
          <aside className="agl-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="agl-sidebar-header">
              <div className="agl-sidebar-brand">
                <div className="agl-brand-badge">A</div>
                <span className="agl-brand-name">ARanya</span>
              </div>
              <button className="agl-close-btn" onClick={closeSidebar} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="agl-sidebar-nav">
              <button className="agl-feature-btn" onClick={() => { closeSidebar(); setIsChatOpen(true); }}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #2a3e34, #4a7c59)" }}>
                  <MessageSquare size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Botanist Chat</span>
                  <span className="agl-feature-desc">Ask the AI plant guide</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/map")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #5a3e20, #a07040)" }}>
                  <MapPin size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Species Map</span>
                  <span className="agl-feature-desc">Explore local biodiversity</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/achievements")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #8a3e2a, #c07050)" }}>
                  <Award size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Achievements</span>
                  <span className="agl-feature-desc">Your discovery milestones</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #1a3a50, #2a6080)" }}>
                  <Camera size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">AR Scanner</span>
                  <span className="agl-feature-desc">Identify plants in real-time</span>
                </div>
              </button>
            </nav>

            <div className="agl-sidebar-footer">
              <Leaf size={14} color="#a08355" />
              <span>ARanya · Biodiversity OS</span>
            </div>
          </aside>
        </div>
      )}

      {/* ── Global Top Bar ─────────────────────────────────────────── */}
      <header className="agl-topbar">
        <div className="agl-topbar-left">
          <button className="agl-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} color="#2a3e34" />
          </button>
          <button className="agl-brand" onClick={() => goTo("/")} aria-label="Go home">
            <div className="agl-brand-badge">A</div>
            <span className="agl-brand-name">ARanya</span>
          </button>
        </div>
        <button className="agl-profile-btn" onClick={() => goTo("/achievements")} aria-label="Profile">
          <User size={18} color="#2a3e34" />
        </button>
      </header>

      {/* ── Page Content (padded below fixed topbar) ──────────────── */}
      <main className="agl-page-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/achievements" element={<GamificationPage />} />
        </Routes>
      </main>

      {/* ── Global Botanist Chat Modal ─────────────────────────────── */}
      <BotanistChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
