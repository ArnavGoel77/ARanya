/**
 * use-ar-metadata.js
 *
 * Custom React hook — fetches AR metadata for a given plant ID and
 * manages loading / error / data state for the ArOverlay component.
 *
 * Returns:
 *  - arMetadata   : Object | null — `data` field from the API response
 *  - isLoading    : boolean
 *  - fetchError   : Error | null
 *  - fetchArData  : (plantId: string) => void — trigger a fetch manually
 *
 * During development this hook calls the local mock service.
 * Swap the import to vision_api.js once the backend is live.
 *
 * TODO (implementation phase):
 *  - Replace mockGetArMetadata import with real visionApi.getArMetadata
 *  - Map response.data fields into camelCase state if preferred in UI layer
 */

import { useState, useCallback } from "react";
import { mockGetArMetadata } from "../../services/mock-vision-api.js";

/**
 * @returns {{
 *   arMetadata: Object | null,
 *   isLoading: boolean,
 *   fetchError: Error | null,
 *   fetchArData: (plantId: string) => void
 * }}
 */
export default function useArMetadata() {
  const [arMetadata, setArMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchArData = useCallback(async (plantId) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await mockGetArMetadata(plantId);
      // Expose only the `data` sub-object to keep component props clean.
      setArMetadata(response.data);
    } catch (error) {
      setFetchError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { arMetadata, isLoading, fetchError, fetchArData };
}
