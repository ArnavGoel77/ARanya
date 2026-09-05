/**
 * plant-detail-sheet.jsx
 *
 * Full-screen slide-up sheet shown when the user taps the plant name
 * in the AR camera overlay. Displays comprehensive AR metadata and
 * provides a button to launch the BotanistChatWindow.
 *
 * Props:
 *  arMetadata       – data object from GET /api/v1/plants/:id/ar-metadata
 *  identifyResult   – data object from POST /api/v1/vision/identify
 *  isOpen           – boolean controlling visibility
 *  onClose          – () => void
 *
 * Styling follows .antigravityrules §3 (rounded-2xl, shadow-2xl, semantic tokens).
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Leaf,
  MapPin,
  AlertTriangle,
  Info,
  BookOpen,
  History,
  Shield,
  Sprout
} from "lucide-react";
import BotanistChatWindow from "../botanist_chat/components/botanist-chat-window";

// ── Sub-component: a single detail row ──────────────────────────────────────

function DetailRow({ icon: Icon, label, value, accent = false }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-muted" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
      <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl bg-surface flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
        <Icon size={14} className={accent ? "text-accent" : "text-primary"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-dark mb-0.5">{label}</p>
        <p className={`text-sm font-medium leading-snug ${accent ? "text-accent" : "text-muted-light"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlantDetailSheet({ arMetadata, identifyResult, isOpen, onClose, onScanComplete, isPopulating }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLogged, setHasLogged] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      // Small delay so CSS transition fires after mount
      const t = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
      setIsChatOpen(false);
      setHasLogged(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confidencePct = identifyResult
    ? `${(identifyResult.confidence_score * 100).toFixed(0)}%`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={onClose}
      />

      {/* Sheet panel — slides up from bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(160deg, #0e1d14 0%, #0a1510 100%)",
          maxHeight: "90vh",
          transform: isVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          fontFamily: "'Inter', sans-serif",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Plant Detail"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🌿</span>
              {identifyResult?.requires_rare_highlight && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-xl bg-accent text-muted-light">
                  RARE
                </span>
              )}
              {identifyResult?.is_native_to_region && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-xl text-primary"
                  style={{ background: "rgba(22,101,52,0.25)", border: "1px solid rgba(22,101,52,0.4)" }}
                >
                  NATIVE
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-muted-light leading-tight truncate">
              {identifyResult?.is_in_database === false 
                ? (identifyResult.external_data?.common_name || identifyResult.external_data?.scientific_name || "Unknown Plant")
                : (arMetadata?.common_name ?? "Unknown Species")}
            </h2>
            <p className="text-sm italic text-muted-dark mt-0.5">
              {identifyResult?.is_in_database === false 
                ? identifyResult.external_data?.scientific_name
                : (arMetadata?.scientific_name ?? identifyResult?.identified_plant_id)}
            </p>
          </div>

          <button
            id="plant-detail-close-btn"
            onClick={onClose}
            className="ml-3 flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}
            aria-label="Close plant detail"
          >
            <X size={18} className="text-muted-dark" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6" style={{ overscrollBehavior: "contain" }}>
          {/* Confidence badge */}
          {confidencePct && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: confidencePct, transition: "width 0.6s ease" }}
                />
              </div>
              <span className="text-xs font-semibold text-primary flex-shrink-0">
                {confidencePct} match
              </span>
            </div>
          )}

          {/* Detail rows */}
          {isPopulating ? (
            <div className="py-8 text-center mt-2 flex flex-col items-center justify-center">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-primary" style={{ background: "rgba(22, 101, 52, 0.15)" }}>
                <svg className="animate-spin text-primary" style={{ width: 24, height: 24 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <p className="text-sm text-muted-light font-medium mb-1 animate-pulse">
                Fetching botanical data...
              </p>
              <p className="text-xs text-muted-dark leading-relaxed px-4">
                Our AI Botanist is generating a detailed profile for this species. This will only take a moment.
              </p>
            </div>
          ) : identifyResult?.is_in_database === false ? (
            <div className="py-6 text-center mt-2">
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <Info className="text-muted-dark" size={24} />
              </div>
              <p className="text-sm text-muted-light font-medium mb-1">
                Not in Database
              </p>
              <p className="text-xs text-muted-dark leading-relaxed px-4">
                We identified this plant, but it isn't fully registered in the ARanya collection yet. Ask the Botanist AI to learn more about it!
              </p>
            </div>
          ) : arMetadata ? (
            <div>
              <DetailRow icon={Leaf}         label="Family"                  value={arMetadata.plant_family} />
              <DetailRow icon={MapPin}        label="Native Region"           value={arMetadata.native_region} />
              <DetailRow icon={AlertTriangle} label="Conservation Status"     value={arMetadata.conservation_status} accent />
              <DetailRow icon={Info}          label="Ecological Importance"   value={arMetadata.ecological_importance} />
              <DetailRow icon={AlertTriangle} label="Threats"                 value={arMetadata.threats} accent />
              <DetailRow icon={Shield}        label="Conservation Practices"  value={arMetadata.conservation_best_practices} />
              <DetailRow icon={History}       label="Historical Context"      value={arMetadata.historical_context} />
            </div>
          ) : (
            <p className="text-sm text-muted-dark text-center py-8">
              Loading plant details…
            </p>
          )}
        </div>

        {/* CTA — Actions */}
        <div
          className="flex-shrink-0 px-5 py-4 flex gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.3)" }}
        >
          <button
            id="plant-detail-chat-btn"
            onClick={() => setIsChatOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl shadow-md font-semibold text-sm text-muted-light border border-white/20"
            style={{ letterSpacing: "0.02em", background: "rgba(255,255,255,0.1)" }}
          >
            <Sparkles size={16} />
            Ask Botanist AI
          </button>
          
          {identifyResult?.is_in_database !== false && (
            <button
              onClick={async () => {
                if (hasLogged || !onScanComplete || !identifyResult) return;
                setIsLogging(true);
                try {
                  // Wait for the parent to finish the API request
                  await onScanComplete(identifyResult);
                  setHasLogged(true);
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsLogging(false);
                }
              }}
              disabled={hasLogged || isLogging}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl shadow-md font-semibold text-sm bg-primary text-muted-light disabled:opacity-50"
              style={{ letterSpacing: "0.02em" }}
            >
              {hasLogged ? (
                <>
                  <Leaf size={16} className="text-white" />
                  Logged!
                </>
              ) : isLogging ? (
                "Logging..."
              ) : (
                <>
                  <Sprout size={16} />
                  Log to Journal
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* AI Chat Window — layered on top of sheet */}
      <BotanistChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        plantContext={identifyResult?.is_in_database === false ? identifyResult.external_data : arMetadata}
      />
    </>
  );
}
