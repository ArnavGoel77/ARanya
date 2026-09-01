/**
 * index.js — dashboard feature barrel
 *
 * Re-exports the public surface of the dashboard feature so that
 * consumers only need a single import path.
 */
export { default as DashboardPage } from "./components/dashboard-page";
export { DashboardProvider, useDashboard } from "./context/dashboard-context";
