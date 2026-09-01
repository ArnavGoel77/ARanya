/**
 * api-test-harness.jsx
 *
 * Visual test harness for the FE Developer 2 mock API services.
 * Exercises both exported functions from mock-chat-api.js:
 *   - postBotanistMessage  (Domain 3: AI Botanical Guide)
 *   - postDiscovery        (Domain 4: User Gamification)
 *
 * HOW TO READ RESULTS:
 *   - Green "success" badge  → API returned { success: true }
 *   - Response panel shows the raw JSON exactly as the API returns it (snake_case)
 *   - State panel shows how the context maps it to camelCase for React
 *
 * Styling: Tailwind semantic tokens only (bg-surface, text-primary, etc.)
 * State  : camelCase per .antigravityrules
 */
import React, { useState, useCallback } from "react";
import {
  postBotanistMessage,
  postDiscovery,
} from "../services/mock-chat-api";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Status pill shown next to the section heading. */
const StatusPill = ({ status }) => {
  const pillStyles = {
    idle:    "bg-muted-light text-muted-dark",
    loading: "bg-accent-light text-accent-dark animate-pulse",
    success: "bg-primary-light/20 text-primary",
    error:   "bg-red-100 text-red-700",
  };
  const labels = { idle: "IDLE", loading: "LOADING…", success: "SUCCESS ✓", error: "ERROR ✗" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-xl ${pillStyles[status]}`}>
      {labels[status]}
    </span>
  );
};

/** Displays a raw JSON payload in a scrollable code block. */
const JsonDisplay = ({ label, data }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs font-semibold text-muted-dark uppercase tracking-wide">{label}</p>
    <pre className="bg-surface-dark rounded-xl p-4 text-xs overflow-auto max-h-52 leading-relaxed text-muted-dark whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  </div>
);

/** A labelled text input field. */
const Field = ({ id, label, value, onChange, placeholder, as: Tag = "input" }) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-xs font-semibold text-muted-dark uppercase tracking-wide">
      {label}
    </label>
    <Tag
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={Tag === "textarea" ? 3 : undefined}
      className="bg-surface-dark border border-muted rounded-xl px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
    />
  </div>
);

// ---------------------------------------------------------------------------
// Section 1 — AI Botanical Guide
// ---------------------------------------------------------------------------

const BotanistSection = () => {
  // camelCase state per .antigravityrules
  const [userId, setUserId]                   = useState("usr_99823");
  const [plantContext, setPlantContext]        = useState("plant_cg_101");
  const [messageText, setMessageText]         = useState("Can I grow this plant in my home garden in Vellore?");
  const [apiStatus, setApiStatus]             = useState("idle");
  const [rawApiResponse, setRawApiResponse]   = useState(null);
  const [mappedState, setMappedState]         = useState(null);
  const [errorMsg, setErrorMsg]               = useState(null);

  const handleSend = useCallback(async () => {
    setApiStatus("loading");
    setRawApiResponse(null);
    setMappedState(null);
    setErrorMsg(null);

    try {
      // Payload sent in snake_case (API contract)
      const response = await postBotanistMessage({
        user_id: userId,
        current_plant_context: plantContext,
        message: messageText,
      });

      setRawApiResponse(response);
      setApiStatus("success");

      // Map snake_case → camelCase (what the context would store in state)
      setMappedState({
        replyText: response.data.reply_text,
        suggestedFollowupQueries: response.data.suggested_followup_queries,
      });
    } catch (err) {
      setApiStatus("error");
      setErrorMsg(err.message);
    }
  }, [userId, plantContext, messageText]);

  return (
    <section className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🌿</span>
        <div>
          <h2 className="text-base font-semibold text-primary leading-tight">
            Domain 3 — AI Botanical Guide
          </h2>
          <p className="text-xs text-muted-dark">POST /api/v1/chat/botanist</p>
        </div>
        <StatusPill status={apiStatus} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field id="b-userId"   label="user_id"              value={userId}       onChange={setUserId}       placeholder="usr_99823" />
        <Field id="b-plantCtx" label="current_plant_context" value={plantContext} onChange={setPlantContext} placeholder="plant_cg_101" />
        <Field id="b-message"  label="message" as="textarea" value={messageText} onChange={setMessageText}  placeholder="Ask a botanical question…" />
      </div>

      <button
        id="btn-send-botanist"
        onClick={handleSend}
        disabled={apiStatus === "loading"}
        className="self-start bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {apiStatus === "loading" ? "Sending…" : "Send Message"}
      </button>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{errorMsg}</p>
      )}

      {rawApiResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <JsonDisplay label="Raw API Response (snake_case)" data={rawApiResponse} />
          <JsonDisplay label="Mapped to React State (camelCase)" data={mappedState} />
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Section 2 — User Gamification
// ---------------------------------------------------------------------------

const GamificationSection = () => {
  // camelCase state per .antigravityrules
  const [userId, setUserId]               = useState("usr_99823");
  const [plantId, setPlantId]             = useState("plant_cg_101");
  const [latitude, setLatitude]           = useState("12.9165");
  const [longitude, setLongitude]         = useState("79.1325");
  const [apiStatus, setApiStatus]         = useState("idle");
  const [rawApiResponse, setRawApiResponse] = useState(null);
  const [mappedState, setMappedState]     = useState(null);
  const [errorMsg, setErrorMsg]           = useState(null);

  const handleDiscover = useCallback(async () => {
    setApiStatus("loading");
    setRawApiResponse(null);
    setMappedState(null);
    setErrorMsg(null);

    try {
      // Payload sent in snake_case (API contract)
      const response = await postDiscovery(userId, {
        plant_id: plantId,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        },
      });

      setRawApiResponse(response);
      setApiStatus("success");

      // Map snake_case → camelCase (what the dashboard context would store)
      const { data } = response;
      setMappedState({
        pointsAwarded:      data.points_awarded,
        newTotalScore:      data.new_total_score,
        isNewDiscovery:     data.is_new_discovery,
        badgesUnlocked:     data.badges_unlocked.map((b) => ({
          badgeId:   b.badge_id,
          badgeName: b.badge_name,
          iconUrl:   b.icon_url,
        })),
        gamificationMsg: data.gamification_message,
      });
    } catch (err) {
      setApiStatus("error");
      setErrorMsg(err.message);
    }
  }, [userId, plantId, latitude, longitude]);

  return (
    <section className="bg-surface rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏆</span>
        <div>
          <h2 className="text-base font-semibold text-primary leading-tight">
            Domain 4 — User Gamification
          </h2>
          <p className="text-xs text-muted-dark">POST /api/v1/users/:user_id/discoveries</p>
        </div>
        <StatusPill status={apiStatus} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field id="g-userId"    label="user_id (path param)" value={userId}    onChange={setUserId}    placeholder="usr_99823" />
        <Field id="g-plantId"   label="plant_id"             value={plantId}   onChange={setPlantId}   placeholder="plant_cg_101" />
        <Field id="g-latitude"  label="latitude"             value={latitude}  onChange={setLatitude}  placeholder="12.9165" />
        <Field id="g-longitude" label="longitude"            value={longitude} onChange={setLongitude} placeholder="79.1325" />
      </div>

      <p className="text-xs text-muted-dark italic">
        💡 Tip: Hit "Log Discovery" twice with the <strong>same plant_id</strong> to test the revisit path (30 pts, no badge).
      </p>

      <button
        id="btn-log-discovery"
        onClick={handleDiscover}
        disabled={apiStatus === "loading"}
        className="self-start bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {apiStatus === "loading" ? "Logging…" : "Log Discovery"}
      </button>

      {errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{errorMsg}</p>
      )}

      {rawApiResponse && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <JsonDisplay label="Raw API Response (snake_case)" data={rawApiResponse} />
          <JsonDisplay label="Mapped to React State (camelCase)" data={mappedState} />
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

const ApiTestHarness = () => (
  <div className="min-h-screen bg-muted-light p-6 flex flex-col gap-6">
    <header className="flex flex-col gap-1">
      <h1 className="text-xl font-bold text-primary">ARanya — FE Dev 2 · Mock API Test Harness</h1>
      <p className="text-sm text-muted-dark">
        Branch: <code className="bg-surface-dark px-1 rounded">Advaith-s.k</code> ·
        Scope: <code className="bg-surface-dark px-1 rounded">dashboard/</code>{" "}
        <code className="bg-surface-dark px-1 rounded">botanist_chat/</code>{" "}
        <code className="bg-surface-dark px-1 rounded">map/</code>
      </p>
    </header>

    <BotanistSection />
    <GamificationSection />

    <footer className="text-center text-xs text-muted pb-4">
      All responses are mocked locally · No backend required
    </footer>
  </div>
);

export default ApiTestHarness;
