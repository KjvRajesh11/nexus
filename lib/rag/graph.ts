import { StateGraph, Annotation } from "@langchain/langgraph";
import { ragEngine } from "./engine";
import { Chunk } from "./vector-store";

/**
 * Message interface for graph history
 */
export interface GraphMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Source interface for citations
 */
export interface GraphSource {
  id: number;
  text: string;
  documentName: string;
  similarity: number;
}

/**
 * Define the State Graph schema for RAG orchestration.
 */
export const RAGGraphState = Annotation.Root({
  // Input: User query
  query: Annotation<string>(),
  // Input: Conversational history
  history: Annotation<GraphMessage[]>(),
  // Output: Retrieved chunks from vector search
  retrievedChunks: Annotation<Chunk[]>(),
  // Output: Citations formatted for the frontend
  sources: Annotation<GraphSource[]>(),
  // Output: Completed messages structure ready for Groq LLM call
  messages: Annotation<GraphMessage[]>(),
});

/**
 * Retrieve Node: Uses the semantic retrieval engine to search the active vector store.
 */
async function retrieveNode(state: typeof RAGGraphState.State) {
  const query = state.query || "";
  
  // Search the vector store for top 8 relevant chunks
  const retrieved = await ragEngine.retrieve(query, 8);
  
  // Format sources for citations in UI
  const sources: GraphSource[] = retrieved.map((item, index) => ({
    id: index + 1,
    text: item.text,
    documentName: item.documentName,
    similarity: item.similarity
  }));

  return {
    retrievedChunks: retrieved,
    sources
  };
}

/**
 * Compile Prompt Node: Prepares the structured system prompt and context documents payload.
 */
async function compilePromptNode(state: typeof RAGGraphState.State) {
  const query = state.query || "";
  const sources = state.sources || [];
  const history = state.history || [];
  
  // Build context payload
  let sourcesPromptText = "";
  sources.forEach(source => {
    sourcesPromptText += `=== SOURCE [${source.id}] (from ${source.documentName}) ===\n${source.text}\n\n`;
  });

  const systemPrompt = `You are Nexus, an elite AI research assistant for serious academic and technical work.

Guidelines:
- Be precise, structured, and intellectually honest.
- When a document is provided, ground your answer in its actual content.
- Use clear headings, bullet points, and numbered lists where appropriate.
- State assumptions explicitly when information is incomplete.
- Keep responses focused, high-signal, and free of filler.
- You MUST cite the source paragraphs inline using the format [1], [2], etc., where the number corresponds to the SOURCE ID.
- Place citations immediately after the sentence or clause containing the cited fact, e.g., "...as shown in the study [1]."
- Never invent citations. Only cite a source if it directly supports the statement.`;

  let userContent = query;

  if (sources.length > 0) {
    userContent = query
      ? `${query}\n\n=== SOURCE DOCUMENTS ===\n${sourcesPromptText}=== END ===`
      : `=== SOURCE DOCUMENTS ===\n${sourcesPromptText}=== END ===\n\nPlease summarize and analyze these documents.`;
  }

  // Compile history + query, limiting conversation history to last 10 messages for token hygiene
  const messages: GraphMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10),
    { role: "user", content: userContent }
  ];

  return {
    messages
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH WORKFLOW COMPILATION
// ─────────────────────────────────────────────────────────────────────────────
const workflow = new StateGraph(RAGGraphState)
  .addNode("retrieve", retrieveNode)
  .addNode("compilePrompt", compilePromptNode)
  // Define edges
  .addEdge("__start__", "retrieve")
  .addEdge("retrieve", "compilePrompt")
  .addEdge("compilePrompt", "__end__");

export const ragGraph = workflow.compile();
