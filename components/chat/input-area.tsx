'use client';

import { useState, useRef } from 'react';

interface InputAreaProps {
  onSend: (text: string, file?: File | null) => void;
}

export default function InputArea({ onSend }: InputAreaProps) {
  const [val, setVal] = useState("");
  const [deepOn, setDeepOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = val.trim();
    if (!text && !selectedFile) return;

    // Send both text + file (if any)
    onSend(text, selectedFile);

    // Clear input
    setVal("");
    setSelectedFile(null);
    if (taRef.current) taRef.current.style.height = "22px";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "22px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div style={{ padding: "0 16px 14px", background: "#111111", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
      
      {/* Uploaded File Preview */}
      {selectedFile && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20, padding: "6px 14px", marginBottom: 8
        }}>
          <span>{selectedFile.type.includes("image") ? "🖼️" : "📄"}</span>
          <span style={{ fontSize: 13, color: "#f0f0f0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedFile.name}
          </span>
          <button onClick={removeFile} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div className="nx-inp">
        <button className="nx-meta" onClick={triggerFileUpload}>📎</button>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.txt,.doc,.docx" style={{ display: "none" }} />

        <button className="nx-meta">🖼️</button>

        <textarea
          ref={taRef}
          style={{ flex: 1, background: "transparent", border: "none", color: "#f0f0f0", fontSize: 13, outline: "none", resize: "none", lineHeight: 1.55, minHeight: 22, maxHeight: 120 }}
          placeholder="Ask a research question…"
          value={val}
          onChange={(e) => { setVal(e.target.value); resize(e); }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          rows={1}
        />

        <button className="nx-meta" onClick={() => setMicOn(!micOn)} style={{ color: micOn ? "#d4a843" : undefined }}>🎤</button>

        <button onClick={submit} style={{
          width: 30, height: 30, borderRadius: 8,
          background: (val.trim() || selectedFile) ? "#d4a843" : "#1c1c1c",
          border: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, marginBottom: 1, cursor: "pointer"
        }}>
          ➤
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          <button className={`nx-itag${deepOn ? " on" : ""}`} onClick={() => setDeepOn(!deepOn)}>🔭 Deep Search</button>
          <button className="nx-itag">📄 Docs</button>
          <button className="nx-itag">🔬 Academic</button>
          <button className="nx-itag">💻 Code</button>
        </div>
        <button style={{ background: "transparent", border: "none", fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
          Nexus Pro ▼
        </button>
      </div>
    </div>
  );
}