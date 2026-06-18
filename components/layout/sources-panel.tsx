'use client';

import { useEffect, useRef } from 'react';

interface Source {
  id: number;
  text: string;
  documentName?: string;
}

interface ExtractedDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  size: number;
}

interface SourcesPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sources: Source[];
  activeCitationId: number | null;
  onCitationHighlight: (id: number | null) => void;
  documents?: ExtractedDocument[];
  onUploadFiles?: (files: FileList | File[]) => void;
  onDeleteDocument?: (id: string) => void;
  isParsing?: boolean;
}

export default function SourcesPanel({
  activeTab,
  setActiveTab,
  sources = [],
  activeCitationId,
  onCitationHighlight,
  documents = [],
  onUploadFiles,
  onDeleteDocument,
  isParsing = false,
}: SourcesPanelProps) {
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (activeCitationId !== null && itemRefs.current[activeCitationId]) {
      itemRefs.current[activeCitationId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeCitationId]);

  return (
    <div className="nx-sources-panel" style={{ 
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
          {[
            { id: "Library", label: "Library" },
            { id: "Sources", label: "Citations" },
            { id: "Notes", label: "Notes" }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              style={{ 
                padding: "3px 9px", 
                borderRadius: 5, 
                fontSize: 11, 
                color: activeTab === t.id ? "#f0f0f0" : "#666", 
                cursor: "pointer", 
                border: "none", 
                background: activeTab === t.id ? "#222" : "transparent" 
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "11px" }}>
        {activeTab === "Library" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Upload Zone */}
            <div 
              onClick={() => {
                if (isParsing) return;
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ".pdf,.txt,text/plain,application/pdf";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && onUploadFiles) onUploadFiles(files);
                };
                input.click();
              }}
              style={{
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: "16px 10px",
                textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                cursor: isParsing ? "not-allowed" : "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>📥</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#f0f0f0" }}>
                {isParsing ? "Parsing files..." : "Upload files"}
              </span>
              <p style={{ fontSize: 9, color: "#5a5a5a", marginTop: 2 }}>PDF or Text files</p>
            </div>

            {/* Document Library List */}
            <div style={{ fontSize: 9, color: "#5a5a5a", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 0 4px" }}>
              Documents ({documents.length})
            </div>

            {documents.length > 0 || isParsing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    style={{
                      background: "#161616",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", flex: 1 }}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>📄</span>
                      <div style={{ overflow: "hidden" }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: "#f0f0f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={doc.name}>
                          {doc.name}
                        </p>
                        <p style={{ fontSize: 9, color: "#5a5a5a", marginTop: 1 }}>
                          {(doc.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => onDeleteDocument?.(doc.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#888",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: "2px 4px"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {isParsing && (
                  <div 
                    className="nx-skeleton"
                    style={{
                      height: 38,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.04)"
                    }}
                  />
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 10px", color: "#5a5a5a", fontSize: 11 }}>
                No active documents.
              </div>
            )}
          </div>
        ) : activeTab === "Sources" ? (
          <>
            {/* Referencing header */}
            <div style={{ 
              fontSize: 9, 
              color: "#5a5a5a", 
              letterSpacing: "0.08em", 
              textTransform: "uppercase", 
              padding: "7px 0 9px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span>Referenced · {sources.length} sources</span>
              {activeCitationId !== null && (
                <button 
                  onClick={() => onCitationHighlight(null)}
                  style={{ background: "none", border: "none", color: "#d4a843", fontSize: 9, cursor: "pointer" }}
                >
                  Clear Highlight
                </button>
              )}
            </div>

            {sources.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sources.map((source) => {
                  const isHighlighted = source.id === activeCitationId;
                  return (
                    <div
                      key={source.id}
                      ref={(el) => { itemRefs.current[source.id] = el; }}
                      onClick={() => onCitationHighlight(isHighlighted ? null : source.id)}
                      style={{
                        background: isHighlighted ? "rgba(212,168,67,0.08)" : "#161616",
                        border: isHighlighted ? "1px solid #d4a843" : "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 10,
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isHighlighted ? "0 0 12px rgba(212,168,67,0.15)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: isHighlighted ? "#d4a843" : "rgba(255,255,255,0.06)",
                            color: isHighlighted ? "#0a0a0a" : "#888",
                            fontSize: 10,
                            fontWeight: 600,
                          }}>
                            {source.id}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: isHighlighted ? "#d4a843" : "#f0f0f0" }}>
                            Paragraph {source.id}
                          </span>
                        </div>
                        {source.documentName && (
                          <span style={{ fontSize: 9, color: "#888", paddingLeft: 28, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={source.documentName}>
                            source: {source.documentName}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        color: isHighlighted ? "#f0f0f0" : "#a0a0a0",
                        display: "-webkit-box",
                        WebkitLineClamp: isHighlighted ? 15 : 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        transition: "color 0.2s ease",
                      }}>
                        {source.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 10px", textAlign: "center" }}>
                <span style={{ fontSize: 24, marginBottom: 8 }}>📄</span>
                <p style={{ color: "#666", fontSize: 12, lineHeight: 1.5 }}>
                  No sources referenced in this response yet.<br />
                  Upload a document and ask a question to see citations.
                </p>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: "#666", fontSize: 12, padding: "20px 10px", textAlign: "center" }}>
            Notes and annotations workspace coming soon...
          </div>
        )}
      </div>
    </div>
  );
}