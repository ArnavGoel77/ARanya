/**
 * dashboard-context.jsx
 *
 * React Context + Provider for the user Dashboard feature.
 *
 * STATE (camelCase per .antigravityrules):
 *   - totalScore       : number  — user's current gamification score
 *   - badgesUnlocked   : array   — all badges the user has earned
 *   - isNewDiscovery   : boolean — flag for celebratory UI on new finds
 *   - gamificationMsg  : string  — motivational message from last discovery
 *   - isLoading        : boolean — true while a discovery POST is in-flight
 *   - errorMessage     : string | null
 *
 * All API response fields (snake_case) are mapped to camelCase here
 * before being stored in state.
 */
import React, { createContext, useCallback, useContext, useState } from "react";
import { postDiscovery } from "../../botanist_chat/services/mock-chat-api";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

const DashboardContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * @param {{ children: React.ReactNode, userId?: string }} props
 */
export const DashboardProvider = ({ children, userId = "usr_99823" }) => {
  /** User's cumulative score. Seed matches api-spec.md baseline. */
  const [totalScore, setTotalScore] = useState(500);

  /** All badges earned across the session. */
  const [badgesUnlocked, setBadgesUnlocked] = useState([]);

  /** True when the most recent discovery was a first-time find. */
  const [isNewDiscovery, setIsNewDiscovery] = useState(false);

  /** Motivational gamification text from the last discovery response. */
  const [gamificationMsg, setGamificationMsg] = useState("");

  /** True while the postDiscovery call is in-flight. */
  const [isLoading, setIsLoading] = useState(false);

  /** Last error string, null when clean. */
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Logs a plant discovery and updates dashboard state with the reward data.
   *
   * Maps API snake_case response fields → camelCase state:
   *   points_awarded       (read but not stored; reflected in new_total_score)
   *   new_total_score      → totalScore
   *   is_new_discovery     → isNewDiscovery
   *   badges_unlocked      → appended to badgesUnlocked
   *   gamification_message → gamificationMsg
   *
   * @param {string} plantId      - The discovered plant's ID.
   * @param {{ latitude: number, longitude: number }} location - Discovery coords.
   */
  const logDiscovery = useCallback(
    async (plantId, location) => {
      if (!plantId || isLoading) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // API contract payload uses snake_case.
        const response = await postDiscovery(userId, {
          plant_id: plantId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        });

        const { data } = response;

        // Map snake_case → camelCase before storing in state.
        setTotalScore(data.new_total_score);
        setIsNewDiscovery(data.is_new_discovery);
        setGamificationMsg(data.gamification_message);

        if (data.badges_unlocked?.length > 0) {
          setBadgesUnlocked((prev) => [
            ...prev,
            ...data.badges_unlocked.map((b) => ({
              // Map badge fields to camelCase for React state.
              badgeId: b.badge_id,
              badgeName: b.badge_name,
              iconUrl: b.icon_url,
            })),
          ]);
        }
      } catch (err) {
        setErrorMessage(err.message ?? "Failed to log discovery. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isLoading]
  );

  const contextValue = {
    totalScore,
    badgesUnlocked,
    isNewDiscovery,
    gamificationMsg,
    isLoading,
    errorMessage,
    logDiscovery,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Consumes the DashboardContext.
 * Must be used inside a <DashboardProvider>.
 *
 * @returns {{
 *   totalScore: number,
 *   badgesUnlocked: Array,
 *   isNewDiscovery: boolean,
 *   gamificationMsg: string,
 *   isLoading: boolean,
 *   errorMessage: string|null,
 *   logDiscovery: Function
 * }}
 */
export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a <DashboardProvider>.");
  }
  return ctx;
};
