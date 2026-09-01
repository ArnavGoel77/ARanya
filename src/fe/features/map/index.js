/**
 * index.js — map feature barrel
 *
 * Re-exports the public surface of the map feature so that
 * consumers only need a single import path.
 */
export { default as MapPage } from "./components/map-page";
export { MapProvider, useMap } from "./context/map-context";
