/**
 * dashboard-page.jsx
 *
 * Scaffold placeholder for the user Dashboard UI.
 * Implements score display, badge gallery, and discovery feed.
 *
 * Styling: Tailwind semantic tokens only (bg-surface, text-primary, etc.)
 * State  : camelCase via useDashboard() hook
 */
import React from "react";
import { DashboardProvider } from "../context/dashboard-context";

const DashboardPage = () => {
  return (
    <DashboardProvider>
      <div className="flex flex-col h-full bg-surface rounded-2xl p-6 gap-4">
        <h1 className="text-xl font-semibold text-primary">
          🏆 Discovery Dashboard
        </h1>
        <p className="text-muted-dark text-sm">
          Score panel, badge gallery, and discovery feed will be implemented
          here. The <code>useDashboard()</code> hook and{" "}
          <code>postDiscovery</code> mock service are ready.
        </p>
      </div>
    </DashboardProvider>
  );
};

export default DashboardPage;
