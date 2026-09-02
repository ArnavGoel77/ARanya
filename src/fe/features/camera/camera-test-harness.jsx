/**
 * camera-test-harness.jsx
 *
 * LOCAL DEVELOPMENT ONLY — not imported by any production code.
 *
 * Mounts CameraScanner in isolation and pretty-prints the scan result
 * returned via onScanComplete so you can verify the full flow:
 *
 *   WebRTC feed → frame capture → mockIdentifyPlant → result panel
 *
 * Usage: temporarily import this in App.jsx while on abhinav-camera branch.
 * Revert App.jsx to its original import before merging to main.
 */

import React, { useState } from "react";
import CameraScanner from "./camera-scanner.jsx";

export default function CameraTestHarness() {
  const [scanResult, setScanResult] = useState(null);
  const [resultCount, setResultCount] = useState(0);

  const handleScanComplete = (resultData) => {
    setScanResult(resultData);
    setResultCount((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-surface gap-6 p-4 font-sans">

      {/* Header */}
      <div className="w-full max-w-md">
        <h1 className="text-lg font-bold text-primary">
          📷 Camera Feature — Dev Harness
        </h1>
        <p className="text-sm text-muted-dark">
          Branch: <code className="bg-muted-light px-1 rounded">abhinav-camera</code>
          &nbsp;· Scans completed: <strong>{resultCount}</strong>
        </p>
      </div>

      {/* Camera panel — fixed mobile-ish height */}
      <div className="w-full max-w-md h-[480px]">
        <CameraScanner onScanComplete={handleScanComplete} />
      </div>

      {/* Result inspector */}
      {scanResult && (
        <div
          id="camera-harness-result-panel"
          className="w-full max-w-md p-6 rounded-2xl shadow-sm bg-surface border border-muted"
        >
          <h2 className="text-sm font-semibold text-muted-dark uppercase tracking-wide mb-3">
            Last API Response — <code>/api/v1/vision/identify</code>
          </h2>

          <div className="flex flex-col gap-2">
            <ResultRow label="identified_plant_id" value={scanResult.identified_plant_id} />
            <ResultRow
              label="confidence_score"
              value={`${(scanResult.confidence_score * 100).toFixed(0)}%`}
            />
            <ResultRow
              label="is_native_to_region"
              value={scanResult.is_native_to_region ? "✅ Yes" : "❌ No"}
            />
            <ResultRow
              label="requires_rare_highlight"
              value={scanResult.requires_rare_highlight ? "🌿 Rare" : "Common"}
              highlight={scanResult.requires_rare_highlight}
            />
          </div>

          {/* Raw JSON for exact contract verification */}
          <details className="mt-4">
            <summary className="text-xs text-muted-dark cursor-pointer select-none">
              Raw JSON
            </summary>
            <pre className="mt-2 text-xs bg-muted-light rounded-xl p-3 overflow-x-auto">
              {JSON.stringify(scanResult, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-mono text-muted-dark">{label}</span>
      <span
        className={`text-sm font-semibold rounded-xl px-2 py-0.5 ${
          highlight ? "bg-accent-light text-accent-dark" : "text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
