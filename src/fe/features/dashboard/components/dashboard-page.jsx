import React, { useState } from "react";
import { Sparkles, X, Camera } from "lucide-react";

import CameraScanner from "@fe/features/camera/camera-scanner";
import "./dashboard-page.css";

export default function DashboardPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <main className="dashboard-container">
        {/* ── Hero Text ───────────────────────────────────────────────── */}
        <section className="hero-section">
          <span className="sub-tag">TODAY'S DISCOVERY</span>
          <h1 className="main-title">
            Living biodiversity <span className="status-dot" />
          </h1>
          <p className="status-text">Vellore, Tamil Nadu · AI active</p>
        </section>

        {/* ── Species Card ────────────────────────────────────────────── */}
        <div className="card-container" onClick={() => setIsCameraOpen(true)}>
          <img
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80"
            alt="Phyllanthus emblica"
            className="card-image"
          />

          <div className="camera-trigger-overlay">
            <Camera size={32} color="#ffffff" strokeWidth={1.5} />
          </div>

          {/* "Ask the guide" opens the global chat via the sidebar's state —
              the global App.jsx handles it, so we use a custom event here */}
          <button
            className="ask-button"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("aranya:open-chat"));
            }}
          >
            <Sparkles size={15} color="#4a5d4e" />
            <span>Ask the guide</span>
          </button>

          <div className="card-footer">
            <span className="species-tag">SPECIES RECOGNIZED</span>
            <h2 className="species-name">Phyllanthus emblica</h2>
            <p className="common-name">Indian gooseberry · Amla</p>
          </div>
        </div>
      </main>

      {/* ── Fullscreen Camera Overlay ────────────────────────────────── */}
      {isCameraOpen && (
        <div className="fullscreen-overlay">
          <button className="close-camera-button" onClick={() => setIsCameraOpen(false)}>
            <X size={24} color="#ffffff" />
          </button>
          <CameraScanner
            onScanComplete={(result) => console.log("Scan complete:", result)}
          />
        </div>
      )}
    </div>
  );
}
