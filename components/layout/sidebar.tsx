'use client';

interface LeftSidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenSettings: () => void;
  onNewResearch: () => void;
}

export default function LeftSidebar({ activeNav, setActiveNav, onOpenSettings, onNewResearch }: LeftSidebarProps) {
  const NAV_ITEMS = [
    { id: "chat", k: "chat", label: "Chat" },
    { id: "library", k: "library", label: "Library" },
    { id: "projects", k: "projects", label: "Projects" },
    { id: "spaces", k: "spaces", label: "Spaces", badge: "New" },
    { id: "history", k: "history", label: "History" },
    { id: "bookmarks", k: "bookmarks", label: "Bookmarks" },
    { id: "discover", k: "discover", label: "Discover" },
  ];

  const RECENTS = [
    { k: "dna", label: "Quantum computing review" },
    { k: "brain", label: "LLM alignment papers" },
    { k: "virus", label: "Gene therapy 2024" },
    { k: "universe", label: "Dark matter models" },
  ];

  return (
    <div className="nx-sidebar" style={{ 
      width: 198, 
      background: "#111111", 
      borderRight: "1px solid rgba(255,255,255,0.07)", 
      display: "flex", 
      flexDirection: "column", 
      padding: "12px 10px", 
      flexShrink: 0 
    }}>
      {/* New Research Button */}
      <button
        type="button"
        onClick={onNewResearch}
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          padding: "8px 12px", 
          borderRadius: 8, 
          background: "#1c1c1c", 
          border: "1px solid rgba(255,255,255,0.11)", 
          color: "#f0f0f0", 
          fontSize: 12, 
          cursor: "pointer", 
          marginBottom: 16 
        }}
      >
        + New Research
      </button>

      {/* Workspace Section */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ 
          fontSize: 9, 
          color: "#5a5a5a", 
          letterSpacing: "0.1em", 
          textTransform: "uppercase", 
          padding: "0 6px", 
          marginBottom: 5 
        }}>
          Workspace
        </div>
        
        {NAV_ITEMS.map(({ id, k, label, badge }) => (
          <button 
            key={id}
            type="button"
            onClick={() => setActiveNav(id)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 9, 
              padding: "7px 10px", 
              borderRadius: 8, 
              fontSize: 12, 
              color: activeNav === id ? "#f0f0f0" : "#888", 
              border: "none", 
              background: activeNav === id ? "#222" : "transparent", 
              width: "100%", 
              textAlign: "left", 
              cursor: "pointer",
              marginBottom: 1
            }}
          >
            <span style={{ width: 15 }}>{/* Icon placeholder */}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{ 
                background: "#d4a843", 
                color: "#0a0a0a", 
                fontSize: 9, 
                padding: "1px 5px", 
                borderRadius: 10, 
                fontWeight: 700 
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recent Section */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ 
          fontSize: 9, 
          color: "#5a5a5a", 
          letterSpacing: "0.1em", 
          textTransform: "uppercase", 
          padding: "0 6px", 
          marginBottom: 5 
        }}>
          Recent
        </div>
        {RECENTS.map(({ k, label }, i) => (
          <button 
            key={i} 
            style={{ 
              padding: "6px 10px", 
              borderRadius: 6, 
              fontSize: 11, 
              color: "#5a5a5a", 
              cursor: "pointer", 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              marginBottom: 1, 
              border: "none", 
              background: "transparent", 
              width: "100%", 
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 7
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div style={{ marginTop: "auto" }}>
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 8 }} />
        
        <button 
          onClick={onOpenSettings}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 9, 
            padding: "7px 10px", 
            borderRadius: 8, 
            fontSize: 12, 
            color: "#888", 
            border: "none", 
            background: "transparent", 
            width: "100%", 
            textAlign: "left", 
            cursor: "pointer" 
          }}
        >
          Settings
        </button>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 9, 
          padding: "7px 10px", 
          borderRadius: 8 
        }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, #d4a843, #c49633)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: 9, 
            color: "#0a0a0a", 
            fontWeight: 700 
          }}>
            KR
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 11, color: "#f0f0f0", fontWeight: 500 }}>Kjv Rajesh</div>
            <div style={{ fontSize: 10, color: "#5a5a5a" }}>Pro</div>
          </div>
        </div>
      </div>
    </div>
  );
}