/**
 * LandingPage.jsx — ARanya landing page with DriftWall background.
 * Features Sign Up, Log In, Demo Guest, and About — all frontend only.
 * Auth forms redirect to /app on submit.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, X, ArrowRight, User, Lock, Mail, Eye, EyeOff, ChevronDown, Download } from 'lucide-react';
import DriftWall from '@fe/components/shared-ui/DriftWall';
import { useAuth } from '@fe/contexts/AuthContext';
import { usePWA } from '@fe/hooks/usePWA';
import './LandingPage.css';

/* ─── Indian native plant images ─────────────────────────────────────────────
   All URLs are from Unsplash (free-to-use) featuring Indian flora.
   Fallbacks use picsum IDs.
─────────────────────────────────────────────────────────────────────────────── */
const NATIVE_PLANT_NAMES = [
  'Sacred Lotus', 'Banyan Tree', 'Neem Leaves', 'Indian Marigold',
  'Tulsi Shrub', 'Jasmine Blossoms', 'Peepal Leaves', 'Ashoka Bloom',
  'Banana Leaves', 'Tamarind', 'Coconut Fronds', 'Mango Leaves',
  'Parijat', 'Turmeric', 'Hibiscus', 'Moringa', 'Curry Leaves', 'Indian Aloe'
];
const PLANT_ITEMS = NATIVE_PLANT_NAMES.map((name, i) => ({
  image: `https://loremflickr.com/600/400/plant,flora,india?lock=${i + 1}`,
  title: name
}));

/* ─── Modal / form states ──────────────────────────────────────────────────── */
const VIEWS = { HOME: 'home', SIGNUP: 'signup', LOGIN: 'login', ABOUT: 'about' };

export default function LandingPage() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.HOME);
  const { loginWithGoogle, signupWithGoogle, setDemoUser, currentUser } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [errorMsg, setErrorMsg] = useState("");

  const goToApp = () => navigate('/app');

  React.useEffect(() => {
    if (currentUser) {
      navigate('/app');
    }
  }, [currentUser, navigate]);

  const handleSignup = async () => {
    setErrorMsg("");
    try {
      await signupWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign up with Google");
    }
  };

  const handleLogin = async () => {
    setErrorMsg("");
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrorMsg(err.message || "Failed to log in with Google");
    }
  };

  const handleDemo = () => {
    setDemoUser();
  };

  return (
    <div className="lp-root">
      {/* ── DriftWall background ──────────────────────────────────────── */}
      <div className="lp-wall">
        <DriftWall
          items={PLANT_ITEMS}
          columns={6}
          tileWidth={210}
          tileHeight={140}
          gap={16}
          tilt={14}
          turn={-10}
          perspective={1300}
          depth={100}
          speed={38}
          direction="up"
          variance={0.5}
          parallax={0.55}
          lift={60}
          fade={0.55}
          dim={0.5}
          overlayColor="#1a3528"
        />
      </div>

      {/* ── Dark gradient scrim over the wall ────────────────────────── */}
      <div className="lp-scrim" />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="lp-topbar">
        <button className="lp-nav-about" onClick={() => setView(v => v === VIEWS.ABOUT ? VIEWS.HOME : VIEWS.ABOUT)}>
          About
        </button>
        <div className="lp-brand">
          <span className="lp-brand-name">ARanya</span>
          <div className="lp-brand-badge" style={{ background: 'transparent' }}>
            <img src="/logo.png" alt="ARanya Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
        </div>
      </header>

      {/* ── Central card ─────────────────────────────────────────────── */}
      <main className="lp-stage">

        {/* ── Default hero view ──────────────────────────────────────── */}
        {view === VIEWS.HOME && (
          <div className="lp-card lp-card--hero">
            <div className="lp-hero-eyebrow">
              <Leaf size={13} color="#7ec87e" />
              <Leaf size={13} color="#2a3e34" />
              <span>India's Biodiversity OS</span>
            </div>
            <h1 className="lp-hero-title">
              Discover the <em>living world</em><br />around you
            </h1>
            <p className="lp-hero-sub">
              Identify plants, explore species maps, and chat with an AI botanist guide — all powered by India's native flora.
            </p>

              <div className="lp-cta-grid">
                {isInstallable && (
                  <button 
                    className="lp-btn lp-btn--primary lp-btn--wide" 
                    style={{ background: "linear-gradient(135deg, #2a3e34, #4a7c59)", border: "none" }} 
                    onClick={installApp}
                  >
                    <Download size={16} />
                    Install Web App
                  </button>
                )}
                {currentUser ? (
                  <button className="lp-btn lp-btn--primary lp-btn--wide" onClick={goToApp}>
                    <ArrowRight size={16} />
                    Open App
                  </button>
                ) : (
                  <>
                    <button className="lp-btn lp-btn--primary" onClick={() => setView(VIEWS.SIGNUP)}>
                      <User size={16} />
                      Sign Up
                    </button>
                    <button className="lp-btn lp-btn--secondary" onClick={() => setView(VIEWS.LOGIN)}>
                      <Lock size={16} />
                      Log In
                    </button>
                    <button className="lp-btn lp-btn--ghost lp-btn--wide" onClick={handleDemo}>
                      <ArrowRight size={16} />
                      Demo Account
                    </button>
                  </>
                )}
              </div>

            <button className="lp-about-nudge" onClick={() => setView(VIEWS.ABOUT)}>
              <span>What is ARanya?</span>
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        {/* ── Sign Up form ───────────────────────────────────────────── */}
        {view === VIEWS.SIGNUP && (
          <div className="lp-card lp-card--form">
            <div className="lp-form-header">
              <h2>Create your account</h2>
              <button className="lp-close-btn" onClick={() => setView(VIEWS.HOME)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="lp-form">
              {errorMsg && <p className="lp-error-msg" style={{color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center'}}>{errorMsg}</p>}
              <button type="button" onClick={handleSignup} className="lp-btn lp-btn--primary lp-btn--full">
                Sign up with Google
                <ArrowRight size={15} />
              </button>
            </div>

            <p className="lp-form-footer">
              Already have an account?{' '}
              <button className="lp-link" onClick={() => setView(VIEWS.LOGIN)}>Log in</button>
            </p>
          </div>
        )}

        {/* ── Log In form ────────────────────────────────────────────── */}
        {view === VIEWS.LOGIN && (
          <div className="lp-card lp-card--form">
            <div className="lp-form-header">
              <h2>Welcome back</h2>
              <button className="lp-close-btn" onClick={() => setView(VIEWS.HOME)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="lp-form">
              {errorMsg && <p className="lp-error-msg" style={{color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center'}}>{errorMsg}</p>}
              <button type="button" onClick={handleLogin} className="lp-btn lp-btn--primary lp-btn--full">
                Sign in with Google
                <ArrowRight size={15} />
              </button>
            </div>

            <p className="lp-form-footer">
              No account yet?{' '}
              <button className="lp-link" onClick={() => setView(VIEWS.SIGNUP)}>Sign up</button>
            </p>
          </div>
        )}

        {/* ── About panel ────────────────────────────────────────────── */}
        {view === VIEWS.ABOUT && (
          <div className="lp-card lp-card--about">
            <div className="lp-form-header">
              <h2>About ARanya</h2>
              <button className="lp-close-btn" onClick={() => setView(VIEWS.HOME)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="lp-about-body">
              <div className="lp-about-icon" style={{ background: 'transparent', border: 'none' }}>
                <img src="/logo.png" alt="ARanya Logo" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <p>
                <strong>ARanya</strong> (अरण्य) — Sanskrit for <em>forest</em> — is a biodiversity exploration platform built for India's rich native flora.
              </p>
              <ul className="lp-about-list">
                <li>
                  <span className="lp-about-dot" style={{ background: '#4a7c59' }} />
                  <div>
                    <strong>AR Plant Scanner</strong>
                    <span>Point your camera to identify plants in real-time using AI.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-about-dot" style={{ background: '#a07040' }} />
                  <div>
                    <strong>Species Map</strong>
                    <span>Track your botanical journey by mapping the exact locations of your personal plant sightings.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-about-dot" style={{ background: '#2a6080' }} />
                  <div>
                    <strong>Botanist Chat</strong>
                    <span>Ask an AI guide about medicinal uses, ecology, and folklore of Indian plants.</span>
                  </div>
                </li>
                <li>
                  <span className="lp-about-dot" style={{ background: '#8a3e2a' }} />
                  <div>
                    <strong>Achievements</strong>
                    <span>Earn badges as you discover and log new plant species in your area.</span>
                  </div>
                </li>
              </ul>

              <div className="lp-about-actions">
                <button className="lp-btn lp-btn--primary" onClick={() => setView(VIEWS.SIGNUP)}>
                  Get Started
                  <ArrowRight size={15} />
                </button>
                <button className="lp-btn lp-btn--ghost" onClick={handleDemo}>
                  Demo Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <Leaf size={12} color="#6b7c6b" />
        <Leaf size={12} color="#a08355" />
        <span>ARanya · Biodiversity OS · India</span>
      </footer>
    </div>
  );
}

