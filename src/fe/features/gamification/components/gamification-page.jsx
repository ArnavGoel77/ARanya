import React, { useState, useRef, useCallback, useEffect } from "react";
import { Award, Star, Zap, Shield, Compass, ChevronRight, Sprout, Flame, LogOut } from "lucide-react";
import { useAuth } from "@fe/contexts/AuthContext";
import { db } from "@fe/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./gamification-page.css";

// --- Real Badge Directory (IDs must match Backend / Firestore) ---
const BADGE_DIRECTORY = [
  { id: "badge_global_pioneer", name: "Global Pioneer", tier: "diamond", icon: <Star size={28} />, isUnlocked: false, description: "Be the first in the world to discover a species.", xpReward: 1000 },
  { id: "badge_novice", name: "Novice Botanist", tier: "bronze", icon: <Sprout size={28} />, isUnlocked: false, description: "Identify your first 10 plant species.", xpReward: 100 },
  { id: "badge_expert", name: "Expert Botanist", tier: "silver", icon: <Award size={28} />, isUnlocked: false, description: "Successfully identify 50 native species.", xpReward: 500 },
  { id: "badge_endemic_explorer", name: "Endemic Explorer", tier: "gold", icon: <Zap size={28} />, isUnlocked: false, description: "Document an endangered plant.", xpReward: 300 },
  { id: "badge_ghats_guardian", name: "Ghats Guardian", tier: "silver", icon: <Shield size={28} />, isUnlocked: false, description: "Report 3 conservation threats.", xpReward: 400 },
  { id: "badge_riparian_ranger", name: "Riparian Ranger", tier: "diamond", icon: <Compass size={28} />, isUnlocked: false, description: "Explore 10 different geographic regions.", xpReward: 800 },
  { id: "b7", name: "Hot Streak", tier: "platinum", icon: <Flame size={28} />, isUnlocked: false, description: "Identify plants 7 days in a row.", xpReward: 250 },
  { id: "b8", name: "Nature's Friend", tier: "bronze", icon: <Sprout size={28} />, isUnlocked: false, description: "Log 5 consecutive days of activity.", xpReward: 150 },
  { id: "b9", name: "Night Owl", tier: "silver", icon: <Compass size={28} />, isUnlocked: false, description: "Discover 5 plants between 10PM and 4AM.", xpReward: 200 }
];

const ShinyBadgeCard = ({ badge }) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation limits (max 20 deg)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -((y - centerY) / centerY) * 20;
    const rotateY = ((x - centerX) / centerX) * 20;

    // Calculate glare position
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      '--glare-x': `${glareX}%`,
      '--glare-y': `${glareY}%`
    });
  }, [badge.isUnlocked]);

  const handleMouseLeave = useCallback(() => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      '--glare-x': '50%',
      '--glare-y': '50%',
      transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)'
    });
  }, [badge.isUnlocked]);

  const handleMouseEnter = useCallback(() => {
    setStyle((prev) => ({
      ...prev,
      transition: 'none' // Remove transition on enter to strictly follow mouse
    }));
  }, [badge.isUnlocked]);

  return (
    <div
      className={`gami-badge-wrapper ${badge.isUnlocked ? "unlocked" : "locked"}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div className="gami-badge-card" ref={cardRef} style={style}>
        {/* Holographic Glare Layer */}
        <div className="gami-glare"></div>

        <div className="gami-badge-inner">
          <div className={`gami-badge-front tier-${badge.tier}`}>
            <div className="gami-badge-icon-wrapper">
              {badge.icon}
            </div>
            <span className="gami-badge-name">{badge.name}</span>
          </div>

          <div className="gami-badge-back">
            <span className="gami-badge-back-title">{badge.name}</span>
            <p className="gami-badge-desc">{badge.description}</p>
            <div className="gami-badge-xp">+{badge.xpReward} XP</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GamificationPage() {
  const { currentUser, logout } = useAuth();
  const [userData, setUserData] = useState({
    totalPoints: 0,
    discoveriesCount: 0,
    badges: [],
    discoveries: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        let fetchedData = { totalPoints: 0, discoveriesCount: 0, badges: [], discoveries: [] };
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          fetchedData.totalPoints = data.total_score || 0;
          fetchedData.discoveriesCount = data.discoveries_count || 0;
          fetchedData.badges = data.badges || [];
        }

        // Fetch recent discoveries from backend (or use mock)
        const response = await fetch(`/api/v1/users/${currentUser.uid}/discoveries`);
        if (response.ok) {
          const json = await response.json();
          if (json.data && Array.isArray(json.data.discoveries)) {
            fetchedData.discoveries = json.data.discoveries;
          }
        }
        
        setUserData(fetchedData);
      } catch (error) {
        console.error("Error fetching gamification data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Merge unlocked badges
  const displayBadges = BADGE_DIRECTORY.map(b => ({
    ...b,
    isUnlocked: userData.badges.includes(b.id)
  }));

  // Calculate Level dynamically (200 XP per level)
  const currentLevel = Math.floor(userData.totalPoints / 200) + 1;
  const nextLevelXp = currentLevel * 200;

  return (
    <div className="gamification-container">
      {/* ── Hero Profile ── */}
      <section className="gami-hero" style={{ position: 'relative' }}>
        <button 
          onClick={logout}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          title="Sign out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>

        <div className="gami-avatar-ring">
          <div className="gami-avatar-inner">
            <img src={currentUser?.photoURL || "/profile.jpg"} alt={currentUser?.displayName || "Explorer"} style={{width:'100%',height:'100%',objectFit:'cover'}} />
          </div>
        </div>

        <div className="gami-profile-details">
          <h1 className="gami-username">{currentUser?.displayName || "EcoExplorer99"}</h1>
          <div className="gami-rank-badge">
            <span className="gami-rank-stars">✦</span>
            <span className="gami-rank-text">Level {currentLevel} Botanist</span>
            <span className="gami-rank-stars">✦</span>
          </div>

          <div className="gami-xp-bar-wrapper">
            <div className="gami-xp-bar-label">
              <span>Level {currentLevel} → Level {currentLevel + 1}</span>
              <span>{userData.totalPoints} / {nextLevelXp} XP</span>
            </div>
            <div className="gami-xp-bar-track">
              <div className="gami-xp-bar-fill" style={{ width: `${Math.min(100, (userData.totalPoints / nextLevelXp) * 100)}%` }} />
            </div>
          </div>

          <div className="gami-stats-row">
            <div className="gami-stat-box">
              <div className="gami-stat-icon">🌿</div>
              <div className="gami-stat-value">{userData.discoveriesCount}<span>plants</span></div>
              <div className="gami-stat-label">Discoveries</div>
              <div className="gami-stat-accent" />
            </div>
            <div className="gami-stat-box">
              <div className="gami-stat-icon">🏆</div>
              <div className="gami-stat-value">Top 10%</div>
              <div className="gami-stat-label">Global Rank</div>
              <div className="gami-stat-accent" />
            </div>
            <div className="gami-stat-box">
              <div className="gami-stat-icon">⚡</div>
              <div className="gami-stat-value">{userData.badges.length}<span>badges</span></div>
              <div className="gami-stat-label">Achievements</div>
              <div className="gami-stat-accent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid Layout ── */}
      <div className="gami-dashboard-grid">

        {/* Badges Section */}
        <section className="gami-section">
          <h3 className="gami-section-title">
            <Award size={24} className="glow-icon" />
            <span className="dynamic-title-text">Achievements</span>
          </h3>
          <div className="gami-badges-grid">
            {displayBadges.map((badge) => (
              <ShinyBadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </section>

        {/* Recent Discoveries Section */}
        <section className="gami-section">
          <h3 className="gami-section-title">
            <Sprout size={24} className="glow-icon" />
            <span className="dynamic-title-text">Field Journal</span>
          </h3>
          <div className="gami-discoveries-gallery">
            {userData.discoveries.length > 0 ? (
              userData.discoveries.map((disc) => (
                <div key={disc.plant_id} className="gami-journal-card">
                  <div className="gami-journal-image-wrapper">
                    {/* Placeholder image for now, real implementation would fetch plant image */}
                    <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&q=80" alt={disc.scientific_name} />
                    <span className="gami-journal-rarity">{disc.conservation_status}</span>
                  </div>
                  <div className="gami-journal-content">
                    <h4 className="gami-journal-name">{disc.scientific_name}</h4>
                    <p className="gami-journal-common">{disc.common_name}</p>
                    <div className="gami-journal-footer">
                      <span className="gami-journal-date">{new Date(disc.discovered_at).toLocaleDateString('en-GB')}</span>
                      <span className="gami-journal-points">+{disc.points_earned || 100} XP</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6b7a70", gridColumn: "1 / -1" }}>
                No discoveries yet. Go out and scan some plants!
              </div>
            )}
          </div>
        </section>

        {/* Baby Groot Easter Egg */}
        <div className="groot-container">
          <div className="groot-bubble">I am Groot! 🌿</div>
          <svg viewBox="0 0 100 100" width="120" height="120" className="groot-svg">
            <path d="M 50 25 Q 30 5 60 10 Q 70 25 50 25" fill="#4ade80" className="groot-leaf" />
            <path d="M 25 50 L 30 25 L 40 40 L 50 20 L 60 35 L 70 30 L 75 50 C 80 75 20 75 25 50 Z" fill="#8B5A2B" />
            <circle cx="38" cy="55" r="6" fill="#111" />
            <circle cx="62" cy="55" r="6" fill="#111" />
            <circle cx="40" cy="53" r="2" fill="#fff" />
            <circle cx="64" cy="53" r="2" fill="#fff" />
            <path d="M 42 68 Q 50 75 58 68" stroke="#3e2723" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
