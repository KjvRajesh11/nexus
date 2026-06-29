'use client';

import { useState, useRef } from 'react';

interface InputAreaProps {
  onSend: (text: string, file?: File | null) => void;
  onAttachFiles?: (files: FileList | File[]) => void;
  documentsCount?: number;
  isParsing?: boolean;
}

export default function InputArea({ onSend, onAttachFiles, documentsCount = 0, isParsing = false }: InputAreaProps) {
  const [val, setVal] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = val.trim();
    if (!text && !selectedFile && documentsCount === 0) return;

    // Send both text + file (if any)
    onSend(text, selectedFile);

    // Clear input
    setVal("");
    setSelectedFile(null);
    if (taRef.current) taRef.current.style.height = "22px";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (onAttachFiles) {
        onAttachFiles(files);
      } else {
        const file = files[0];
        setSelectedFile(file);
      }
    }
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
    <div className="nx-input-area" style={{ 
      padding: "0 24px 14px", 
      background: "#000000", 
      borderTop: "none", 
      flexShrink: 0,
      fontFamily: "var(--font-geist-sans)"
    }}>
      
      {/* Input container matches the reference image */}
      <div style={{
        background: "#09090b",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 4,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.2s"
      }}
      className="nx-inp-wrapper"
      >
        
        {/* Uploaded File Previews inside the input box */}
        {selectedFile && (
          <div style={{
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6,
            background: "#18181b", 
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 3, 
            padding: "4px 8px",
            width: "fit-content"
          }}>
            <span style={{ fontSize: "var(--fs-meta)" }}>📄</span>
            <span style={{ fontSize: "var(--fs-meta)", color: "#a1a1aa", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedFile.name}
            </span>
            <button 
              type="button" 
              onClick={removeFile} 
              aria-label="Remove file" 
              style={{ 
                background: "none", 
                border: "none", 
                color: "#71717a", 
                cursor: "pointer",
                fontSize: "var(--fs-meta)",
                padding: "0 2px"
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Textarea + Action buttons row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          
          <textarea
            ref={taRef}
            style={{ 
              flex: 1, 
              background: "transparent", 
              border: "none", 
              color: "#f4f4f5", 
              fontSize: "var(--fs-input)", 
              outline: "none", 
              resize: "none", 
              lineHeight: 1.55, 
              minHeight: 22, 
              maxHeight: 120 
            }}
            placeholder="Ask anything..."
            value={val}
            onChange={(e) => { setVal(e.target.value); resize(e); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            rows={1}
          />

          {/* Buttons aligned inside text container */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginBottom: 1 }}>
            
            {/* Hidden Input file connector */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple
              accept=".pdf,.txt,text/plain,application/pdf"
              style={{ display: "none" }} 
            />

            {/* Paperclip upload trigger */}
            <button 
              type="button" 
              onClick={triggerFileUpload}
              style={{
                background: "none",
                border: "none",
                color: "#71717a",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {/* Send Button: Solid white block containing black arrow pointing up */}
            <button 
              onClick={submit} 
              disabled={!(val.trim() || selectedFile || documentsCount > 0)}
              style={{
                width: 24, 
                height: 24, 
                borderRadius: 3,
                background: (val.trim() || selectedFile || documentsCount > 0) ? "#ffffff" : "#18181b",
                border: "none", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                padding: 0, 
                cursor: (val.trim() || selectedFile || documentsCount > 0) ? "pointer" : "default",
                color: (val.trim() || selectedFile || documentsCount > 0) ? "#000000" : "#52525b",
                transition: "all 0.15s ease"
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>

          </div>

        </div>

      </div>

      {/* Muted Disclaimer at the bottom */}
      <div style={{ 
        textAlign: "center", 
        marginTop: 8, 
        fontSize: "var(--fs-meta)", 
        color: "#52525b",
        fontFamily: "var(--font-space-grotesk)",
        letterSpacing: "0.02em"
      }}>
        Nexus AI can make mistakes. Verify critical synthesis.
      </div>

    </div>
  );
}