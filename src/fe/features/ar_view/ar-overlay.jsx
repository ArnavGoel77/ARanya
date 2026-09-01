/**
 * ar-overlay.jsx
 *
 * AR species info overlay panel for Frontend Developer 1.
 * Renders the scientific and conservation data returned by
 * GET /api/v1/plants/:plant_id/ar-metadata on top of the camera feed.
 *
 * Props:
 *  - arMetadata   : Object — the `data` sub-object from the API response
 *  - isVisible    : boolean — controls entrance/exit animation
 *  - onDismiss    : () => void — called when user closes the panel
 *
 * Styling rules (from .antigravityrules):
 *  - Panel container  → rounded-2xl shadow-2xl
 *  - Rare badge       → bg-accent text-accent (when data.is_rare === true)
 *  - Subtext / labels → text-muted-dark
 *  - Backgrounds      → bg-surface / bg-surface-dark
 *
 * TODO (implementation phase):
 *  - Render all fields from arMetadata (scientific_name, conservation_status, etc.)
 *  - Add entrance/exit CSS transition tied to isVisible prop
 *  - Conditionally render rare highlight badge when arMetadata.is_rare is true
 */

import React from "react";

/**
 * @param {{
 *   arMetadata: Object | null,
 *   isVisible: boolean,
 *   onDismiss: () => void
 * }} props
 */
export default function ArOverlay({ arMetadata, isVisible, onDismiss }) {
  if (!isVisible || !arMetadata) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-surface rounded-2xl shadow-2xl">
      <p className="text-muted-dark">ArOverlay — scaffold placeholder</p>
      {arMetadata.is_rare && (
        <span className="inline-block px-3 py-1 mt-2 text-sm font-semibold rounded-xl bg-accent text-accent">
          Rare Species
        </span>
      )}
      <button
        id="ar-overlay-dismiss-btn"
        onClick={onDismiss}
        className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary shadow-md"
      >
        Dismiss
      </button>
    </div>
  );
}
