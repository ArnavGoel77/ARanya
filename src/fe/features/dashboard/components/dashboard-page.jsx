import React, { useState } from "react";
import { 
  Camera, Search, Menu, Sparkles, X, 
  Eye, Info, MessageSquare, Award, MapPin 
} from "lucide-react";

import CameraScanner from "@fe/features/camera/camera-scanner";
import "./dashboard-page.css";

export default function DashboardPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  // Default to false so sidebar is hidden until the 3-line menu is clicked
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  const openCamera = () => setIsCameraOpen(true);
  const closeCamera = () => setIsCameraOpen(false);

  const handleTriggerFeature = (featureName) => {
    setActiveFeature(featureName);
    console.log(`UI Triggered feature: ${featureName}`);
    setIsSidebarOpen(false); // Auto-close drawer on selection
  };

  return (
    <div className="dashboard-layout">
      {/* Pop-up Drawer Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}>
          <aside className="features-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <span className="sidebar-title">BE FEATURES</span>
              <button 
                className="close-sidebar-btn" 
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="sidebar-nav">
              <button 
                className="feature-btn"
                onClick={() => handleTriggerFeature('vision')}
              >
                <Eye size={18} />
                <span>1. Vision Identify</span>
              </button>

              <button 
                className="feature-btn"
                onClick={() => handleTriggerFeature('ar')}
              >
                <Info size={18} />
                <span>2. AR Metadata</span>
              </button>

              <button 
                className="feature-btn"
                onClick={() => handleTriggerFeature('chat')}
              >
                <MessageSquare size={18} />
                <span>3. Botanist Chat</span>
              </button>

              <button 
                className="feature-btn"
                onClick={() => handleTriggerFeature('gamification')}
              >
                <Award size={18} />
                <span>4. Gamification</span>
              </button>

              <button 
                className="feature-btn"
                onClick={() => handleTriggerFeature('location')}
              >
                <MapPin size={18} />
                <span>5. Nearby Species</span>
              </button>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Dashboard UI */}
      <main className="dashboard-container">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="toggle-sidebar-btn" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Features Menu"
            >
              <Menu size={22} color="#2c3e35" />
            </button>
            <div className="logo-badge">🍃</div>
            <span className="brand-title">FIELDNOTE</span>
          </div>
          <Search size={20} color="#2c3e35" />
        </header>

        {/* Hero Section */}
        <div className="hero-section">
          <span className="sub-tag">LIVE FIELD SCAN</span>
          <h1 className="main-title">
            <span>Look closer.</span>
            <span className="status-dot" />
            <span className="status-text">Ready to identify</span>
          </h1>
        </div>

        {/* Species Card */}
        <div className="card-container cursor-pointer" onClick={openCamera}>
          <img
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80"
            alt="Phyllanthus emblica"
            className="card-image"
          />

          <button 
            className="ask-button relative z-20" 
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerFeature('chat');
            }}
          >
            <Sparkles size={16} color="#4a5d4e" />
            <span>Ask the guide</span>
          </button>

          <div className="card-footer">
            <span className="species-tag">SPECIES RECOGNIZED</span>
            <h2 className="species-name">Phyllanthus emblica</h2>
            <p className="common-name">Indian gooseberry · Amla</p>
          </div>

          <button className="camera-fab" aria-label="Open Camera">
            <Camera size={24} color="#ffffff" />
          </button>
        </div>

        {/* Fullscreen Camera Overlay */}
        {isCameraOpen && (
          <div className="fullscreen-overlay">
            <button className="close-camera-button" onClick={closeCamera}>
              <X size={24} color="#ffffff" />
            </button>
            <CameraScanner 
              onScanComplete={(result) => console.log("Scan complete:", result)} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
