/**
 * main.jsx — React application entry point.
 * Mounts the App component into the #root div defined in index.html.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
