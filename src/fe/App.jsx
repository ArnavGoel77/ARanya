/**
 * App.jsx — Root application component.
 *
 * Routes:
 *   /               → LandingPage  (DriftWall hero with auth CTAs)
 *   /app            → Dashboard
 *   /app/map        → Map page
 *   /app/achievements → Gamification / Achievements page
 *   *               → redirect to /
 */
import React, { useState, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import {
  Menu, X, MessageSquare, MapPin, Award, Camera, Leaf, User,
} from "lucide-react";

/* ── Lazy-load heavy features so a crash in one doesn't kill the other ── */
const LandingPage        = React.lazy(() => import("./features/landing/components/LandingPage"));
const DashboardPage      = React.lazy(() => import("./features/dashboard/components/dashboard-page"));
const MapPage            = React.lazy(() => import("@fe/features/map/components/map-page"));
const BotanistChatWindow = React.lazy(() => import("@fe/features/botanist_chat/components/botanist-chat-window"));
const GamificationPage   = React.lazy(() => import("@fe/features/gamification/components/gamification-page"));

import "./app-layout.css";

/* ─── Simple error boundary ─────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[ARanya ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0a160d", color: "#e5dcc5", fontFamily: "Inter, sans-serif",
          padding: "2rem", textAlign: "center", gap: "1rem"
        }}>
          <div style={{ fontSize: "2rem" }}>🌿</div>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Something went wrong</h2>
          <pre style={{
            background: "rgba(255,255,255,0.06)", borderRadius: "8px",
            padding: "1rem", fontSize: "0.75rem", color: "#f87171",
            maxWidth: "600px", overflowX: "auto", textAlign: "left"
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
            style={{
              background: "#2e6b42", color: "#fff", border: "none",
              borderRadius: "10px", padding: "10px 24px", cursor: "pointer",
              fontSize: "0.875rem", fontWeight: 600
            }}
          >
            ← Back to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Minimal loading fallback ───────────────────────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0a160d"
    }}>
      <Leaf size={28} color="#4a9c62" style={{ opacity: 0.7 }} />
    </div>
  );
}

/* ─── Main app shell (sidebar + topbar + routes) ─────────────────────────── */
function AppLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsChatOpen(true);
    window.addEventListener("aranya:open-chat", handler);
    return () => window.removeEventListener("aranya:open-chat", handler);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);
  const goTo = (path) => { closeSidebar(); navigate(path); };

  return (
    <>
      {/* ── Global Sidebar ─────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div className="agl-sidebar-overlay" onClick={closeSidebar}>
          <aside className="agl-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="agl-sidebar-header">
              <div className="agl-sidebar-brand">
                <div className="agl-brand-badge">A</div>
                <span className="agl-brand-name">ARanya</span>
              </div>
              <button className="agl-close-btn" onClick={closeSidebar} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="agl-sidebar-nav">
              <button className="agl-feature-btn" onClick={() => { closeSidebar(); setIsChatOpen(true); }}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #2a3e34, #4a7c59)" }}>
                  <MessageSquare size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Botanist Chat</span>
                  <span className="agl-feature-desc">Ask the AI plant guide</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/app/map")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #5a3e20, #a07040)" }}>
                  <MapPin size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Species Map</span>
                  <span className="agl-feature-desc">Explore local biodiversity</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/app/achievements")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #8a3e2a, #c07050)" }}>
                  <Award size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">Achievements</span>
                  <span className="agl-feature-desc">Your discovery milestones</span>
                </div>
              </button>

              <button className="agl-feature-btn" onClick={() => goTo("/app")}>
                <div className="agl-feature-icon" style={{ background: "linear-gradient(135deg, #1a3a50, #2a6080)" }}>
                  <Camera size={16} color="#e5dcc5" />
                </div>
                <div className="agl-feature-text">
                  <span className="agl-feature-label">AR Scanner</span>
                  <span className="agl-feature-desc">Identify plants in real-time</span>
                </div>
              </button>
            </nav>

            <div className="agl-sidebar-footer">
              <Leaf size={14} color="#a08355" />
              <span>ARanya · Biodiversity OS</span>
            </div>
          </aside>
        </div>
      )}

      {/* ── Global Top Bar ─────────────────────────────────────────── */}
      <header className="agl-topbar">
        <div className="agl-topbar-left">
          <button className="agl-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} color="#2a3e34" />
          </button>
          <button className="agl-brand" onClick={() => goTo("/app")} aria-label="Go home">
            <div className="agl-brand-badge">A</div>
            <span className="agl-brand-name">ARanya</span>
          </button>
        </div>
        <button className="agl-profile-btn" onClick={() => goTo("/app/achievements")} aria-label="Profile">
          <User size={18} color="#2a3e34" />
        </button>
      </header>

      {/* ── Page Content ────────────────────────────────────────────── */}
      <main className="agl-page-content">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={<DashboardPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="achievements" element={<GamificationPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* ── Global Botanist Chat Modal ─────────────────────────────── */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <BotanistChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

/* ─── Root with routing ──────────────────────────────────────────────────── */
export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Landing page — full-screen DriftWall hero */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <LandingPage />
              </Suspense>
            }
          />

          {/* Main app shell */}
          <Route path="/app/*" element={<AppLayout />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
