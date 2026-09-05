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
  Menu, X, MessageSquare, MapPin, Award, Camera, Leaf, User, LogOut, Download
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

import { db } from "@fe/config/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

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

/* ─── Chat History List Component ────────────────────────────────────────── */
function ChatHistoryList() {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const fetchThreads = async () => {
      if (!currentUser?.uid) return;
      try {
        const q = query(
          collection(db, "chat_threads"),
          where("user_id", "==", currentUser.uid),
          limit(5)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort locally to avoid needing a composite index
        data.sort((a, b) => {
          const tA = a.created_at?.toMillis() || 0;
          const tB = b.created_at?.toMillis() || 0;
          return tB - tA;
        });
        setThreads(data);
      } catch (err) {
        console.error("Error fetching chat threads", err);
      }
    };
    fetchThreads();
    
    // Add custom event listener for refreshing when new chat starts
    const handler = () => fetchThreads();
    window.addEventListener("aranya:refresh-chats", handler);
    return () => window.removeEventListener("aranya:refresh-chats", handler);
  }, [currentUser]);

  if (!threads.length) {
    return <div style={{ fontSize: "0.8rem", color: "#6b7a70", fontStyle: "italic" }}>No recent conversations</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {threads.map(t => (
        <button 
          key={t.id} 
          onClick={() => {
            window.dispatchEvent(new CustomEvent("aranya:open-chat", { detail: { threadId: t.id } }));
          }}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.5rem 0.75rem",
            background: "rgba(42, 62, 52, 0.05)", border: "1px solid rgba(42, 62, 52, 0.1)", borderRadius: "8px",
            color: "#2a3e34", fontSize: "0.8rem", textAlign: "left", cursor: "pointer"
          }}
        >
          <MessageSquare size={14} color="#a08355" />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t.plant_name || "General Inquiry"}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─── Main app shell (sidebar + topbar + routes) ─────────────────────────── */
function AppLayout() {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setIsChatOpen(true);
      setActiveThreadId(e.detail?.threadId || null);
    };
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
                <img src="/logo.png" alt="ARanya" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
                <span className="agl-brand-name">ARanya</span>
              </div>
              <button className="agl-close-btn" onClick={closeSidebar} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <nav className="agl-sidebar-nav">
              <button className="agl-feature-btn" onClick={() => { closeSidebar(); setActiveThreadId(null); setIsChatOpen(true); }}>
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

            <div style={{ padding: "0 1.5rem", marginTop: "1rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#a08355", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.75rem" }}>
                Past Conversations
              </div>
              <ChatHistoryList />
            </div>

            {isInstallable && (
              <div style={{ padding: "1rem 1.5rem", marginTop: "auto" }}>
                <button 
                  onClick={installApp}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    background: "linear-gradient(135deg, #2a3e34, #4a7c59)",
                    color: "#e5dcc5",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Download size={16} />
                  Install App
                </button>
              </div>
            )}

            <div className="agl-sidebar-footer" style={{ marginTop: isInstallable ? "0.5rem" : "auto" }}>
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
            <img src="/logo.png" alt="ARanya" style={{ width: '24px', height: '24px', objectFit: 'contain', borderRadius: '50%' }} />
            <span className="agl-brand-name">ARanya</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '2rem',
              backgroundColor: 'rgba(217, 83, 79, 0.08)',
              border: '1px solid rgba(217, 83, 79, 0.15)',
              color: '#d9534f',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            title="Sign out"
          >
            <LogOut size={14} />
            <span className="hidden-on-mobile">Sign Out</span>
          </button>
          <button className="agl-profile-btn" onClick={() => goTo("/app/achievements")} aria-label="Profile">
            {currentUser?.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={18} color="#2a3e34" />
            )}
          </button>
        </div>
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
          <BotanistChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} activeThreadId={activeThreadId} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

import { AuthProvider, useAuth } from "@fe/contexts/AuthContext";
import { PWAProvider, usePWA } from "@fe/hooks/usePWA";

/* ─── Protected Route ────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/* ─── Root with routing ──────────────────────────────────────────────────── */
export default function App() {
  return (
    <PWAProvider>
      <AuthProvider>
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
            <Route 
              path="/app/*" 
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
        </Router>
      </AuthProvider>
    </PWAProvider>
  );
}
