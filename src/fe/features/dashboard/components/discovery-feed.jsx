/**
 * discovery-feed.jsx
 *
 * Form panel that lets the user log a plant discovery and see the
 * gamification reward inline. All logged discoveries are listed below
 * the form as a scrollable activity feed.
 *
 * Consumes: useDashboard() — logDiscovery, isLoading, errorMessage
 *
 * Styling: Tailwind semantic tokens only · rounded-2xl cards · shadow-sm tiles
 * State  : camelCase throughout
 */
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "../context/dashboard-context";

// ---------------------------------------------------------------------------
// Feed item — one logged discovery result
// ---------------------------------------------------------------------------

/**
 * @param {{
 *   item: {
 *     id: string,
 *     plantId: string,
 *     pointsAwarded: number,
 *     isNewDiscovery: boolean,
 *     badgesUnlocked: Array,
 *     gamificationMsg: string,
 *     timestamp: string
 *   }
 * }} props
 */
const FeedItem = ({ item }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className={`
      flex gap-3 p-4 rounded-2xl shadow-sm
      ${item.isNewDiscovery ? "bg-primary/5 border border-primary/20" : "bg-surface border border-muted"}
    `}
  >
    {/* Icon column */}
    <div
      className={`
        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl
        ${item.isNewDiscovery ? "bg-primary/10" : "bg-muted-light"}
      `}
    >
      {item.isNewDiscovery ? "🌿" : "📍"}
    </div>

    {/* Content column */}
    <div className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold text-primary truncate">
          {item.plantId}
        </span>
        <span
          className={`
            text-xs font-bold px-2 py-0.5 rounded-xl
            ${item.isNewDiscovery
              ? "bg-accent text-white"
              : "bg-muted-light text-muted-dark"}
          `}
        >
          +{item.pointsAwarded} pts
        </span>
        {item.badgesUnlocked.length > 0 && (
          <span className="text-xs bg-accent-light text-accent-dark font-semibold px-2 py-0.5 rounded-xl">
            🏅 Badge unlocked!
          </span>
        )}
      </div>
      <p className="text-xs text-muted-dark leading-relaxed">{item.gamificationMsg}</p>
      <p className="text-[10px] text-muted mt-0.5">{item.timestamp}</p>
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Log discovery form
// ---------------------------------------------------------------------------

const LogDiscoveryForm = () => {
  const { logDiscovery, isLoading, errorMessage } = useDashboard();

  // camelCase form state
  const [plantId, setPlantId]   = useState("plant_cg_101");
  const [latitude, setLatitude] = useState("12.9165");
  const [longitude, setLongitude] = useState("79.1325");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      await logDiscovery(plantId.trim(), {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
    },
    [logDiscovery, plantId, latitude, longitude]
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Plant ID */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="df-plant-id"
            className="text-xs font-semibold text-muted-dark uppercase tracking-wide"
          >
            Plant ID
          </label>
          <input
            id="df-plant-id"
            type="text"
            value={plantId}
            onChange={(e) => setPlantId(e.target.value)}
            placeholder="plant_cg_101"
            className="bg-surface-dark border border-muted rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Latitude */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="df-latitude"
            className="text-xs font-semibold text-muted-dark uppercase tracking-wide"
          >
            Latitude
          </label>
          <input
            id="df-latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="12.9165"
            className="bg-surface-dark border border-muted rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Longitude */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="df-longitude"
            className="text-xs font-semibold text-muted-dark uppercase tracking-wide"
          >
            Longitude
          </label>
          <input
            id="df-longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="79.1325"
            className="bg-surface-dark border border-muted rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-dark italic">
        💡 Use the same Plant ID twice to test the revisit path (30 pts, no badge).
      </p>

      {/* Error */}
      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        id="btn-log-discovery"
        type="submit"
        disabled={isLoading}
        className="self-start bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              🌀
            </motion.span>
            Logging…
          </>
        ) : (
          "📍 Log Discovery"
        )}
      </button>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DiscoveryFeed = () => {
  /**
   * Local feed history — each entry is the camelCase-mapped result from
   * the dashboard context's logDiscovery call, enriched with a timestamp.
   * This mirrors what the context already stores but presents it as a log.
   */
  const { totalScore, isNewDiscovery, badgesUnlocked, gamificationMsg, isLoading } =
    useDashboard();

  const [feedItems, setFeedItems] = useState([]);
  const prevScoreRef = React.useRef(totalScore);
  const prevMsgRef = React.useRef(gamificationMsg);

  // Append a new feed item whenever a discovery is successfully logged
  // (detected by the gamificationMsg changing after the load completes).
  React.useEffect(() => {
    if (
      !isLoading &&
      gamificationMsg &&
      gamificationMsg !== prevMsgRef.current
    ) {
      const pointsDelta = totalScore - prevScoreRef.current;
      setFeedItems((prev) => [
        {
          id: `feed_${Date.now()}`,
          plantId: `plant logged at ${new Date().toLocaleTimeString("en-IN")}`,
          pointsAwarded: pointsDelta > 0 ? pointsDelta : 0,
          isNewDiscovery,
          badgesUnlocked: isNewDiscovery ? badgesUnlocked.slice(-1) : [],
          gamificationMsg,
          timestamp: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        },
        ...prev,
      ]);
      prevMsgRef.current = gamificationMsg;
      prevScoreRef.current = totalScore;
    }
  }, [isLoading, gamificationMsg, totalScore, isNewDiscovery, badgesUnlocked]);

  return (
    <div className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📋</span>
        <h2 className="text-sm font-semibold text-primary">Log a Discovery</h2>
      </div>

      <LogDiscoveryForm />

      {/* Activity feed */}
      {feedItems.length > 0 && (
        <div className="flex flex-col gap-3 mt-2">
          <p className="text-xs font-semibold text-muted-dark uppercase tracking-wide">
            Activity Feed
          </p>
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {feedItems.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;
