'use client';

import ExportButton from '@/components/chat/export-button';
import { Message } from '@/app/page';

interface HeaderProps {
  onToggleSources: () => void;
  onOpenSettings: () => void;
  sourcesOn: boolean;
  messages?: Message[];
  activeNav?: string;
}

export default function Header({
  onToggleSources,
  onOpenSettings,
  sourcesOn,
  messages = [],
  activeNav = 'chat',
}: HeaderProps) {
  return (
    <div className="nx-header" style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between", 
      padding: "10px 18px", 
      background: "#000000", 
      borderBottom: "1px solid rgba(255,255,255,0.08)", 
      flexShrink: 0, 
      height: 48,
      fontFamily: "var(--font-space-grotesk)",
      zIndex: 10 
    }}>
      
      {/* Model Selection Dropdown (Left side) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "var(--fs-meta)", color: "#52525b", fontWeight: 500 }}>Model:</span>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6,
          background: "#09090b",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: "var(--fs-meta)",
          color: "#ffffff",
          cursor: "pointer",
          userSelect: "none"
        }}>
          <span>Nexus-Pro-v4</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Centered Search Workspace Input */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", maxWidth: "40%", margin: "0 20px" }}>
        <div style={{ 
          position: "relative",
          width: "100%",
          maxWidth: 320
        }}>
          <span style={{ 
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#52525b",
            display: "flex"
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search workspace..."
            style={{
              width: "100%",
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 4,
              padding: "5px 10px 5px 28px",
              fontSize: "var(--fs-meta)",
              color: "#ffffff",
              outline: "none",
              fontFamily: "var(--font-geist-sans)"
            }}
          />
        </div>
      </div>

      {/* Action Buttons (Right side) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        
        {/* Toggle Sources Sidebar */}
        <button 
          onClick={onToggleSources}
          style={{ 
            width: 28, 
            height: 28, 
            borderRadius: 4, 
            border: "1px solid rgba(255,255,255,0.08)", 
            background: sourcesOn ? "rgba(255,255,255,0.05)" : "transparent",
            color: sourcesOn ? "#ffffff" : "#71717a",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s"
          }}
          title="Toggle sources side panel"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>

        {/* Export Options (Active in chat route) */}
        {activeNav === 'chat' && messages.length > 0 && (
          <ExportButton messages={messages} />
        )}

        {/* Share Workspace Button */}
        <button 
          style={{ 
            display: "flex",
            alignItems: "center",
            gap: 6,
            height: 28, 
            borderRadius: 4, 
            border: "1px solid rgba(255,255,255,0.08)", 
            background: "transparent",
            color: "#ffffff",
            padding: "0 10px",
            cursor: "pointer",
            fontSize: "var(--fs-meta)",
            fontWeight: 500,
            transition: "all 0.15s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share
        </button>

      </div>
    </div>
  );
}