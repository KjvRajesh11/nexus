'use client';

interface Source {
  id: number;
  text: string;
  documentName?: string;
}

interface SourceCardProps {
  source: Source;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function SourceCard({ source, isHighlighted, onClick }: SourceCardProps) {
  // Try to clean up document names for titles
  const displayTitle = source.documentName 
    ? source.documentName.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
    : `Document Reference`;

  return (
    <div 
      onClick={onClick}
      style={{
        width: 140,
        height: 82,
        background: isHighlighted ? "rgba(212, 168, 67, 0.04)" : "#09090b",
        border: isHighlighted ? "1px solid #d4a843" : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 4,
        padding: "8px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.15s ease",
        flexShrink: 0,
        boxShadow: isHighlighted ? "0 0 10px rgba(212,168,67,0.1)" : "none",
        fontFamily: "var(--font-geist-sans)"
      }}
      onMouseEnter={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
          e.currentTarget.style.background = "#121214";
        }
      }}
      onMouseLeave={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.background = "#09090b";
        }
      }}
    >
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <span style={{ color: "#71717a", display: "inline-flex" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </span>
          <span style={{ 
            fontSize: 9, 
            fontWeight: 600, 
            color: isHighlighted ? "#d4a843" : "#a1a1aa", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap",
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "0.01em"
          }} title={displayTitle}>
            {displayTitle}
          </span>
        </div>

        {/* Excerpt Body */}
        <p style={{
          fontSize: 9,
          color: "#71717a",
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {source.text}
        </p>
      </div>

      {/* Footer Label */}
      <div style={{ 
        fontSize: 8.5, 
        color: isHighlighted ? "#d4a843" : "#52525b", 
        fontFamily: "var(--font-space-grotesk)",
        fontWeight: 600,
        letterSpacing: "0.02em"
      }}>
        Source [{source.id}]
      </div>
    </div>
  );
}

// Plus Card component for adding files
export function AddSourceCard({ onClick, isParsing }: { onClick: () => void; isParsing: boolean }) {
  return (
    <div 
      onClick={onClick}
      style={{
        width: 44,
        height: 82,
        background: "#09090b",
        border: "1px dashed rgba(255, 255, 255, 0.08)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isParsing ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        if (!isParsing) {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
          e.currentTarget.style.background = "#121214";
        }
      }}
      onMouseLeave={(e) => {
        if (!isParsing) {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
          e.currentTarget.style.background = "#09090b";
        }
      }}
    >
      <span style={{ fontSize: 13, color: "#52525b" }}>
        {isParsing ? "⏳" : "+"}
      </span>
    </div>
  );
}
