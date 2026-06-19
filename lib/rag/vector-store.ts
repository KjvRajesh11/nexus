import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  text: string;
  embedding: number[];
}

export interface IngestedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  chunkCount: number;
  createdAt: string;
}

export interface VectorStore {
  addChunks(chunks: Chunk[], document: Omit<IngestedDocument, "chunkCount">): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  similaritySearch(queryEmbedding: number[], topK: number): Promise<(Chunk & { similarity: number })[]>;
  listDocuments(): Promise<IngestedDocument[]>;
  clear(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOCAL JSON VECTOR STORE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────
export class LocalVectorStore implements VectorStore {
  private dbPath: string;

  constructor() {
    // Resolve path relative to the root directory
    const workspaceRoot = process.cwd();
    const dataDir = path.join(workspaceRoot, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, "nexus-db.json");
    this.initializeDb();
  }

  private initializeDb() {
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify({ documents: [], chunks: [] }, null, 2), "utf-8");
    }
  }

  private readData(): { documents: IngestedDocument[]; chunks: Chunk[] } {
    try {
      this.initializeDb();
      const content = fs.readFileSync(this.dbPath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error("[LocalVectorStore] Error reading DB:", err);
      return { documents: [], chunks: [] };
    }
  }

  private writeData(data: { documents: IngestedDocument[]; chunks: Chunk[] }) {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[LocalVectorStore] Error writing DB:", err);
    }
  }

  public async addChunks(chunks: Chunk[], document: Omit<IngestedDocument, "chunkCount">): Promise<void> {
    const data = this.readData();
    
    // Check if document already exists; if so, delete it first to avoid duplicate chunks
    data.documents = data.documents.filter(d => d.id !== document.id);
    data.chunks = data.chunks.filter(c => c.documentId !== document.id);

    // Save document
    const fullDoc: IngestedDocument = {
      ...document,
      chunkCount: chunks.length
    };
    data.documents.push(fullDoc);

    // Save chunks
    data.chunks.push(...chunks);

    this.writeData(data);
  }

  public async deleteDocument(documentId: string): Promise<void> {
    const data = this.readData();
    data.documents = data.documents.filter(d => d.id !== documentId);
    data.chunks = data.chunks.filter(c => c.documentId !== documentId);
    this.writeData(data);
  }

  public async similaritySearch(queryEmbedding: number[], topK: number): Promise<(Chunk & { similarity: number })[]> {
    const data = this.readData();
    const scoredChunks = data.chunks.map(chunk => {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return { ...chunk, similarity };
    });

    // Sort descending by similarity
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    return scoredChunks.slice(0, topK);
  }

  public async listDocuments(): Promise<IngestedDocument[]> {
    const data = this.readData();
    return data.documents;
  }

  public async clear(): Promise<void> {
    this.writeData({ documents: [], chunks: [] });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return normA === 0 || normB === 0 ? 0 : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUPABASE PGVECTOR STORE IMPLEMENTATION
// ─────────────────────────────────────────────────────────────────────────────
export class SupabaseVectorStore implements VectorStore {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  public async addChunks(chunks: Chunk[], document: Omit<IngestedDocument, "chunkCount">): Promise<void> {
    // Delete existing document if present (cascade deletes chunks)
    await this.client.from("documents").delete().eq("id", document.id);

    // Insert document
    const { error: docError } = await this.client.from("documents").insert({
      id: document.id,
      name: document.name,
      type: document.type,
      size: document.size,
      created_at: document.createdAt
    });

    if (docError) {
      throw new Error(`[SupabaseVectorStore] Failed to insert document: ${docError.message}`);
    }

    // Insert chunks
    const rows = chunks.map(c => ({
      document_id: c.documentId,
      document_name: c.documentName,
      content: c.text,
      embedding: c.embedding
    }));

    // Insert in batches of 200
    const batchSize = 200;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error: chunkError } = await this.client.from("document_chunks").insert(batch);
      if (chunkError) {
        throw new Error(`[SupabaseVectorStore] Failed to insert chunk batch: ${chunkError.message}`);
      }
    }
  }

  public async deleteDocument(documentId: string): Promise<void> {
    const { error } = await this.client.from("documents").delete().eq("id", documentId);
    if (error) {
      throw new Error(`[SupabaseVectorStore] Failed to delete document: ${error.message}`);
    }
  }

  public async similaritySearch(queryEmbedding: number[], topK: number): Promise<(Chunk & { similarity: number })[]> {
    // Invokes PGVector similarity RPC match_document_chunks
    const { data, error } = await this.client.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_threshold: 0.1, // Retrieve everything above threshold
      match_count: topK
    });

    if (error) {
      throw new Error(`[SupabaseVectorStore] Similarity RPC failed: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      documentId: row.document_id,
      documentName: row.document_name,
      text: row.content,
      embedding: [], // Embedding is not needed by caller, reduce bandwidth
      similarity: row.similarity
    }));
  }

  public async listDocuments(): Promise<IngestedDocument[]> {
    const { data, error } = await this.client
      .from("documents")
      .select("id, name, type, size, created_at, document_chunks(count)");

    if (error) {
      throw new Error(`[SupabaseVectorStore] Failed to fetch documents list: ${error.message}`);
    }

    return (data || []).map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      size: doc.size,
      chunkCount: doc.document_chunks?.[0]?.count ?? 0,
      createdAt: doc.created_at
    }));
  }

  public async clear(): Promise<void> {
    const { error } = await this.client.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      throw new Error(`[SupabaseVectorStore] Clear DB failed: ${error.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FACTORY AND ENVIRONMENT CHECKER
// ─────────────────────────────────────────────────────────────────────────────
export function getVectorStore(): VectorStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  const isSupabaseConfigured = url && key && url !== "your-url-here" && key !== "your-key-here";

  if (isSupabaseConfigured) {
    console.log("[RAG] Supabase VectorStore active");
    return new SupabaseVectorStore(url, key);
  } else {
    return new LocalVectorStore();
  }
}
