'use client';

import { useState, useEffect } from 'react';

interface LeftSidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  onOpenSettings: () => void;
  onNewResearch: () => void;
  conversations: Array<{ id: string; title: string }>;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
}

export default function LeftSidebar({
  activeNav,
  setActiveNav,
  onOpenSettings,
  onNewResearch,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: LeftSidebarProps) {
  const [width, setWidth] = useState(240);

  useEffect(() => {
    const saved = localStorage.getItem("nexus_sidebar_width");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 220 && parsed <= 400) {
        setWidth(parsed);
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(220, Math.min(400, startWidth + deltaX));
      setWidth(newWidth);
      localStorage.setItem("nexus_sidebar_width", newWidth.toString());
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Map user selections to the visual groups matching the screenshot
  const NAV_ITEMS = [
    {
      id: "chat",
      label: "Synthesis Console",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    },
    {
      id: "history",
      label: "Research History",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: "library",
      label: "Knowledge Base",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
  ];

  return (
    <div className="nx-sidebar" style={{
      width: width,
      background: "#09090b",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      padding: "16px 12px",
      flexShrink: 0,
      fontFamily: "var(--font-geist-sans)",
      position: "relative"
    }}>

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 6, marginBottom: 28 }}>
        <div style={{
          width: 20,
          height: 20,
          background: "#ffffff",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000000",
          flexShrink: 0
        }}>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.5 0L2 9h5v7l7.5-9H9v-7L9.5 0z" />
          </svg>
        </div>
        <div style={{
          fontSize: "var(--fs-heading-sm)",
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "0.02em"
        }}>
          Nexus AI
        </div>
      </div>

      {/* Workspace Section */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: "var(--fs-meta)",
          color: "#52525b",
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "0 8px",
          marginBottom: 8,
          fontWeight: 600
        }}>
          Workspace
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map(({ id, label, icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveNav(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 4,
                  fontSize: "var(--fs-card)",
                  color: isActive ? "#ffffff" : "#a1a1aa",
                  border: isActive ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                  background: isActive ? "#18181b" : "transparent",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: isActive ? 500 : 400,
                  transition: "all 0.15s ease"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", color: isActive ? "#ffffff" : "#71717a", width: 14 }}>
                  {icon}
                </span>
                <span style={{ flex: 1 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Section */}
      <div style={{ marginBottom: 20, flex: 1, overflowY: "auto", minHeight: 0 }} className="nx-scroll">
        <div style={{
          fontSize: "var(--fs-meta)",
          color: "#52525b",
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "0 8px",
          marginBottom: 8,
          fontWeight: 600
        }}>
          Recent Threads
        </div>
        {conversations.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {conversations.map((conv) => {
              const isActive = activeConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 4,
                    background: isActive ? "#18181b" : "transparent",
                    border: isActive ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
                    paddingRight: 6,
                    transition: "all 0.15s ease"
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveNav("chat");
                      onSelectConversation(conv.id);
                    }}
                    style={{
                      padding: "7px 10px",
                      fontSize: "var(--fs-card)",
                      color: isActive ? "#ffffff" : "#a1a1aa",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      border: "none",
                      background: "transparent",
                      flex: 1,
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    title={conv.title}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#52525b" }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{conv.title}</span>
                  </button>
                  {onDeleteConversation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#52525b",
                        cursor: "pointer",
                        fontSize: "var(--fs-meta)",
                        padding: "2px 6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "#52525b"}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "8px 10px", fontSize: "var(--fs-meta)", color: "#52525b", fontStyle: "italic" }}>
            No recent chats
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div style={{ marginTop: "auto" }}>

        {/* Profile Card */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px",
          borderRadius: 4,
          background: "#18181b",
          border: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 12
        }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#27272a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--fs-meta)",
            color: "#ffffff",
            fontWeight: 700
          }}>
            KR
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: "var(--fs-card)", color: "#ffffff", fontWeight: 500, fontFamily: "var(--font-space-grotesk)" }}>Researcher</div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", display: "flex", padding: 2 }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* New Analysis Button */}
        <button
          type="button"
          onClick={onNewResearch}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "10px",
            borderRadius: 4,
            background: "#ffffff",
            border: "none",
            color: "#000000",
            fontSize: "var(--fs-card)",
            cursor: "pointer",
            fontWeight: 700,
            width: "100%",
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "0.02em",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#e4e4e7"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}
        >
          + New Analysis
        </button>
      </div>

      {/* Draggable Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "4px",
          height: "100%",
          cursor: "col-resize",
          background: "transparent",
          zIndex: 50,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
      />
    </div>
  );
}