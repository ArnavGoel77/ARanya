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
   Fallbacks use picsum IDs with lush green tones.
─────────────────────────────────────────────────────────────────────────────── */
const PLANT_ITEMS = [
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    title: 'Sacred Lotus'
  },
  {
    image: 'https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=600&h=400&fit=crop',
    title: 'Tropical Leaves'
  },
  {
    image: 'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?w=600&h=400&fit=crop',
    title: 'Indian Marigold'
  },
  {
    image: 'https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=600&h=400&fit=crop',
    title: 'Jungle Ferns'
  },
  {
    image: 'https://images.unsplash.com/photo-1586348943529-beaae6c28db9?w=600&h=400&fit=crop',
    title: 'Neem Leaves'
  },
  {
    image: 'https://images.unsplash.com/photo-1574684891174-df6b02ab38d7?w=600&h=400&fit=crop',
    title: 'Banyan Roots'
  },
  {
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
    title: 'Forest Path'
  },
  {
    image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&h=400&fit=crop',
    title: 'Sunlit Canopy'
  },
  {
    image: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?w=600&h=400&fit=crop',
    title: 'Jasmine Blossoms'
  },
  {
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
    title: 'Green Fronds'
  },
  {
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&h=400&fit=crop',
    title: 'Lotus Pond'
  },
  {
    image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=400&fit=crop',
    title: 'Rain Forest'
  },
  {
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
    title: 'Bamboo Grove'
  },
  {
    image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&h=400&fit=crop',
    title: 'Peepal Leaves'
  },
  {
    image: 'https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=600&h=400&fit=crop',
    title: 'Ashoka Bloom'
  },
  {
    image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&h=400&fit=crop',
    title: 'Wildflowers'
  },
  {
    image: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=600&h=400&fit=crop',
    title: 'Tulsi Shrub'
  },
  {
    image: 'https://images.unsplash.com/photo-1444065381814-865dc9da92c0?w=600&h=400&fit=crop',
    title: 'Indian Lily'
  },
];

/* ─── Modal / form states ──────────────────────────────────────────────────── */
const VIEWS = { HOME: 'home', SIGNUP: 'signup', LOGIN: 'login', ABOUT: 'about' };

export default function LandingPage() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.HOME);
  const { loginWithGoogle, signupWithGoogle, setDemoUser, currentUser } = useAuth();
  const { isInstallable, installApp } = usePWA();
  const [errorMsg, setErrorMsg] = useState("");

  const goToApp = () => navigate('/app');

  // If already logged in, redirect straight to app
  if (currentUser) {
    goToApp();
  }

  const handleSignup = async () => {
    setErrorMsg("");
    try {
      await signupWithGoogle();
      goToApp();
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign up with Google");
    }
  };

  const handleLogin = async () => {
    setErrorMsg("");
    try {
      await loginWithGoogle();
      goToApp();
    } catch (err) {
      setErrorMsg(err.message || "Failed to log in with Google");
    }
  };

  const handleDemo = () => {
    setDemoUser();
    goToApp();
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
        <div className="lp-brand">
          <div className="lp-brand-badge">
            <img src="/logo.png" alt="ARanya" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <span className="lp-brand-name">ARanya</span>
        </div>
        <button className="lp-nav-about" onClick={() => setView(v => v === VIEWS.ABOUT ? VIEWS.HOME : VIEWS.ABOUT)}>
          About
        </button>
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
              <div className="lp-about-icon">
                <img src="/logo.png" alt="ARanya" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
                    <span>Explore biodiversity hotspots and community sightings on an interactive map.</span>
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

