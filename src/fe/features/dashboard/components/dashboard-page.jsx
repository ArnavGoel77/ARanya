import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Camera, MapPin } from "lucide-react";

import CameraScanner from "@fe/features/camera/camera-scanner";
import { useAuth } from "@fe/contexts/AuthContext";
import "./dashboard-page.css";

export default function DashboardPage() {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const scannerRef = useRef(null);

  const closeCamera = () => {
    // Explicitly stop all camera tracks before unmounting so the
    // hardware indicator light turns off immediately.
    scannerRef.current?.stopStream();
    setIsCameraOpen(false);
    setIsCameraModalOpen(false);
  };
  const [locationText, setLocationText] = useState("Locating...");
  const [currentCoords, setCurrentCoords] = useState({ latitude: 0, longitude: 0 });
  const { currentUser } = useAuth();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCurrentCoords({ latitude, longitude });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.village || "Unknown City";
            const state = data.address.state || "Unknown State";
            setLocationText(`${city}, ${state}`);
          } catch (error) {
            console.error("Error fetching location name:", error);
            setLocationText("Location unknown");
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationText("Location access denied");
        }
      );
    } else {
      setLocationText("Geolocation unavailable");
    }
  }, []);

  const handleScanComplete = async (result) => {
    console.log("Scan complete:", result);
    if (!currentUser || !result.identified_plant_id) return;
    
    try {
      const response = await fetch(`/api/v1/users/${currentUser.uid}/discoveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: result.identified_plant_id,
          location: currentCoords
        })
      });
      const data = await response.json();
      console.log("Discovery logged successfully:", data);
      
      // Dispatch event to update gamification state globally if needed
      window.dispatchEvent(new CustomEvent("aranya:discovery-logged", { detail: data.data }));
    } catch (error) {
      console.error("Failed to log discovery:", error);
    }
  };

  return (
    <div className="dashboard-layout">
      <main className="dashboard-container">
        {/* ── Hero Text ───────────────────────────────────────────────── */}
        <section className="hero-section">
          <span className="sub-tag">TODAY'S DISCOVERY</span>
          <h1 className="main-title">
            Living biodiversity <span className="status-dot" />
          </h1>
          <p className="status-text">
            <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
            {locationText}
          </p>
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

        {/* ── Daily Botanical Facts ────────────────────────────────────── */}
        <section className="daily-fact-card" style={{ marginTop: "1.25rem", marginBottom: "0" }}>
          <h2 className="daily-fact-title">Daily Botanical Facts</h2>
          <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li className="daily-fact-content">
              <strong>The Immortal Banyan:</strong> The Indian Banyan (Ficus benghalensis) drops aerial roots that become thick trunks, allowing a single tree to cover several acres!
            </li>
            <li className="daily-fact-content">
              <strong>Sacred Tulsi:</strong> Holy Basil (Ocimum tenuiflorum) is not only revered in Ayurveda but also emits ozone (O3) along with oxygen, purifying the air around it.
            </li>
            <li className="daily-fact-content">
              <strong>Neem's Arsenal:</strong> The Neem tree (Azadirachta indica) produces over 130 different biologically active compounds, making it a natural pharmacy against pests and diseases.
            </li>
          </ul>
        </section>
      </main>

      {/* ── Fullscreen Camera Overlay ────────────────────────────────── */}
      {isCameraOpen && (
        <div className="fullscreen-overlay">
          {/* Hide camera close button while a modal (detail sheet / chat) is open
              to prevent overlapping touch targets in the top-right corner */}
          {!isCameraModalOpen && (
            <button className="close-camera-button" onClick={closeCamera}>
              <X size={24} color="#ffffff" />
            </button>
          )}
          <CameraScanner
            ref={scannerRef}
            onScanComplete={handleScanComplete}
            onModalChange={setIsCameraModalOpen}
          />
        </div>
      )}
    </div>
  );
}
