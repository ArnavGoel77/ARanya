/**
 * map-page.jsx
 *
 * Scaffold placeholder for the Biodiversity Map UI.
 * Renders the species map and nearby-species list.
 *
 * Styling: Tailwind semantic tokens only (bg-surface, text-primary, etc.)
 * State  : camelCase via useMap() hook
 */
import React from "react";
import { MapProvider } from "../context/map-context";

const MapPage = () => {
  return (
    <MapProvider>
      <div className="flex flex-col h-full bg-surface rounded-2xl p-6 gap-4">
        <h1 className="text-xl font-semibold text-primary">
          🗺️ Biodiversity Map
        </h1>
        <p className="text-muted-dark text-sm">
          Interactive map and nearby-species list will be implemented here.
          The <code>useMap()</code> hook and Domain 5 stub are ready.
        </p>
      </div>
    </MapProvider>
  );
};

export default MapPage;
