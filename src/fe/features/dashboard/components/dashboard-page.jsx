import React, { useState } from 'react';
import { Camera, Search, Menu, Sparkles, X } from 'lucide-react';
import CameraScanner from '../../camera/camera-scanner';
import './dashboard-page.css';

export default function DashboardPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const openCamera = () => {
    setIsCameraOpen(true);
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
  };

  const handleScanComplete = (result) => {
    console.log("Scan complete:", result);
    closeCamera();
  };

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <Menu size={22} color="#2c3e35" />
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

        <button className="ask-button relative z-20" onClick={(e) => e.stopPropagation()}>
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
          
          <CameraScanner onScanComplete={handleScanComplete} />
        </div>
      )}
    </div>
  );
}
