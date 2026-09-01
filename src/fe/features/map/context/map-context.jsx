/**
 * map-context.jsx
 *
 * React Context + Provider for the Biodiversity Map feature.
 *
 * NOTE: The map feature consumes Domain 5 data (GET /api/v1/location/nearby-species).
 * That endpoint is served by Backend Developer 2 (src/be/routes/location/).
 * A stub is included here so the map components can develop against a
 * consistent shape while the backend is built in parallel.
 *
 * STATE (camelCase per .antigravityrules):
 *   - nearbySpecies    : array   — list of nearby plant objects
 *   - searchRadiusKm   : number  — active search radius
 *   - ecologicalZone   : string  — zone label returned by the API
 *   - userCoords       : { latitude, longitude } | null
 *   - isLoading        : boolean
 *   - errorMessage     : string | null
 *
 * All API response fields (snake_case) are mapped to camelCase here.
 */
import React, { createContext, useCallback, useContext, useState } from "react";

// ---------------------------------------------------------------------------
// Inline stub — replace with real API call when backend is ready
// ---------------------------------------------------------------------------

/**
 * Stub replicating GET /api/v1/location/nearby-species (Domain 5, api-spec.md).
 * Accepts query params for lat/lng/radius but ignores them for mock purposes.
 *
 * @returns {Promise<Object>}
 */
const fetchNearbySpeciesStub = async () => {
  await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 600) + 400));
  return {
    success: true,
    data: {
      search_radius_km: 5,
      ecological_zone: "Eastern Ghats Foothills",
      nearby_species: [
        {
          plant_id: "plant_am_204",
          scientific_name: "Alphonsea madraspatana",
          common_name: "Madras Alphonsea",
          distance_estimate_km: 1.2,
        },
        {
          plant_id: "plant_gs_205",
          scientific_name: "Gloriosa superba",
          common_name: "Flame Lily",
          distance_estimate_km: 2.8,
        },
      ],
    },
  };
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

const MapContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * @param {{ children: React.ReactNode }} props
 */
export const MapProvider = ({ children }) => {
  /** Nearby species array — each item is camelCase-mapped from the API. */
  const [nearbySpecies, setNearbySpecies] = useState([]);

  /** Active search radius in km. */
  const [searchRadiusKm, setSearchRadiusKm] = useState(5);

  /** Ecological zone label for the current location. */
  const [ecologicalZone, setEcologicalZone] = useState("");

  /** User's current geolocation. */
  const [userCoords, setUserCoords] = useState(null);

  /** True while the API call is in-flight. */
  const [isLoading, setIsLoading] = useState(false);

  /** Last error string, null when clean. */
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Fetches nearby species for the given coordinates and updates map state.
   *
   * Maps API snake_case response fields → camelCase state:
   *   search_radius_km   → searchRadiusKm
   *   ecological_zone    → ecologicalZone
   *   nearby_species[]
   *     plant_id            → plantId
   *     scientific_name     → scientificName
   *     common_name         → commonName
   *     distance_estimate_km → distanceEstimateKm
   *
   * @param {{ latitude: number, longitude: number }} coords
   */
  const loadNearbySpecies = useCallback(async (coords) => {
    setIsLoading(true);
    setErrorMessage(null);
    setUserCoords(coords);

    try {
      const response = await fetchNearbySpeciesStub(coords);
      const { data } = response;

      // Map snake_case → camelCase before storing in state.
      setSearchRadiusKm(data.search_radius_km);
      setEcologicalZone(data.ecological_zone);
      setNearbySpecies(
        data.nearby_species.map((s) => ({
          plantId: s.plant_id,
          scientificName: s.scientific_name,
          commonName: s.common_name,
          distanceEstimateKm: s.distance_estimate_km,
        }))
      );
    } catch (err) {
      setErrorMessage(err.message ?? "Failed to load nearby species. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = {
    nearbySpecies,
    searchRadiusKm,
    ecologicalZone,
    userCoords,
    isLoading,
    errorMessage,
    loadNearbySpecies,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Consumes the MapContext.
 * Must be used inside a <MapProvider>.
 *
 * @returns {{
 *   nearbySpecies: Array,
 *   searchRadiusKm: number,
 *   ecologicalZone: string,
 *   userCoords: { latitude: number, longitude: number } | null,
 *   isLoading: boolean,
 *   errorMessage: string | null,
 *   loadNearbySpecies: Function
 * }}
 */
export const useMap = () => {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMap must be used within a <MapProvider>.");
  }
  return ctx;
};
