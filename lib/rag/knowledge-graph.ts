import { Chunk } from "./vector-store";

/**
 * A lightweight, in-memory Knowledge Graph to connect related document chunks
 * sharing key entities, acronyms, or rare terms. Enables Graph-Guided Retrieval Expansion.
 */
export class KnowledgeGraph {
  // Map of entity/term to Set of Chunk IDs
  private entityToChunks = new Map<string, Set<string>>();
  // Map of Chunk ID to Set of entities/terms contained
  private chunkToEntities = new Map<string, Set<string>>();
  // Map of Chunk ID to full Chunk reference
  private chunkLookup = new Map<string, Chunk>();

  // Set of English stop words to filter out common terms
  private static readonly STOP_WORDS = new Set([
    "the", "and", "for", "with", "this", "that", "from", "they", "then", "their",
    "will", "your", "have", "been", "were", "what", "when", "where", "which", "who",
    "how", "about", "there", "their", "them", "some", "these", "into", "also", "into"
  ]);

  constructor() {}

  /**
   * Clears the in-memory graph
   */
  public clear() {
    this.entityToChunks.clear();
    this.chunkToEntities.clear();
    this.chunkLookup.clear();
  }

  /**
   * Extracts entities, acronyms, and key terms from a chunk and registers links in the graph.
   */
  public indexChunk(chunk: Chunk): void {
    const chunkId = chunk.id;
    this.chunkLookup.set(chunkId, chunk);

    const text = chunk.text;
    const entities = new Set<string>();

    // Heuristic 1: Extract uppercase acronyms (length 2-6) e.g., RAG, Qubit, DNA, NMR
    const acronyms = text.match(/\b[A-Z]{2,6}\b/g) || [];
    for (const ac of acronyms) {
      entities.add(ac);
    }

    // Heuristic 2: Extract Title Case phrases (2+ words capitalized) e.g., "Quantum Computing", "Shor's Algorithm"
    const properPhrases = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
    for (const phrase of properPhrases) {
      entities.add(phrase);
    }

    // Heuristic 3: Extract technical words (words with length > 6, starting with capital letter or containing numbers, that aren't stop words)
    const words = text.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z0-9]/g, "");
      if (cleaned.length > 6 && !KnowledgeGraph.STOP_WORDS.has(cleaned.toLowerCase())) {
        // If starts with a capital, or contains digits (e.g. Llama3, BM25)
        if (/[A-Z]/.test(cleaned[0]) || /\d/.test(cleaned)) {
          entities.add(cleaned);
        }
      }
    }

    // Store in graph maps
    this.chunkToEntities.set(chunkId, entities);
    for (const ent of entities) {
      if (!this.entityToChunks.has(ent)) {
        this.entityToChunks.set(ent, new Set());
      }
      this.entityToChunks.get(ent)!.add(chunkId);
    }
  }

  /**
   * Indexes a collection of chunks.
   */
  public indexChunks(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      this.indexChunk(chunk);
    }
  }

  /**
   * Given an initial list of retrieved chunks, finds other chunks in the database
   * that share a high number of entities/keywords (co-occurrence overlap).
   * Returns up to maxExpansion new chunks to enrich context.
   */
  public getConnectedChunks(seedChunks: Chunk[], maxExpansion = 2): Chunk[] {
    if (seedChunks.length === 0 || this.chunkLookup.size === 0) return [];

    const seedIds = new Set(seedChunks.map(c => c.id));
    const seedEntities = new Set<string>();

    // Collect all entities in the seed chunks
    for (const chunk of seedChunks) {
      const ents = this.chunkToEntities.get(chunk.id);
      if (ents) {
        for (const e of ents) {
          seedEntities.add(e);
        }
      }
    }

    if (seedEntities.size === 0) return [];

    // Candidate chunks scores: chunkId -> overlap count
    const candidateScores = new Map<string, number>();

    for (const entity of seedEntities) {
      const associatedChunkIds = this.entityToChunks.get(entity);
      if (associatedChunkIds) {
        for (const cid of associatedChunkIds) {
          // Skip chunks that are already in the seed list
          if (seedIds.has(cid)) continue;

          candidateScores.set(cid, (candidateScores.get(cid) || 0) + 1);
        }
      }
    }

    // Sort candidates by overlap score descending
    const sortedCandidates = Array.from(candidateScores.entries())
      .filter(([_, score]) => score >= 2) // Must share at least 2 entities to connect
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxExpansion);

    const expandedChunks: Chunk[] = [];
    for (const [cid, score] of sortedCandidates) {
      const chunk = this.chunkLookup.get(cid);
      if (chunk) {
        console.log(`[KnowledgeGraph] Expanded context: Connected "${chunk.documentName}" (shares ${score} entities with seed chunks)`);
        expandedChunks.push(chunk);
      }
    }

    return expandedChunks;
  }
}

// Export a singleton instance
export const knowledgeGraph = new KnowledgeGraph();
