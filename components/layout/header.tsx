'use client';

import { useState } from 'react';

interface HeaderProps {
  onToggleSources: () => void;
  onOpenSettings: () => void;
  sourcesOn: boolean;
}

export default function Header({ onToggleSources, onOpenSettings, sourcesOn }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "10px 18px", 
      background: "#111111", 
      borderBottom: "1px solid rgba(255,255,255,0.07)", 
      flexShrink: 0, 
      position: "relative", 
      zIndex: 10 
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ 
          width: 28, 
          height: 28, 
          borderRadius: 8, 
          background: "#d4a843", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          flexShrink: 0 
        }}>
          <span style={{ color: "#0a0a0a", fontWeight: 700, fontSize: 16 }}>N</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.02em" }}>Nexus</div>
          <div style={{ fontSize: 9, color: "#5a5a5a", letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 1 }}>
            Research Assistant
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <button 
          onClick={onToggleSources}
          style={{ 
            width: 30, 
            height: 30, 
            borderRadius: 8, 
            border: "1px solid rgba(255,255,255,0.08)", 
            background: sourcesOn ? "rgba(212,168,67,0.08)" : "transparent",
            color: sourcesOn ? "#d4a843" : "#666",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer"
          }}
          title="Sources panel"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>

        <button 
          onClick={onOpenSettings}
          style={{ 
            width: 30, 
            height: 30, 
            borderRadius: 8, 
            border: "1px solid rgba(255,255,255,0.08)", 
            background: "transparent",
            color: "#666",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer"
          }}
          title="Settings"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        <div style={{ position: "relative" }}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            style={{ 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              background: "linear-gradient(135deg, #d4a843, #c49633)", 
              border: "2px solid rgba(255,255,255,0.12)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: 11, 
              color: "#0a0a0a", 
              fontWeight: 700, 
              cursor: "pointer" 
            }}
          >
            KR
          </div>
        </div>
      </div>
    </div>
  );
}