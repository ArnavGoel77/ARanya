/**
 * score-card.jsx
 *
 * Displays the user's gamification score with an animated counter
 * that ticks up whenever a new discovery is logged.
 *
 * Consumes: useDashboard() — totalScore, pointsAwarded, gamificationMsg, isNewDiscovery
 *
 * Styling: Tailwind semantic tokens only · rounded-2xl cards · shadow-sm tiles
 * State  : camelCase throughout
 */
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "../context/dashboard-context";

// ---------------------------------------------------------------------------
// Animated number counter hook
// ---------------------------------------------------------------------------

/**
 * Smoothly animates a displayed number from its previous value to a new target.
 * @param {number} targetValue - The value to animate toward.
 * @param {number} durationMs  - Animation duration in milliseconds.
 * @returns {number} The current animated display value.
 */
const useAnimatedCounter = (targetValue, durationMs = 1200) => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const startValueRef = useRef(targetValue);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const startValue = startValueRef.current;
    if (startValue === targetValue) return;

    startTimeRef.current = performance.now();

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOut(progress);
      setDisplayValue(Math.round(startValue + (targetValue - startValue) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startValueRef.current = targetValue;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetValue, durationMs]);

  return displayValue;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ScoreCard = () => {
  const { totalScore, isNewDiscovery, gamificationMsg } = useDashboard();

  const animatedScore = useAnimatedCounter(totalScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-primary rounded-2xl p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden"
    >
      {/* Decorative background rings */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary-light opacity-10 pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary-dark opacity-20 pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="text-white text-sm font-semibold tracking-wide uppercase opacity-80">
            Discovery Score
          </span>
        </div>
        <AnimatePresence>
          {isNewDiscovery && (
            <motion.span
              key="new-badge"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md"
            >
              NEW FIND 🔥
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Animated score */}
      <div className="relative z-10">
        <motion.p
          key={totalScore}
          className="text-white text-6xl font-bold tracking-tight leading-none"
        >
          {animatedScore.toLocaleString()}
        </motion.p>
        <p className="text-white opacity-60 text-xs mt-1 font-medium">TOTAL POINTS</p>
      </div>

      {/* Gamification message */}
      <AnimatePresence>
        {gamificationMsg && (
          <motion.p
            key={gamificationMsg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 text-white opacity-80 text-sm leading-relaxed border-t border-white/20 pt-3"
          >
            {gamificationMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScoreCard;
