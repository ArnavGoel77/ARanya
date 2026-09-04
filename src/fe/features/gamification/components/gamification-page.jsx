import React, { useState, useRef, useCallback } from "react";
import { Award, Star, Zap, Shield, Compass, ChevronRight, Sprout, Flame } from "lucide-react";
import "./gamification-page.css";

// --- Mock Data for Showcase ---
const MOCK_USER = {
  username: "EcoExplorer99",
  title: "Master Botanist",
  totalPoints: 1150,
  rank: "Top 5%",
  discoveriesCount: 24,
  avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=80"
};

const MOCK_BADGES = [
  { id: "b1", name: "Global Pioneer", tier: "diamond", icon: <Star size={28} />, isUnlocked: true, description: "Be the first in the world to discover a species.", xpReward: 1000 },
  { id: "b2", name: "Novice Botanist", tier: "bronze", icon: <Sprout size={28} />, isUnlocked: true, description: "Identify your first 10 plant species.", xpReward: 100 },
  { id: "b3", name: "Expert Botanist", tier: "silver", icon: <Award size={28} />, isUnlocked: true, description: "Successfully identify 50 native species.", xpReward: 500 },
  { id: "b4", name: "Rare Finder", tier: "gold", icon: <Zap size={28} />, isUnlocked: true, description: "Document an endangered plant.", xpReward: 300 },
  { id: "b5", name: "Night Owl", tier: "silver", icon: <Compass size={28} />, isUnlocked: true, description: "Discover 5 plants between 10PM and 4AM.", xpReward: 200 },
  { id: "b6", name: "Guardian", tier: "gold", icon: <Shield size={28} />, isUnlocked: false, description: "Report 3 conservation threats.", xpReward: 400 },
  { id: "b7", name: "Hot Streak", tier: "platinum", icon: <Flame size={28} />, isUnlocked: false, description: "Identify plants 7 days in a row.", xpReward: 250 },
  { id: "b8", name: "Nature's Friend", tier: "bronze", icon: <Sprout size={28} />, isUnlocked: false, description: "Log 5 consecutive days of activity.", xpReward: 150 },
  { id: "b9", name: "Master Tracker", tier: "diamond", icon: <Compass size={28} />, isUnlocked: false, description: "Explore 10 different geographic regions.", xpReward: 800 }
];

const MOCK_DISCOVERIES = [
  {
    id: "d1",
    name: "Croton gibsonianus",
    common: "Gibson's Croton",
    rarity: "Critically Endangered",
    points: 1100,
    date: "2 hours ago",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Croton_gibsonianus_Nimmo_%2816098381478%29.jpg"
  },
  {
    id: "d2",
    name: "Alphonsea lutea",
    common: "Madras Alphonsea",
    rarity: "Endemic",
    points: 500,
    date: "Yesterday",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Gloriosa_superba_flowers_and_leaves_at_madikai_in_Kasaragod.jpg"
  },
  {
    id: "d3",
    name: "Gloriosa superba",
    common: "Flame Lily",
    rarity: "Rare",
    points: 200,
    date: "3 days ago",
    image: "https://upload.wikimedia.org/wikipedia/commons/1/15/Gloriosa_superba_flower.jpg"
  },
  {
    id: "d4",
    name: "Santalum album",
    common: "Indian Sandalwood",
    rarity: "Vulnerable",
    points: 400,
    date: "Last week",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9b/Indian_sandalwood_Plant.jpg"
  },
  {
    id: "d5",
    name: "Azadirachta indica",
    common: "Neem",
    rarity: "Least Concern",
    points: 100,
    date: "Last week",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Azadirachta_indica_flowers_in_Guntur.jpg"
  },
  {
    id: "d6",
    name: "Ficus religiosa",
    common: "Peepal",
    rarity: "Least Concern",
    points: 150,
    date: "2 weeks ago",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a3/Peepal_%28Ficus_religiosa%29.jpg"
  },
  {
    id: "d7",
    name: "Saraca asoca",
    common: "Ashoka Tree",
    rarity: "Endangered",
    points: 650,
    date: "3 weeks ago",
    image: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Saraca_asoca_flowers.jpg"
  }
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
  return (
    <div className="gamification-container">
      {/* ── Hero Profile ── */}
      <section className="gami-hero">
        <div className="gami-avatar-ring">
          <div className="gami-avatar-inner">
            <img src="/profile.jpg" alt="Botanist Explorer" style={{width:'100%',height:'100%',objectFit:'cover'}} />
          </div>
        </div>

        <div className="gami-profile-details">
          <h1 className="gami-username">{MOCK_USER.username}</h1>
          <div className="gami-rank-badge">
            <span className="gami-rank-stars">✦</span>
            <span className="gami-rank-text">{MOCK_USER.title}</span>
            <span className="gami-rank-stars">✦</span>
          </div>

          <div className="gami-xp-bar-wrapper">
            <div className="gami-xp-bar-label">
              <span>Level 12 → Level 13</span>
              <span>1,150 / 2,000 XP</span>
            </div>
            <div className="gami-xp-bar-track">
              <div className="gami-xp-bar-fill" />
            </div>
          </div>

          <div className="gami-stats-row">
            <div className="gami-stat-box">
              <div className="gami-stat-icon">🌿</div>
              <div className="gami-stat-value">{MOCK_USER.discoveriesCount}<span>plants</span></div>
              <div className="gami-stat-label">Discoveries</div>
              <div className="gami-stat-accent" />
            </div>
            <div className="gami-stat-box">
              <div className="gami-stat-icon">🏆</div>
              <div className="gami-stat-value">{MOCK_USER.rank}</div>
              <div className="gami-stat-label">Global Rank</div>
              <div className="gami-stat-accent" />
            </div>
            <div className="gami-stat-box">
              <div className="gami-stat-icon">⚡</div>
              <div className="gami-stat-value">9<span>badges</span></div>
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
            {MOCK_BADGES.map((badge) => (
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
            {MOCK_DISCOVERIES.map((disc) => (
              <div key={disc.id} className="gami-journal-card">
                <div className="gami-journal-image-wrapper">
                  <img src={disc.image} alt={disc.name} />
                  <span className="gami-journal-rarity">{disc.rarity}</span>
                </div>
                <div className="gami-journal-content">
                  <h4 className="gami-journal-name">{disc.name}</h4>
                  <p className="gami-journal-common">{disc.common}</p>
                  <div className="gami-journal-footer">
                    <span className="gami-journal-date">{disc.date}</span>
                    <span className="gami-journal-points">+{disc.points} XP</span>
                  </div>
                </div>
              </div>
            ))}
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
