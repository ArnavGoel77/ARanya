import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Info, RefreshCw } from "lucide-react";
import { MapProvider } from "../context/map-context";
import { useAuth } from "@fe/contexts/AuthContext";

// Custom Marker Icons
const userLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const plantMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to center map smoothly when a plant card is clicked
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 14, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

const MapContent = () => {
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState([12.9165, 79.1325]); // Default: Vellore coordinates
  const [identifiedPlants, setIdentifiedPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default Mock Discoveries (matches Domain 4 & Domain 2 API specs)
  const initialDiscoveries = [
    {
      plant_id: "plant_cg_101",
      scientific_name: "Croton gibsonianus",
      common_name: "Gibson's Croton",
      conservation_status: "Critically Endangered",
      location: { latitude: 12.918, longitude: 79.145 },
      discovered_at: "2026-09-01T10:15:30Z",
    }
  ];

  // Fetch Identified Plants from Backend
  const fetchIdentifiedPlants = async () => {
    setLoading(true);
    try {
      if (!currentUser?.uid) return;
      
      const response = await fetch(`/api/v1/users/${currentUser.uid}/discoveries`);
      if (response.ok) {
        const json = await response.json();
        if (json.data && Array.isArray(json.data.discoveries)) {
          setIdentifiedPlants(json.data.discoveries);
          setLoading(false);
          return;
        }
      }
      // Fallback to mock data if API endpoint is not active yet
      setIdentifiedPlants(initialDiscoveries);
    } catch (error) {
      console.warn("Backend unavailable, loading local discoveries:", error);
      setIdentifiedPlants(initialDiscoveries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentifiedPlants();
  }, [currentUser]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
      });
    }
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#f5f3eb",
      color: "#1a2e26",
      fontFamily: "serif",
      padding: "1.5rem",
      boxSizing: "border-box"
    }}>
      {/* Header row: title + refresh */}
      <header style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem"
      }}>
        <div>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            color: "#a08355",
            fontFamily: "monospace",
            textTransform: "uppercase"
          }}>
            Species Map
          </span>
          <h1 style={{
            margin: "0.25rem 0 0 0",
            fontSize: "1.5rem",
            fontWeight: "normal",
            color: "#2a3e34"
          }}>
            🗺️ Identified Plants
          </h1>
        </div>

        <button 
          onClick={fetchIdentifiedPlants}
          style={{
            padding: "0.6rem",
            borderRadius: "50%",
            backgroundColor: "#ede9dc",
            border: "1px solid rgba(42, 62, 52, 0.15)",
            color: "#2c3e35",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Refresh Discoveries"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      {/* Grid Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        flex: 1
      }}>
        
        {/* Real Leaflet Map Container */}
        <div style={{
          position: "relative",
          minHeight: "450px",
          borderRadius: "1.25rem",
          border: "1px solid rgba(42, 62, 52, 0.15)",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Leaflet Map Engine */}
          <MapContainer 
            center={userPosition} 
            zoom={13} 
            scrollWheelZoom={true}
            zoomControl={false}
            attributionControl={false}
            style={{ width: "100%", height: "100%", minHeight: "450px" }}
          >
            {/* Google Maps Styled OSM TileLayer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController center={selectedPlant ? [selectedPlant.location.latitude, selectedPlant.location.longitude] : userPosition} />

            {/* Current User Location Marker */}
            <Marker position={userPosition} icon={userLocationIcon}>
              <Popup>
                <strong>You Are Here</strong><br />
                Current Location
              </Popup>
            </Marker>

            {/* Identified Plant Markers */}
            {identifiedPlants.map((plant) => (
              <Marker
                key={plant.plant_id}
                position={[plant.location.latitude, plant.location.longitude]}
                icon={plantMarkerIcon}
                eventHandlers={{
                  click: () => setSelectedPlant(plant),
                }}
              >
                <Popup>
                  <div style={{ fontFamily: "sans-serif" }}>
                    <strong style={{ fontStyle: "italic" }}>{plant.scientific_name}</strong>
                    <br />
                    <span>{plant.common_name}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Selected Species Overlay Card */}
          {selectedPlant && (
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              padding: "1rem",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(8px)",
              borderTop: "1px solid rgba(42, 62, 52, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <span style={{ fontSize: "0.65rem", fontFamily: "sans-serif", color: "#a08355", fontWeight: "bold", textTransform: "uppercase" }}>
                  Identified Location Selected
                </span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontStyle: "italic", color: "#2a3e34" }}>
                  {selectedPlant.scientific_name}
                </h3>
                <p style={{ margin: 0, fontSize: "0.8rem", fontFamily: "sans-serif", color: "#6b7a70" }}>
                  {selectedPlant.common_name} · [{selectedPlant.location.latitude}, {selectedPlant.location.longitude}]
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlant(null)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ede9dc",
                  color: "#2c3e35",
                  fontFamily: "sans-serif",
                  fontSize: "0.75rem",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Identified Species Sidebar List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{
              fontSize: "0.75rem",
              fontFamily: "sans-serif",
              fontWeight: "bold",
              letterSpacing: "1px",
              color: "#a08355",
              textTransform: "uppercase"
            }}>
              Your Identified Species ({identifiedPlants.length})
            </span>
            <Info size={16} color="#6b7a70" />
          </div>

          {identifiedPlants.map((plant) => {
            const isSelected = selectedPlant?.plant_id === plant.plant_id;

            return (
              <div
                key={plant.plant_id}
                onClick={() => setSelectedPlant(plant)}
                style={{
                  padding: "1rem",
                  borderRadius: "0.875rem",
                  backgroundColor: isSelected ? "#2a3e34" : "#ffffff",
                  color: isSelected ? "#ffffff" : "#1a2e26",
                  border: isSelected ? "1px solid #2a3e34" : "1px solid rgba(42, 62, 52, 0.12)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                  <span style={{
                    fontSize: "0.65rem",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "1rem",
                    backgroundColor: isSelected 
                      ? "rgba(255,255,255,0.2)" 
                      : plant.conservation_status === "Critically Endangered" 
                      ? "rgba(229,169,59,0.2)" 
                      : "rgba(56,94,76,0.1)",
                    color: isSelected 
                      ? "#ffffff" 
                      : plant.conservation_status === "Critically Endangered" 
                      ? "#a08355" 
                      : "#385e4c"
                  }}>
                    {plant.conservation_status || "Identified"}
                  </span>
                  <span style={{ fontSize: "0.7rem", fontFamily: "sans-serif", opacity: 0.8 }}>
                    {new Date(plant.discovered_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.1rem", fontStyle: "italic", fontWeight: "normal" }}>
                  {plant.scientific_name}
                </h3>
                <p style={{ margin: 0, fontSize: "0.825rem", fontFamily: "sans-serif", opacity: 0.85 }}>
                  {plant.common_name}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default function MapPage() {
  return (
    <MapProvider>
      <MapContent />
    </MapProvider>
  );
}