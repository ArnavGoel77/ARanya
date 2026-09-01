/**
 * badge-gallery.jsx
 *
 * Renders a grid of gamification badges earned by the user.
 * Newly unlocked badges animate in with a glow pulse.
 *
 * Consumes: useDashboard() — badgesUnlocked
 *
 * Styling: Tailwind semantic tokens only · rounded-2xl cards · gap-4 grid
 * State  : camelCase throughout
 */
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "../context/dashboard-context";

// ---------------------------------------------------------------------------
// Badge icon mapping
// Since icon_url values are mocked Firebase storage URLs (not live), we
// map badge IDs to emoji icons so the UI always renders correctly.
// ---------------------------------------------------------------------------

/** @type {Record<string, string>} */
const BADGE_ICON_MAP = {
  badge_endemic_explorer: "🦋",
  badge_ghats_guardian:   "🏔️",
  badge_riparian_ranger:  "🌊",
};

const DEFAULT_BADGE_ICON = "🏅";

// ---------------------------------------------------------------------------
// Single badge tile
// ---------------------------------------------------------------------------

/**
 * @param {{ badge: { badgeId, badgeName, iconUrl }, isNew: boolean }} props
 */
const BadgeTile = ({ badge, isNew }) => {
  const icon = BADGE_ICON_MAP[badge.badgeId] ?? DEFAULT_BADGE_ICON;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-2xl shadow-sm
        ${isNew
          ? "bg-accent-light border-2 border-accent"
          : "bg-surface border-2 border-muted"}
      `}
    >
      {/* Glow ring for newly unlocked badge */}
      {isNew && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-accent"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1.6, repeat: 3, ease: "easeInOut" }}
        />
      )}

      <span className="text-4xl leading-none">{icon}</span>
      <p className="text-xs font-semibold text-primary text-center leading-tight">
        {badge.badgeName}
      </p>

      {isNew && (
        <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xl shadow-md">
          NEW
        </span>
      )}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

const EmptyBadgeState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="col-span-full flex flex-col items-center gap-2 py-8 text-muted-dark"
  >
    <span className="text-5xl opacity-40">🏅</span>
    <p className="text-sm font-medium">No badges yet.</p>
    <p className="text-xs opacity-70">Log your first discovery to earn one!</p>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const BadgeGallery = () => {
  const { badgesUnlocked } = useDashboard();

  /**
   * Track which badge IDs were present on the previous render so we can
   * identify truly new arrivals and apply the glow animation.
   */
  const prevBadgeIdsRef = useRef(new Set());
  const [newBadgeIds, setNewBadgeIds] = useState(new Set());

  useEffect(() => {
    const prevIds = prevBadgeIdsRef.current;
    const currentIds = new Set(badgesUnlocked.map((b) => b.badgeId));
    const arrivals = new Set([...currentIds].filter((id) => !prevIds.has(id)));

    if (arrivals.size > 0) {
      setNewBadgeIds(arrivals);
      // Clear "new" highlight after 6 seconds
      const timer = setTimeout(
        () => setNewBadgeIds(new Set()),
        6000
      );
      prevBadgeIdsRef.current = currentIds;
      return () => clearTimeout(timer);
    }

    prevBadgeIdsRef.current = currentIds;
  }, [badgesUnlocked]);

  return (
    <div className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏅</span>
          <h2 className="text-sm font-semibold text-primary">Badges Earned</h2>
        </div>
        <span className="bg-muted-light text-muted-dark text-xs font-semibold px-2 py-0.5 rounded-xl">
          {badgesUnlocked.length} / 3
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-4">
        <AnimatePresence>
          {badgesUnlocked.length === 0 ? (
            <EmptyBadgeState />
          ) : (
            badgesUnlocked.map((badge) => (
              <BadgeTile
                key={badge.badgeId}
                badge={badge}
                isNew={newBadgeIds.has(badge.badgeId)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BadgeGallery;
