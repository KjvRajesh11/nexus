'use client';

import React from 'react';
import SourceCard, { AddSourceCard } from './source-card';

// RAG Evaluation panel definition (Polished version)
const RagEvaluationPanel = ({ evaluation }: {
  evaluation?: {
    faithfulness: number;
    contextRelevance: number;
    answerRelevance: number;
    explanation: string;
  }
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  if (!evaluation) return null;

  const { faithfulness, contextRelevance, answerRelevance, explanation } = evaluation;

  // Compute status colors and messages based on overall RAG health
  const averageScore = Math.round((faithfulness + contextRelevance + answerRelevance) / 3);

  let statusText = "RAG Audit: High Quality";
  let statusColor = "#10b981"; // Soft Emerald Green
  if (averageScore < 60) {
    statusText = "RAG Audit: Warning / Low Alignment";
    statusColor = "#ef4444"; // Coral Red
  } else if (averageScore < 80) {
    statusText = "RAG Audit: Acceptable Alignment";
    statusColor = "#f59e0b"; // Gold/Amber
  }

  const getMetricColor = (val: number) => {
    if (val >= 80) return "#10b981"; // green
    if (val >= 60) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  return (
    <div style={{
      marginTop: 14,
      background: "rgba(22, 22, 22, 0.35)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: 4,
      padding: "10px 12px",
      fontSize: "var(--fs-meta)",
      color: "#c5c5c5",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      transition: "all 0.3s ease"
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "var(--fs-meta)",
          color: "#8c8c8c",
          userSelect: "none"
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            display: "inline-block"
          }} />
          <span style={{ letterSpacing: "0.03em", fontFamily: "var(--font-space-grotesk)" }}>{statusText}</span>
        </span>
        <span style={{ fontSize: "var(--fs-meta)", color: "#5c5c5c", display: "flex", alignItems: "center", gap: 3, fontFamily: "var(--font-space-grotesk)" }}>
          {isOpen ? "▲ HIDE DIAGNOSTICS" : "▼ SHOW DIAGNOSTICS"}
        </span>
      </div>

      {isOpen && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Metrics Row */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            {[
              { label: "Faithfulness (Grounding)", value: faithfulness },
              { label: "Context Relevance", value: contextRelevance },
              { label: "Answer Relevance", value: answerRelevance }
            ].map((metric, i) => {
              const color = getMetricColor(metric.value);
              return (
                <div key={i} style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.015)",
                  border: "1px solid rgba(255, 255, 255, 0.03)",
                  borderRadius: 4,
                  padding: "8px 6px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "var(--fs-meta)", color: "#777", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontFamily: "var(--font-space-grotesk)" }}>{metric.label}</div>
                  <div style={{ fontSize: "var(--fs-heading-md)", fontWeight: 700, color, fontFamily: "monospace" }}>{metric.value}%</div>
                  <div style={{ width: "100%", height: 3, background: "rgba(255, 255, 255, 0.04)", borderRadius: 1.5, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ width: `${metric.value}%`, height: "100%", background: color, borderRadius: 1.5, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation text */}
          {explanation && (
            <div style={{
              background: "rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.02)",
              borderLeft: `2px solid ${statusColor}`,
              padding: "6px 10px",
              borderRadius: "0 4px 4px 0",
              fontSize: "var(--fs-meta)",
              lineHeight: 1.5,
              color: "#9c9c9c",
              fontFamily: "var(--font-geist-sans)"
            }}>
              <span style={{ fontWeight: 600, color: "#d4a843", marginRight: 4, letterSpacing: "0.02em", textTransform: "uppercase", fontSize: "var(--fs-meta)", fontFamily: "var(--font-space-grotesk)" }}>Audit Log //</span>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MessageFile {
  name: string;
  type: string;
  url?: string;
}

interface Source {
  id: number;
  text: string;
  documentName?: string;
}

interface MessageBubbleProps {
  message: {
    id: number;
    role: "user" | "ai";
    text?: string;
    html?: string;
    userQuery?: string;
    followups?: string[];
    file?: MessageFile;
    sources?: Source[];
    evaluation?: {
      faithfulness: number;
      contextRelevance: number;
      answerRelevance: number;
      explanation: string;
      overallVerdict?: "pass" | "partial" | "fail";
      retryCount?: number;
    };
  };
  onFollowup?: (text: string) => void;
  onCitationClick?: (id: number) => void;
  activeCitationId?: number | null;
  onUploadClick?: () => void;
  isParsing?: boolean;
}

// Helper to parse text lines and look for markdown tables to render them beautifully
function parseMessageContent(htmlContent: string) {
  if (!htmlContent) return null;

  // Split into lines
  const lines = htmlContent.split("<br/>");
  const parsedElements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const renderTable = (headers: string[], rows: string[][], key: number) => {
    return (
      <div
        key={key}
        style={{
          background: "#09090b",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 4,
          margin: "12px 0",
          overflow: "hidden",
          fontFamily: "var(--font-geist-sans)"
        }}
      >
        {/* Table Header Bar */}
        <div style={{
          padding: "6px 12px",
          background: "rgba(255, 255, 255, 0.02)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "var(--fs-meta)",
          color: "#71717a",
          fontWeight: 600,
          fontFamily: "var(--font-space-grotesk)",
          letterSpacing: "0.06em",
          textTransform: "uppercase"
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            📊 Variance Report . CSV
          </span>
          <span style={{ cursor: "pointer", display: "flex" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
        </div>

        {/* Table Tag */}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--fs-chat)" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: "8px 12px", fontWeight: 500, color: "#71717a", fontSize: "var(--fs-meta)", fontFamily: "var(--font-space-grotesk)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: ri === rows.length - 1 ? "none" : "1px solid rgba(255, 255, 255, 0.04)" }}>
                {row.map((cell, ci) => {
                  // Replicate highlights: e.g. color numbers in yield orange if they are under 350
                  const isNumber = !isNaN(Number(cell.trim()));
                  const numValue = Number(cell.trim());
                  const shouldHighlight = isNumber && numValue < 350 && ci === row.length - 1;

                  return (
                    <td
                      key={ci}
                      style={{
                        padding: "8px 12px",
                        color: shouldHighlight ? "#f59e0b" : "#f4f4f5",
                        fontWeight: shouldHighlight ? 600 : 400,
                        fontFamily: isNumber ? "monospace" : "inherit"
                      }}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();

    // Check if it's a markdown table row (starts and ends with |)
    if (rawLine.startsWith("|") && rawLine.endsWith("|")) {
      // Split cells
      const cells = rawLine.split("|").map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

      // Check if it's a separator line (e.g. |---|---|)
      const isSeparator = cells.every(c => c.startsWith("-") || c === "");

      if (isSeparator) {
        // Skip separator
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells.map(c => c.replace(/<\/?strong>/gi, "")); // clean styles
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
    } else {
      // Line is not a table row
      if (inTable) {
        // Render accumulated table first
        parsedElements.push(renderTable(tableHeaders, tableRows, idx));
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Add normal line text
      if (rawLine !== "" || lines[idx] === "") {
        parsedElements.push(
          <div
            key={idx}
            dangerouslySetInnerHTML={{ __html: lines[idx] }}
            style={{ marginBottom: lines[idx] === "" ? 12 : 6, display: "block" }}
          />
        );
      }
    }
  }

  // If table was left open at the end
  if (inTable) {
    parsedElements.push(renderTable(tableHeaders, tableRows, lines.length));
  }

  return parsedElements;
}

export default function MessageBubble({
  message,
  onFollowup,
  onCitationClick,
  activeCitationId = null,
  onUploadClick,
  isParsing = false
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [feedback, setFeedback] = React.useState<"up" | "down" | null>(null);
  const [showCorrection, setShowCorrection] = React.useState(false);
  const [correctionText, setCorrectionText] = React.useState("");
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);
  const [feedbackSent, setFeedbackSent] = React.useState(false);

  const handleFeedbackClick = async (type: "up" | "down") => {
    if (type === "up") {
      setFeedback("up");
      await handleFeedbackSubmit("up");
    } else {
      setFeedback("down");
      setShowCorrection(true);
    }
  };

  const submitCorrection = async () => {
    await handleFeedbackSubmit("down", correctionText);
    setShowCorrection(false);
    setCorrectionText("");
  };

  const handleFeedbackSubmit = async (type: "up" | "down", correction?: string) => {
    setSubmittingFeedback(true);
    try {
      const responseText = message.html?.replace(/<[^>]*>/g, "") || "";
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: message.userQuery || "Preceding query",
          response: responseText,
          feedback: type,
          correction: correction || undefined,
          evaluation: message.evaluation ? {
            faithfulness: message.evaluation.faithfulness,
            contextRelevance: message.evaluation.contextRelevance,
            answerRelevance: message.evaluation.answerRelevance
          } : undefined,
          sources: message.sources ? message.sources.map(s => ({
            id: s.id,
            documentName: s.documentName,
            text: s.text
          })) : undefined,
          evaluationVerdict: message.evaluation?.overallVerdict || undefined,
          retryCount: message.evaluation?.retryCount ?? undefined,
        }),
      });
      setFeedbackSent(true);
      setTimeout(() => setFeedbackSent(false), 3000);
    } catch (err) {
      console.error("[Feedback] Submission failed:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleBubbleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'CITE') {
      const citationId = parseInt(target.innerText.replace(/\[|\]/g, '').trim(), 10);
      if (!isNaN(citationId)) {
        onCitationClick?.(citationId);
      }
    }
  };

  return (
    <div
      className="nx-fade"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: "12px 0",
        maxWidth: "100%"
      }}
      onClick={handleBubbleClick}
    >
      {/* Avatar column */}
      {isUser ? (
        // User avatar block: dark grey square with user profile outline
        <div style={{
          width: 22,
          height: 22,
          background: "#18181b",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a1a1aa",
          flexShrink: 0,
          marginTop: 2
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      ) : (
        // AI avatar block: white square with black lightning bolt
        <div style={{
          width: 22,
          height: 22,
          background: "#ffffff",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000000",
          flexShrink: 0,
          marginTop: 2
        }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.5 0L2 9h5v7l7.5-9H9v-7L9.5 0z" />
          </svg>
        </div>
      )}

      {/* Message content block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isUser ? (
          // User text & attachments
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {message.file && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#09090b",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                padding: "4px 8px",
                width: "fit-content",
                fontSize: "var(--fs-meta)",
                color: "#a1a1aa"
              }}>
                <span>📄</span>
                <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {message.file.name}
                </span>
              </div>
            )}
            <p style={{
              fontSize: "var(--fs-chat)",
              lineHeight: 1.55,
              color: "#e4e4e7",
              whiteSpace: "pre-wrap"
            }}>
              {message.text}
            </p>
          </div>
        ) : (
          // AI output
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Citation Sources Cards deck above response text */}
            {message.sources && message.sources.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  overflowX: "auto",
                  paddingBottom: 8,
                  marginTop: 2,
                  width: "100%"
                }}
                className="nx-scroll"
              >
                {message.sources.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    isHighlighted={source.id === activeCitationId}
                    onClick={() => onCitationClick?.(source.id)}
                  />
                ))}
                {onUploadClick && (
                  <AddSourceCard
                    onClick={onUploadClick}
                    isParsing={isParsing}
                  />
                )}
              </div>
            )}

            {/* Generated answer text / parsed tables */}
            <div style={{
              fontSize: "var(--fs-chat)",
              lineHeight: 1.6,
              color: "#e4e4e7"
            }}>
              {parseMessageContent(message.html || "")}
            </div>

            {/* Micro-interaction controls (Share, Copy, Refresh, Feedback) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", gap: 4, marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[
                  { k: "copy", label: "Copy", icon: "📋", action: () => navigator.clipboard.writeText(message.html?.replace(/<[^>]*>/g, "") || "") },
                  { k: "share", label: "Share", icon: "🔗", action: () => { } },
                  { k: "refresh", label: "Retry", icon: "🔄", action: () => onFollowup && message.userQuery && onFollowup(message.userQuery) }
                ].map((item) => (
                  <button
                    key={item.k}
                    onClick={item.action}
                    className="nx-meta"
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "var(--fs-meta)",
                      color: "#52525b",
                      padding: "3px 6px",
                      borderRadius: 3,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      transition: "color 0.15s, background 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#a1a1aa";
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#52525b";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{item.icon}</span>
                    <span style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.02em" }}>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Feedback Rating Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => handleFeedbackClick("up")}
                  disabled={submittingFeedback}
                  style={{
                    background: feedback === "up" ? "rgba(16, 185, 129, 0.08)" : "transparent",
                    border: feedback === "up" ? "1px solid rgba(16, 185, 129, 0.25)" : "none",
                    color: feedback === "up" ? "#10b981" : "#52525b",
                    fontSize: "var(--fs-meta)",
                    padding: "3px 6px",
                    borderRadius: 3,
                    cursor: submittingFeedback ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    transition: "all 0.15s"
                  }}
                >
                  <span>👍</span>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.02em" }}>Helpful</span>
                </button>
                <button
                  onClick={() => handleFeedbackClick("down")}
                  disabled={submittingFeedback}
                  style={{
                    background: feedback === "down" ? "rgba(239, 68, 68, 0.08)" : "transparent",
                    border: feedback === "down" ? "1px solid rgba(239, 68, 68, 0.25)" : "none",
                    color: feedback === "down" ? "#ef4444" : "#52525b",
                    fontSize: "var(--fs-meta)",
                    padding: "3px 6px",
                    borderRadius: 3,
                    cursor: submittingFeedback ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    transition: "all 0.15s"
                  }}
                >
                  <span>👎</span>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.02em" }}>Flag Issue</span>
                </button>
              </div>
            </div>

            {/* Inline Correction Form */}
            {showCorrection && (
              <div style={{
                marginTop: 8,
                background: "rgba(255, 255, 255, 0.015)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: 4,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}>
                <div style={{ fontSize: "var(--fs-meta)", color: "#a1a1aa", fontWeight: 500, fontFamily: "var(--font-space-grotesk)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Feedback // Correct Reference or Fact
                </div>
                <textarea
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="E.g., Section 3.2 mentions the yield strength is 320 MPa, not 250 MPa..."
                  rows={2}
                  style={{
                    width: "100%",
                    background: "#09090b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 3,
                    color: "#f4f4f5",
                    fontSize: "var(--fs-card)",
                    padding: "6px",
                    outline: "none",
                    resize: "none",
                    fontFamily: "var(--font-geist-sans)",
                    lineHeight: 1.4
                  }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button
                    onClick={() => { setShowCorrection(false); setFeedback(null); }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#71717a",
                      fontSize: "var(--fs-meta)",
                      cursor: "pointer",
                      padding: "2px 8px",
                      fontFamily: "var(--font-space-grotesk)"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCorrection}
                    disabled={submittingFeedback}
                    style={{
                      background: "#ffffff",
                      border: "none",
                      color: "#000000",
                      fontSize: "var(--fs-meta)",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 8px",
                      borderRadius: 3,
                      fontFamily: "var(--font-space-grotesk)"
                    }}
                  >
                    {submittingFeedback ? "Submitting..." : "Submit Correction"}
                  </button>
                </div>
              </div>
            )}

            {feedbackSent && (
              <div style={{
                marginTop: 6,
                fontSize: "var(--fs-meta)",
                color: "#10b981",
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 500,
                letterSpacing: "0.02em"
              }}>
                ✓ Feedback logged. Thank you for making Nexus more trustworthy.
              </div>
            )}

            {/* RAG evaluation metrics block */}
            {message.evaluation && (
              <RagEvaluationPanel evaluation={message.evaluation} />
            )}

            {/* Follow-up question buttons */}
            {message.followups && message.followups.length > 0 && onFollowup && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {message.followups.map((f, i) => (
                  <button
                    key={i}
                    className="nx-fu"
                    onClick={() => onFollowup(f)}
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: 20,
                      color: "#a1a1aa",
                      padding: "4px 10px",
                      fontSize: "var(--fs-meta)",
                      cursor: "pointer",
                      fontFamily: "var(--font-space-grotesk)",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(212,168,67,0.4)";
                      e.currentTarget.style.color = "#d4a843";
                      e.currentTarget.style.background = "rgba(212,168,67,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#a1a1aa";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
