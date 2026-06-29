'use client';

import { useState, useRef, useEffect } from "react";
import Header from '@/components/layout/header';
import LeftSidebar from '@/components/layout/sidebar';
import SourcesPanel from '@/components/layout/sources-panel';
import SettingsModal from '@/components/settings/settings-modal';
import InputArea from '@/components/chat/input-area';
import MessageBubble from '@/components/chat/message-bubble';

// CSS classes inject for custom animations and scrollbars
const GCSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;background:#000000;color:#f4f4f5;font-family:var(--font-geist-sans),-apple-system,BlinkMacSystemFont,sans-serif;font-size:13.5px;-webkit-font-smoothing:antialiased;}
.nx-scroll::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.nx-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.nx-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}
.nx-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.16);
}
@keyframes nxPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}
@keyframes nxFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.nx-fade {
  animation: nxFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
cite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9.5px;
  font-weight: 700;
  color: #d4a843;
  cursor: pointer;
  background: rgba(212, 168, 67, 0.06);
  border: 1px solid rgba(212, 168, 67, 0.18);
  border-radius: 3px;
  padding: 0 4px;
  height: 14px;
  min-width: 14px;
  margin: 0 2px;
  font-family: var(--font-space-grotesk);
  vertical-align: super;
  transition: all 0.15s ease;
}
cite:hover {
  background: rgba(212, 168, 67, 0.16);
  border-color: rgba(212, 168, 67, 0.3);
}
@keyframes nxSkeleton {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
.nx-skeleton {
  background: linear-gradient(90deg, #09090b 25%, #18181b 50%, #09090b 75%);
  background-size: 200px 100%;
  animation: nxSkeleton 1.6s infinite linear;
}
@keyframes nx-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`;

export interface MessageFile {
  name: string;
  type: string;
  url?: string;
}

export interface Message {
  id: number;
  role: "user" | "ai";
  text?: string;
  html?: string;
  userQuery?: string;
  followups?: string[];
  file?: MessageFile;
  sources?: Array<{ id: number; text: string; documentName?: string }>;
  evaluation?: {
    faithfulness: number;
    contextRelevance: number;
    answerRelevance: number;
    explanation: string;
  };
  isError?: boolean;
}

function toMessageFile(file: File): MessageFile {
  return {
    name: file.name,
    type: file.type,
    url: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
  };
}

const ThinkingDots = () => (
  <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{ 
        width: 6, 
        height: 6, 
        background: "#ffffff", 
        display: "inline-block", 
        animation: `nxPulse 1.2s ${i * .2}s infinite` 
      }} />
    ))}
  </span>
);

const PHASE_ICONS: Record<string, string> = {
  rewrite: "✦",
  retrieve: "⊕",
  generate: "◈",
  evaluate: "◉",
};

const ThinkingMsg = ({ steps, query }: { steps: { step: string; phase?: string }[]; query?: string | null }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0" }} className="nx-fade">
    {/* AI Square Avatar */}
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
        <path d="M9.5 0L2 9h5v7l7.5-9H9v-7L9.5 0z"/>
      </svg>
    </div>

    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <ThinkingDots />
        <span style={{
          fontSize: 10,
          color: "#52525b",
          fontWeight: 600,
          letterSpacing: "0.06em",
          fontFamily: "var(--font-space-grotesk)",
          textTransform: "uppercase"
        }}>
          Agent Trace
        </span>
      </div>

      {/* Step log terminal */}
      <div style={{
        background: "rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 4,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        maxHeight: 120,
        overflowY: "auto",
        fontFamily: "monospace"
      }}>
        {steps.length === 0 ? (
          <span style={{ fontSize: 10, color: "#3f3f46" }}>Initializing workflow...</span>
        ) : (
          steps.map((s, i) => {
            const icon = PHASE_ICONS[s.phase || ""] || "›";
            const isLatest = i === steps.length - 1;
            return (
              <div key={i} style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                opacity: isLatest ? 1 : 0.45,
                transition: "opacity 0.3s"
              }}>
                <span style={{ fontSize: 9, color: isLatest ? "#2dd4bf" : "#52525b", flexShrink: 0 }}>{icon}</span>
                <span style={{
                  fontSize: 10,
                  color: isLatest ? "#d4d4d8" : "#71717a",
                  lineHeight: 1.35
                }}>{s.step}</span>
                {isLatest && (
                  <span style={{
                    display: "inline-block",
                    width: 5,
                    height: 10,
                    background: "#2dd4bf",
                    marginLeft: 1,
                    animation: "nx-blink 1s step-end infinite",
                    verticalAlign: "middle"
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Skeleton content preview */}
      <div className="nx-skeleton" style={{ width: "90%", height: 10, borderRadius: 2 }} />
      <div className="nx-skeleton" style={{ width: "70%", height: 10, borderRadius: 2 }} />
    </div>
  </div>
);

export default function NexusApp() {
  const [conversations, setConversations] = useState<{ id: string; title: string; createdAt: string }[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState<boolean>(false);
  const [agentSteps, setAgentSteps] = useState<{ step: string; phase?: string }[]>([]);
  const [activeNav, setActiveNav] = useState("chat");
  const [panelTab, setPanelTab] = useState("Library");
  const [showSources, setShowSources] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCitationId, setActiveCitationId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [settings, setSettings] = useState({ webSearch: true, deepSearch: true, showTrace: true });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load custom style
  useEffect(() => {
    if (!document.getElementById("nx-gcss")) {
      const el = document.createElement("style");
      el.id = "nx-gcss"; el.textContent = GCSS;
      document.head.appendChild(el);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("nexus_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({
          webSearch: parsed.webSearch !== false,
          deepSearch: parsed.deepSearch !== false,
          showTrace: parsed.showTrace !== false,
        });
      } catch (_) {}
    }
  }, []);

  // Fetch documents list from db
  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents/list");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents list:", err);
    }
  };

  // Helper: Create new conversation
  const createNewConversation = (existingConvs?: typeof conversations) => {
    const targetConvs = existingConvs || conversations;
    const newId = `conv_${Date.now()}`;
    const newConv = {
      id: newId,
      title: "New Analysis Thread",
      createdAt: new Date().toISOString()
    };
    const updated = [newConv, ...targetConvs];
    setConversations(updated);
    localStorage.setItem("nexus_conversations", JSON.stringify(updated));
    setActiveConversationId(newId);
    setMessages([]);
    localStorage.setItem(`nexus_messages_${newId}`, JSON.stringify([]));
  };

  // Helper: Select conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    const saved = localStorage.getItem(`nexus_messages_${id}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (_) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  // Helper: Delete conversation
  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem("nexus_conversations", JSON.stringify(updated));
    localStorage.removeItem(`nexus_messages_${id}`);
    if (activeConversationId === id) {
      if (updated.length > 0) {
        handleSelectConversation(updated[0].id);
      } else {
        createNewConversation(updated);
      }
    }
  };

  // Load state on mount
  useEffect(() => {
    const saved = localStorage.getItem("nexus_conversations");
    let activeId = null;
    let currentConvs = [];

    if (saved) {
      try {
        currentConvs = JSON.parse(saved);
        setConversations(currentConvs);
        if (currentConvs.length > 0) {
          activeId = currentConvs[0].id;
          setActiveConversationId(activeId);
          const savedMsgs = localStorage.getItem(`nexus_messages_${activeId}`);
          if (savedMsgs) {
            setMessages(JSON.parse(savedMsgs));
          }
        } else {
          createNewConversation([]);
        }
      } catch (e) {
        console.error("Error loading conversations:", e);
        createNewConversation([]);
      }
    } else {
      createNewConversation([]);
    }

    fetchDocuments();
  }, []);

  // Save messages of active conversation when they change
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      localStorage.setItem(`nexus_messages_${activeConversationId}`, JSON.stringify(messages));
    }
  }, [messages, activeConversationId]);

  // Scroll to bottom on updates
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  // Ingest documents
  const handleUploadFiles = async (files: FileList | File[]) => {
    setIsParsing(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/documents/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          console.error(`Failed to ingest file ${file.name}:`, data.error);
        }
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err);
      }
    }
    await fetchDocuments();
    setIsParsing(false);
  };

  // Delete document
  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/list?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      } else {
        console.error("Failed to delete document:", data.error);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  // New research Blank Chat trigger
  const handleNewResearch = () => {
    createNewConversation();
    setActiveNav("chat");
    setActiveCitationId(null);
  };

  // Retry logic
  const handleRetry = async () => {
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    setMessages((prev) => prev.filter((m) => m.id !== messages[messages.length - 1].id || !m.isError));
    await handleSend(lastUserMsg.text || "");
  };

  // Send message
  const handleSend = async (text: string, file?: File | null) => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;

    let attachedFileMeta = null;
    if (file) {
      setIsParsing(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/documents/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64,
          }),
        });
        const data = await res.json();
        if (data.success) {
          attachedFileMeta = data.document;
          await fetchDocuments();
        }
      } catch (err) {
        console.error("Failed to upload attachment:", err);
      }
      setIsParsing(false);
    }

    const messageFile = file ? toMessageFile(file) : undefined;
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      text: trimmed || undefined,
      file: messageFile,
    };

    // Update conversation title if default
    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (activeConv && activeConv.title === "New Analysis Thread" && trimmed) {
      const newTitle = trimmed.length > 25 ? trimmed.substring(0, 25) + "..." : trimmed;
      const updatedConvs = conversations.map(c => c.id === activeConversationId ? { ...c, title: newTitle } : c);
      setConversations(updatedConvs);
      localStorage.setItem("nexus_conversations", JSON.stringify(updatedConvs));
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setThinking(true);
    setAgentSteps([]);
    setActiveCitationId(null);

    try {
      const recentMessages = updatedMessages.slice(-10);
      const history = recentMessages
        .filter((msg) => msg.role === "user" || msg.role === "ai")
        .map((msg) => {
          let content = msg.text || "";
          if (msg.html) content = msg.html.replace(/<[^>]*>/g, "");
          if (msg.file) {
            content = content
              ? `${content}\n[Attached: ${msg.file.name}]`
              : `[Attached: ${msg.file.name}]`;
          }
          return {
            role: msg.role === "user" ? "user" : "assistant",
            content,
          };
        });

      // Read settings from component state directly

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || (messageFile ? `[Attached file: ${messageFile.name}]` : ""),
          history: history.slice(0, -1),
          settings,
        }),
      });

      if (!res.ok) {
        let errMsg = "Failed to get response";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";
      const aiMessageId = Date.now() + 1;

      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "ai",
          html: "",
          userQuery: trimmed,
          followups: [],
          sources: [],
        },
      ]);

      let accumulatedText = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            try {
              const data = JSON.parse(trimmedLine);
                if (data.type === "step") {
                  // Accumulate steps into the running agent trace log
                  setAgentSteps((prev) => [...prev, { step: data.step, phase: data.phase }]);
              } else if (data.type === "reset") {
                accumulatedText = "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, html: "" } : m
                  )
                );
              } else if (data.type === "sources") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, sources: data.sources } : m
                  )
                );
                } else if (data.type === "token") {
                  setThinking(false); // Clear skeleton when tokens start arriving
                  setAgentSteps([]);  // Clear trace log — answer is arriving
                accumulatedText += data.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId
                      ? {
                          ...m,
                          html: accumulatedText
                            .replace(/\n\n/g, "<br/><br/>")
                            .replace(/\n/g, "<br/>")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\[(?:Source\s*)?(\d+)\]/gi, "<cite>$1</cite>"),
                        }
                      : m
                  )
                );
              } else if (data.type === "evaluation") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessageId ? { ...m, evaluation: data.evaluation } : m
                  )
                );
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (err: unknown) {
              if (trimmedLine.includes('"type":"error"')) {
                throw err;
              }
              console.error("Stream parse error:", err);
            }
          }
        }
      }

      setThinking(false); // Ensure thinking is cleared
      setAgentSteps([]);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                followups: [
                  "Verify structural yield limits",
                  "Compare stress logs",
                  "Analyze raw data sources",
                ],
              }
            : m
        )
      );
    } catch (error: unknown) {
      console.error("Chat Error:", error);
      setThinking(false);
      setAgentSteps([]);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          isError: true,
          text: error instanceof Error ? error.message : String(error),
          followups: [],
        },
      ]);
    }
  };

  const aiMessagesWithSources = messages.filter(m => m.role === "ai" && m.sources && m.sources.length > 0);
  const currentSources = aiMessagesWithSources.length > 0 ? aiMessagesWithSources[aiMessagesWithSources.length - 1].sources : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000000", color: "#f4f4f5", overflow: "hidden" }}>
      
      {/* Top Header Selector */}
      <Header 
        onToggleSources={() => setShowSources(s => !s)} 
        onOpenSettings={() => setShowSettings(true)} 
        sourcesOn={showSources} 
        messages={messages} 
        activeNav={activeNav} 
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        
        {/* Left Sidebar Menu */}
        <LeftSidebar 
          activeNav={activeNav} 
          setActiveNav={setActiveNav} 
          onOpenSettings={() => setShowSettings(true)} 
          onNewResearch={handleNewResearch} 
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Main Work Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Synthesis Console View */}
          {activeNav === "chat" && (
            <>
              {/* Message scroll list */}
              <div 
                className="nx-scroll" 
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "24px 32px",
                  display: "flex",
                  flexDirection: "column",
                  background: "#000000"
                }}
              >
                {/* Centered chat content container to align with screenshot references */}
                <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  {/* Minimal Welcome state */}
                  {messages.length === 0 && (
                    <div style={{
                      background: "#09090b",
                      border: `1px solid rgba(255, 255, 255, 0.08)`,
                      borderRadius: 4,
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 20
                    }} className="nx-fade">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 18, height: 18, background: "#ffffff", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", color: "#000" }}>
                          <span style={{ fontSize: 9.5, fontWeight: 700, fontFamily: "var(--font-space-grotesk)" }}>⚡</span>
                        </div>
                        <h2 style={{ fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-space-grotesk)", color: "#ffffff" }}>
                          Synthesis Console
                        </h2>
                      </div>
                      <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5, fontFamily: "var(--font-geist-sans)" }}>
                        Ready for data alignment. Ask queries, search papers, or upload reference CSV/PDF sheets.
                      </p>
                    </div>
                  )}

                  {/* Render messages */}
                  {messages.map((m) => (
                    <MessageBubble 
                      key={m.id}
                      message={m}
                      onFollowup={handleSend}
                      onCitationClick={(id) => {
                        setActiveCitationId(id);
                        setShowSources(true);
                        setPanelTab("Sources");
                      }}
                      activeCitationId={activeCitationId}
                      onUploadClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.multiple = true;
                        input.accept = ".pdf,.txt,text/plain,application/pdf";
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) handleUploadFiles(files);
                        };
                        input.click();
                      }}
                      isParsing={isParsing}
                    />
                  ))}

                  {/* Loading/Thinking wave state */}
                  {thinking && <ThinkingMsg steps={settings.showTrace ? agentSteps : []} query={messages.find(m => m.role === "user")?.text} />}

                  <div ref={bottomRef} />
                </div>
              </div>

              {/* Bottom console input */}
              <InputArea 
                onSend={handleSend}
                onAttachFiles={handleUploadFiles}
                documentsCount={documents.length}
                isParsing={isParsing}
              />
            </>
          )}

          {/* Research History List View */}
          {activeNav === "history" && (
            <div style={{ padding: "40px", color: "#71717a", fontSize: 13, fontFamily: "var(--font-space-grotesk)" }}>
              <h3>Research History Console</h3>
              <p style={{ marginTop: 8, color: "#52525b" }}>Historical synthesis logs are currently stored in local recent threads.</p>
            </div>
          )}

          {/* Knowledge Base List View */}
          {activeNav === "library" && (
            <div style={{ padding: "30px 40px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, height: "100%", width: "100%", fontFamily: "var(--font-space-grotesk)" }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 6 }}>Knowledge Base Library</h1>
                <p style={{ fontSize: 12.5, color: "#a1a1aa" }}>Manage active papers, documents, and reference resources for this session.</p>
              </div>

              {/* Upload Drop Zone */}
              <div 
                onClick={() => {
                  if (isParsing) return;
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.accept = ".pdf,.txt,text/plain,application/pdf";
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleUploadFiles(files);
                  };
                  input.click();
                }}
                style={{
                  border: `1px dashed rgba(255, 255, 255, 0.12)`,
                  borderRadius: 4,
                  padding: "36px 20px",
                  textAlign: "center",
                  background: "rgba(255,255,255,0.01)",
                  cursor: isParsing ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12
                }}
              >
                <span style={{ fontSize: 28 }}>📥</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>
                    {isParsing ? "Extracting and indexing documents..." : "Upload research documents"}
                  </p>
                  <p style={{ fontSize: 11.5, color: "#52525b" }}>
                    Supports PDF and TXT files. Select multiple files to parse them at once.
                  </p>
                </div>
              </div>

              {/* Ingested Documents Deck */}
              <div>
                <h2 style={{ fontSize: 13.5, fontWeight: 600, color: "#ffffff", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Active Session Documents</span>
                  <span style={{ fontSize: 10, background: "#18181b", color: "#a1a1aa", padding: "2px 6px", borderRadius: 10, fontFamily: "monospace" }}>
                    {documents.length}
                  </span>
                </h2>

                {documents.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        style={{
                          background: "#09090b",
                          border: `1px solid rgba(255, 255, 255, 0.08)`,
                          borderRadius: 4,
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 12,
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 20 }}>📄</span>
                          <div style={{ overflow: "hidden", flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={doc.name}>
                              {doc.name}
                            </p>
                            <p style={{ fontSize: 10, color: "#52525b", marginTop: 2, fontFamily: "monospace" }}>
                              {(doc.size / 1024).toFixed(1)} KB · {doc.type === "application/pdf" ? "PDF" : "Text"}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid rgba(255, 255, 255, 0.08)`, paddingTop: 10 }}>
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              fontSize: 11.5,
                              cursor: "pointer",
                              padding: "2px 8px",
                              borderRadius: 3,
                              transition: "background 0.2s"
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "60px 20px", background: "#09090b", border: `1px solid rgba(255, 255, 255, 0.08)`, borderRadius: 4 }}>
                    <span style={{ fontSize: 28, display: "block", marginBottom: 12 }}>📚</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>Your library is empty</p>
                    <p style={{ fontSize: 11.5, color: "#52525b" }}>Upload papers in the box above or via the sidebar to begin your research.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Placeholder for other items */}
          {["projects", "spaces", "bookmarks", "discover"].includes(activeNav) && (
            <div style={{ padding: "40px", color: "#52525b", fontSize: 13, fontFamily: "var(--font-space-grotesk)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {activeNav} Module Workspace (Coming soon...)
            </div>
          )}

        </div>

        {/* Right side Citation/Source Preview drawer */}
        {showSources && (
          <SourcesPanel
            activeTab={panelTab}
            setActiveTab={setPanelTab}
            sources={currentSources || []}
            activeCitationId={activeCitationId}
            onCitationHighlight={setActiveCitationId}
            documents={documents}
            onUploadFiles={handleUploadFiles}
            onDeleteDocument={handleDeleteDocument}
            isParsing={isParsing}
          />
        )}

      </div>
      {showSettings && <SettingsModal settings={settings} onSettingsChange={setSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
}