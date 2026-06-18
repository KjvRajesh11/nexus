'use client';

interface SourcesPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function SourcesPanel({ activeTab, setActiveTab }: SourcesPanelProps) {
  return (
    <div style={{ 
      width: 278, 
      background: "#111111", 
      borderLeft: "1px solid rgba(255,255,255,0.07)", 
      display: "flex", 
      flexDirection: "column", 
      flexShrink: 0, 
      overflow: "hidden" 
    }}>
      {/* Header */}
      <div style={{ 
        padding: "12px 14px 9px", 
        borderBottom: "1px solid rgba(255,255,255,0.07)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500 }}>
          Sources & Insights
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {["Sources", "Notes"].map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)}
              style={{ 
                padding: "3px 9px", 
                borderRadius: 5, 
                fontSize: 11, 
                color: activeTab === t ? "#f0f0f0" : "#666", 
                cursor: "pointer", 
                border: "none", 
                background: activeTab === t ? "#222" : "transparent" 
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "11px" }}>
        {/* Upload Area */}
        <div style={{ 
          border: "1px dashed rgba(255,255,255,0.11)", 
          borderRadius: 10, 
          padding: "14px 12px", 
          textAlign: "center", 
          marginBottom: 10 
        }}>
          <div style={{ marginBottom: 5 }}>📤</div>
          <p style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>
            Drop PDFs, papers or links<br />
            <span style={{ color: "#d4a843" }}>or click to upload</span>
          </p>
        </div>

        <div style={{ fontSize: 9, color: "#5a5a5a", letterSpacing: "0.08em", textTransform: "uppercase", padding: "7px 0 5px" }}>
          Referenced · 4 sources
        </div>

        {/* You can keep the SOURCES data here or move it later */}
        <div style={{ color: "#888", fontSize: 12, padding: "10px 0" }}>
          Sources content will appear here...
        </div>
      </div>
    </div>
  );
}