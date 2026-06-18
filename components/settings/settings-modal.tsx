'use client';

import { useState } from 'react';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState({
    deepSearch: true,
    webSearch: true,
    citations: true,
    autoSave: false,
    motion: false,
    dark: true,
  });

  const toggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.72)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 100 
      }} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ 
        background: "#111", 
        border: "1px solid rgba(255,255,255,0.11)", 
        borderRadius: 14, 
        width: 520, 
        maxHeight: "80vh", 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden" 
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "15px 20px", 
          borderBottom: "1px solid rgba(255,255,255,0.07)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚙️</span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Settings</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 168, borderRight: "1px solid rgba(255,255,255,0.07)", padding: "10px 8px" }}>
            {["General", "Appearance", "Models"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t.toLowerCase())}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  textAlign: "left",
                  background: tab === t.toLowerCase() ? "#222" : "transparent",
                  color: tab === t.toLowerCase() ? "#f0f0f0" : "#888",
                  border: "none",
                  borderRadius: 7,
                  marginBottom: 2,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
            {tab === "general" && (
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 12, textTransform: "uppercase" }}>
                  General
                </div>
                {Object.keys(settings).map((key) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div>{key}</div>
                    <button onClick={() => toggle(key)}>Toggle</button>
                  </div>
                ))}
              </div>
            )}
            {tab === "appearance" && <div>Appearance settings coming soon...</div>}
            {tab === "models" && <div>Model selection coming soon...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}