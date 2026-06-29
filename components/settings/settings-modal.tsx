'use client';

interface Settings {
  webSearch: boolean;
  deepSearch: boolean;
  showTrace: boolean;
}

interface SettingsModalProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onClose: () => void;
}

export default function SettingsModal({ settings, onSettingsChange, onClose }: SettingsModalProps) {
  const toggle = (key: keyof Settings) => {
    const next = { ...settings, [key]: !settings[key] };
    localStorage.setItem("nexus_settings", JSON.stringify(next));
    onSettingsChange(next);
  };

  const ToggleSwitch = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <div 
      onClick={onClick}
      style={{
        width: 34,
        height: 20,
        borderRadius: 10,
        background: active ? "#ffffff" : "rgba(255,255,255,0.06)",
        border: active ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.12)",
        position: "relative",
        cursor: "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0
      }}
    >
      <div style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        background: active ? "#000000" : "#a1a1aa",
        position: "absolute",
        top: 2,
        left: active ? 16 : 2,
        transition: "all 0.15s ease"
      }} />
    </div>
  );

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.75)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 100,
        backdropFilter: "blur(4px)"
      }} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ 
        background: "#09090b", 
        border: "1px solid rgba(255,255,255,0.08)", 
        borderRadius: 12, 
        width: 480, 
        maxHeight: "85vh", 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "16px 20px", 
          borderBottom: "1px solid rgba(255,255,255,0.06)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13 }}>⚙️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f4f4f5", fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
              Research Engine Settings
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "#71717a", 
              cursor: "pointer", 
              fontSize: 14,
              transition: "color 0.15s" 
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#f4f4f5"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Section: Retrieval */}
          <div>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, fontFamily: "var(--font-space-grotesk)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Literature Retrieval
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Toggle 1: Web Search */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#f4f4f5", fontFamily: "var(--font-geist-sans)" }}>Web & Academic Search</div>
                  <div style={{ fontSize: 10.5, color: "#71717a", lineHeight: 1.4 }}>
                    Query official OpenAlex and Semantic Scholar databases in real time to fetch relevant peer-reviewed papers.
                  </div>
                </div>
                <ToggleSwitch active={settings.webSearch} onClick={() => toggle("webSearch")} />
              </div>

              {/* Toggle 2: Deep Search */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 24, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#f4f4f5" }}>Agentic Deep Search</div>
                  <div style={{ fontSize: 10.5, color: "#71717a", lineHeight: 1.4 }}>
                    Enable multi-step query rewriting, semantic re-ranking, and self-correction reasoning loops (up to 2 attempts).
                  </div>
                </div>
                <ToggleSwitch active={settings.deepSearch} onClick={() => toggle("deepSearch")} />
              </div>
            </div>
          </div>

          {/* Section: Debug & Logs */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, fontFamily: "var(--font-space-grotesk)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Observability & Interface
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#f4f4f5" }}>Show Agent Trace Logs</div>
                <div style={{ fontSize: 10.5, color: "#71717a", lineHeight: 1.4 }}>
                  Display the interactive, terminal-style step trace (Query Rewriting → Retrieval → Re-ranking → Evaluation).
                </div>
              </div>
              <ToggleSwitch active={settings.showTrace} onClick={() => toggle("showTrace")} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end", 
          padding: "12px 20px", 
          background: "#0c0c0e", 
          borderTop: "1px solid rgba(255,255,255,0.06)" 
        }}>
          <button 
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "none",
              borderRadius: 4,
              color: "#000000",
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 16px",
              cursor: "pointer",
              fontFamily: "var(--font-space-grotesk)",
              letterSpacing: "0.02em"
            }}
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
}