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

/**
 * Detects if a source comes from an academic database by checking its name prefix.
 * Academic chunks from academic-search.ts are tagged: "OpenAlex: ..." or "Semantic Scholar: ..."
 */
function detectSourceType(documentName?: string): "academic" | "library" {
  if (!documentName) return "library";
  const lower = documentName.toLowerCase();
  if (lower.startsWith("openalex:") || lower.startsWith("semantic scholar:")) {
    return "academic";
  }
  return "library";
}

/**
 * Returns the clean display title for a source card, stripping the source prefix.
 */
function getDisplayTitle(documentName?: string): string {
  if (!documentName) return "Document Reference";
  // Strip "OpenAlex: " and "Semantic Scholar: " prefixes for cleaner display
  return documentName
    .replace(/^(OpenAlex|Semantic Scholar):\s*/i, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/_/g, " ")
    .trim();
}

export default function SourceCard({ source, isHighlighted, onClick }: SourceCardProps) {
  const sourceType = detectSourceType(source.documentName);
  const isAcademic = sourceType === "academic";
  const displayTitle = getDisplayTitle(source.documentName);

  // Academic sources get a teal accent; library documents get the default amber
  const accentColor = isHighlighted
    ? (isAcademic ? "#2dd4bf" : "#d4a843")
    : (isAcademic ? "#0d9488" : "#71717a");

  const badge = isAcademic
    ? { label: "Academic", icon: "🎓", color: "#2dd4bf", bg: "rgba(45,212,191,0.06)", border: "rgba(45,212,191,0.2)" }
    : { label: "Library", icon: "📚", color: "#a1a1aa", bg: "transparent", border: "transparent" };

  return (
    <div
      onClick={onClick}
      style={{
        width: 148,
        height: 90,
        background: isHighlighted
          ? (isAcademic ? "rgba(45,212,191,0.04)" : "rgba(212, 168, 67, 0.04)")
          : "#09090b",
        border: isHighlighted
          ? `1px solid ${isAcademic ? "#2dd4bf" : "#d4a843"}`
          : "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 4,
        padding: "8px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "all 0.15s ease",
        flexShrink: 0,
        boxShadow: isHighlighted
          ? `0 0 10px ${isAcademic ? "rgba(45,212,191,0.12)" : "rgba(212,168,67,0.1)"}`
          : "none",
        fontFamily: "var(--font-geist-sans)"
      }}
      onMouseEnter={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.borderColor = isAcademic
            ? "rgba(45,212,191,0.25)"
            : "rgba(255, 255, 255, 0.16)";
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
        {/* Header: icon + document title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, marginBottom: 4 }}>
          <span style={{ color: accentColor, display: "inline-flex", marginTop: 1, flexShrink: 0 }}>
            {isAcademic ? (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            ) : (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            )}
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            color: isHighlighted ? accentColor : "#a1a1aa",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            fontFamily: "var(--font-space-grotesk)",
            letterSpacing: "0.01em",
            lineHeight: 1.3
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

      {/* Footer: Source type badge + citation ID */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          fontSize: 7.5,
          fontWeight: 600,
          color: badge.color,
          background: badge.bg,
          border: `1px solid ${badge.border}`,
          borderRadius: 2,
          padding: "1px 4px",
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "0.04em",
          textTransform: "uppercase"
        }}>
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </span>
        <span style={{
          fontSize: 8.5,
          color: isHighlighted ? accentColor : "#3f3f46",
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 600,
          letterSpacing: "0.02em"
        }}>
          [{source.id}]
        </span>
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
        height: 90,
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
