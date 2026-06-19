import { RecursiveCharacterTextSplitter } from "./chunker";
import { EmbeddingsService } from "./embeddings";
import { getVectorStore, Chunk, IngestedDocument } from "./vector-store";

/**
 * Unified RAG Engine that orchestrates chunking, embedding, storage, and retrieval.
 */
export class RAGEngine {
  private chunker: RecursiveCharacterTextSplitter;
  private embeddings: EmbeddingsService;
  private store;

  constructor() {
    this.chunker = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });
    this.embeddings = new EmbeddingsService();
    this.store = getVectorStore();
  }

  /**
   * Ingests a raw text document: chunks it, generates embeddings, and saves to database.
   */
  public async ingestDocument(
    id: string,
    name: string,
    type: string,
    size: number,
    text: string
  ): Promise<IngestedDocument> {
    if (!text || text.trim() === "") {
      throw new Error(`[RAGEngine] Document "${name}" has no text content to index`);
    }

    console.log(`[RAGEngine] Ingesting "${name}" (${size} bytes)`);

    // 1. Chunk text
    const textChunks = this.chunker.splitText(text);
    console.log(`[RAGEngine] Split "${name}" into ${textChunks.length} chunks`);

    // 2. Generate embeddings for all chunks in parallel/batches
    const chunks: Chunk[] = [];
    
    // We can do this in parallel
    const embeddingPromises = textChunks.map(async (chunkText, index) => {
      const embedding = await this.embeddings.embedText(chunkText);
      return {
        id: `${id}_c${index}`,
        documentId: id,
        documentName: name,
        text: chunkText,
        embedding
      };
    });

    const resolvedChunks = await Promise.all(embeddingPromises);
    chunks.push(...resolvedChunks);

    // 3. Save to active vector store
    const documentMeta = {
      id,
      name,
      type,
      size,
      createdAt: new Date().toISOString()
    };

    await this.store.addChunks(chunks, documentMeta);
    console.log(`[RAGEngine] Ingested "${name}" successfully with ${chunks.length} chunks`);

    return {
      ...documentMeta,
      chunkCount: chunks.length
    };
  }

  /**
   * Retrieves the top K most semantically relevant chunks for a user query.
   */
  public async retrieve(query: string, topK = 8): Promise<(Chunk & { similarity: number })[]> {
    if (!query || query.trim() === "") {
      return [];
    }

    console.log(`[RAGEngine] Retrieving chunks for query: "${query.substring(0, 60)}..."`);

    // 1. Generate embedding for query
    const queryEmbedding = await this.embeddings.embedText(query);

    // 2. Query similarity search from vector store
    const results = await this.store.similaritySearch(queryEmbedding, topK);
    console.log(`[RAGEngine] Retrieved ${results.length} relevant chunks`);

    return results;
  }

  /**
   * Deletes a document and all its chunks.
   */
  public async deleteDocument(documentId: string): Promise<void> {
    console.log(`[RAGEngine] Deleting document "${documentId}"`);
    await this.store.deleteDocument(documentId);
  }

  /**
   * Lists all ingested documents.
   */
  public async listDocuments(): Promise<IngestedDocument[]> {
    return this.store.listDocuments();
  }

  /**
   * Clears the entire database of all documents and chunks.
   */
  public async clearAll(): Promise<void> {
    console.log("[RAGEngine] Clearing database");
    await this.store.clear();
  }
}

// Export a singleton instance
export const ragEngine = new RAGEngine();
