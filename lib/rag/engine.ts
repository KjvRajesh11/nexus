import { RecursiveCharacterTextSplitter } from "./chunker";
import { EmbeddingsService } from "./embeddings";
import { getVectorStore, Chunk, IngestedDocument } from "./vector-store";
import { BM25 } from "./bm25";
import { searchAcademicDatabases } from "./academic-search";
import { knowledgeGraph } from "./knowledge-graph";

/**
 * Unified RAG Engine that orchestrates chunking, embedding, storage, and retrieval.
 */
export class RAGEngine {
  private chunker: RecursiveCharacterTextSplitter;
  private embeddings: EmbeddingsService;
  private store;

  constructor() {
    this.chunker = new RecursiveCharacterTextSplitter({
      chunkSize: 1200,
      chunkOverlap: 200,
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

    // Index chunks into knowledge graph for graph-guided expansion
    knowledgeGraph.indexChunks(chunks);
    console.log(`[RAGEngine] Indexed ${chunks.length} chunks into KnowledgeGraph for "${name}"`);

    return {
      ...documentMeta,
      chunkCount: chunks.length
    };
  }

  /**
   * Helper: cosine similarity between two vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
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

  /**
   * Performs Hybrid Search (Vector + BM25 keyword matching) across local documents,
   * optionally fetches and embeds academic search results from OpenAlex + Semantic Scholar,
   * combines them using Reciprocal Rank Fusion (RRF), and re-ranks via LLM.
   */
  public async hybridRetrieve(
    vectorQuery: string,
    keywordQuery: string,
    academicQuery: string,
    settings: { webSearch?: boolean; deepSearch?: boolean } = {},
    topK = 8
  ): Promise<(Chunk & { similarity: number })[]> {
    const totalStart = performance.now();
    console.log(`[RAGEngine] Hybrid search active. Vector: "${vectorQuery.substring(0, 40)}...", Keyword: "${keywordQuery.substring(0, 40)}..."`);
    
    // 1. Fetch query embedding
    const embedStart = performance.now();
    const queryEmbedding = await this.embeddings.embedText(vectorQuery);
    console.log(`[RAGEngine] Query embedding generated in ${Math.round(performance.now() - embedStart)}ms`);

    // 2. Vector search on local documents (retrieve top 15)
    const vectorStart = performance.now();
    let localVectorResults: (Chunk & { similarity: number })[] = [];
    try {
      localVectorResults = await this.store.similaritySearch(queryEmbedding, 15);
      console.log(`[RAGEngine] Local vector search returned ${localVectorResults.length} matches in ${Math.round(performance.now() - vectorStart)}ms`);
    } catch (err) {
      console.error("[RAGEngine] Local vector search failed, continuing...", err);
    }

    // 3. Retrieve all local chunks for BM25 search
    const localChunksStart = performance.now();
    let localChunks: Chunk[] = [];
    try {
      localChunks = await this.store.getAllChunks();
      console.log(`[RAGEngine] Retrieved all ${localChunks.length} local chunks for BM25 in ${Math.round(performance.now() - localChunksStart)}ms`);
    } catch (err) {
      console.error("[RAGEngine] Failed to list all local chunks for BM25:", err);
    }

    // 4. Fetch academic literature if webSearch is enabled
    let academicChunks: Chunk[] = [];
    if (settings.webSearch && academicQuery.trim() !== "") {
      const academicStart = performance.now();
      try {
        console.log(`[RAGEngine] Academic tools active. Fetching works for: "${academicQuery}"`);
        
        // Race ceiling of 15 seconds for academic search + embedding
        const ACADEMIC_PIPELINE_TIMEOUT_MS = 15000;
        
        const fetchAndEmbedPromise = (async () => {
          const fetchStart = performance.now();
          const fetched = await searchAcademicDatabases(academicQuery, 5);
          console.log(`[RAGEngine] Academic databases returned ${fetched.length} papers in ${Math.round(performance.now() - fetchStart)}ms`);
          
          if (fetched.length === 0) return [];

          // Generate embeddings for academic chunks dynamically
          const academicEmbedPromises = fetched.map(async chunk => {
            try {
              const embedding = await this.embeddings.embedText(chunk.text);
              const similarity = this.cosineSimilarity(queryEmbedding, embedding);
              return {
                ...chunk,
                embedding,
                similarity
              };
            } catch (embedErr) {
              console.error(`[RAGEngine] Failed to embed academic chunk: ${chunk.documentName}`, embedErr);
              return { ...chunk, similarity: 0.3 }; // Fallback similarity
            }
          });
          
          return Promise.all(academicEmbedPromises);
        })();

        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error("Academic search pipeline exceeded 15s ceiling")), ACADEMIC_PIPELINE_TIMEOUT_MS)
        );

        const embeddedAcademic = await Promise.race([fetchAndEmbedPromise, timeoutPromise]);
        academicChunks = embeddedAcademic;

        // Add to vector results list
        localVectorResults = [...localVectorResults, ...embeddedAcademic];
        
        // Add to BM25 corpus list
        localChunks = [...localChunks, ...embeddedAcademic];
        
        console.log(`[RAGEngine] Academic tools pipeline complete in ${Math.round(performance.now() - academicStart)}ms (retrieved + embedded ${embeddedAcademic.length} items)`);
      } catch (err: any) {
        console.error(`[RAGEngine] Academic tools pipeline aborted or failed: ${err.message}`);
      }
    }

    // 5. BM25 Search
    const bm25Start = performance.now();
    let bm25Results: (Chunk & { similarity: number })[] = [];
    if (localChunks.length > 0 && keywordQuery.trim() !== "") {
      try {
        const bm25 = new BM25(localChunks.map(c => ({ id: c.id, text: c.text })));
        const matches = bm25.search(keywordQuery);
        
        // Map top matches (up to 15) to full chunks
        bm25Results = matches.slice(0, 15).map((match, idx) => {
          const chunk = localChunks[match.index];
          // Determine or proxy similarity score
          const localMatch = localVectorResults.find(v => v.id === chunk.id);
          const similarity = localMatch ? localMatch.similarity : Math.max(0.2, 0.6 - (idx * 0.02));
          
          return {
            ...chunk,
            similarity
          };
        });
        console.log(`[RAGEngine] BM25 lexical search returned ${bm25Results.length} matches in ${Math.round(performance.now() - bm25Start)}ms`);
      } catch (err) {
        console.error("[RAGEngine] BM25 keyword search failed, continuing...", err);
      }
    }

    // Sort vector results by similarity descending
    localVectorResults.sort((a, b) => b.similarity - a.similarity);

    // 6. Reciprocal Rank Fusion (RRF)
    const rrfStart = performance.now();
    const mergedMap = new Map<string, { chunk: Chunk; similarity: number; vectorRank: number; bm25Rank: number }>();
    
    localVectorResults.forEach((c, idx) => {
      mergedMap.set(c.id, {
        chunk: c,
        similarity: c.similarity,
        vectorRank: idx,
        bm25Rank: -1
      });
    });

    bm25Results.forEach((c, idx) => {
      if (mergedMap.has(c.id)) {
        mergedMap.get(c.id)!.bm25Rank = idx;
      } else {
        mergedMap.set(c.id, {
          chunk: c,
          similarity: c.similarity,
          vectorRank: -1,
          bm25Rank: idx
        });
      }
    });

    // Compute RRF scores
    const rrfCandidates = Array.from(mergedMap.values()).map(item => {
      const vRank = item.vectorRank;
      const bRank = item.bm25Rank;
      
      const vScore = vRank !== -1 ? 1 / (60 + vRank) : 0;
      const bScore = bRank !== -1 ? 1 / (60 + bRank) : 0;
      
      return {
        ...item.chunk,
        similarity: item.similarity,
        rrfScore: vScore + bScore
      };
    });

    // Sort by RRF score descending
    rrfCandidates.sort((a, b) => b.rrfScore - a.rrfScore);

    // Take top N (e.g. 12) for re-ranking
    let topCandidates = rrfCandidates.slice(0, 12);
    console.log(`[RAGEngine] RRF merged ${rrfCandidates.length} chunks down to ${topCandidates.length} candidates in ${Math.round(performance.now() - rrfStart)}ms.`);

    // 7. LLM-based Re-ranking (if deepSearch is true and we have a Groq key)
    if (settings.deepSearch && topCandidates.length > 0 && process.env.GROQ_API_KEY) {
      const rerankStart = performance.now();
      try {
        console.log("[RAGEngine] Deep Search active. Re-ranking candidate chunks with LLM...");
        const prompt = `You are an elite search evaluator. Analyze the relevance of the following document chunks to the search query: "${vectorQuery}".
Determine how helpful each chunk is for writing a comprehensive, factual research answer.

For each chunk, assign a relevance score between 0 and 10.

Chunks:
${topCandidates.map((c, i) => `--- CHUNK [${i}] (from ${c.documentName}) ---\n${c.text}`).join("\n\n")}

Return a JSON object containing the indices sorted by relevance (highest score first). Filter out any chunks with score < 3.
You MUST output your response in strict JSON format matching this schema:
{
  "sortedIndices": [number, number, ...]
}
`;

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are an expert search engine auditor that outputs indices in strict JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 300,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const sortedIndices: number[] = parsed.sortedIndices || [];
            
            // Map sortedIndices back to topCandidates
            const reRanked: typeof topCandidates = [];
            const seen = new Set<string>();

            for (const idx of sortedIndices) {
              if (idx >= 0 && idx < topCandidates.length) {
                const cand = topCandidates[idx];
                if (!seen.has(cand.id)) {
                  seen.add(cand.id);
                  reRanked.push(cand);
                }
              }
            }

            // Append any candidates that LLM omitted but are high rank, just in case
            for (const cand of topCandidates) {
              if (!seen.has(cand.id) && reRanked.length < topK) {
                seen.add(cand.id);
                reRanked.push(cand);
              }
            }

            topCandidates = reRanked;
            console.log(`[RAGEngine] LLM Re-ranking complete. Sorted ${topCandidates.length} chunks in ${Math.round(performance.now() - rerankStart)}ms.`);
          }
        }
      } catch (err) {
        console.error("[RAGEngine] LLM Re-ranking failed, falling back to RRF order:", err);
      }
    }

    // 8. Knowledge Graph Expansion: pull in strongly connected chunks not already in top results
    const kgStart = performance.now();
    const finalChunksBeforeExpansion = topCandidates.slice(0, topK);
    const connectedChunks = knowledgeGraph.getConnectedChunks(finalChunksBeforeExpansion, 2);
    if (connectedChunks.length > 0) {
      const existingIds = new Set(finalChunksBeforeExpansion.map(c => c.id));
      const newlyConnected = connectedChunks
        .filter(c => !existingIds.has(c.id))
        .map(c => ({ ...c, similarity: 0.4 })); // assign a reasonable similarity proxy
      console.log(`[RAGEngine] KnowledgeGraph expanded context by ${newlyConnected.length} connected chunk(s) in ${Math.round(performance.now() - kgStart)}ms.`);
      
      const totalTime = Math.round(performance.now() - totalStart);
      console.log(`[RAGEngine] Total retrieval time: ${totalTime}ms`);
      return [...finalChunksBeforeExpansion, ...newlyConnected].slice(0, topK + 2);
    }

    const totalTime = Math.round(performance.now() - totalStart);
    console.log(`[RAGEngine] Total retrieval time: ${totalTime}ms`);
    // Return the top K results
    return finalChunksBeforeExpansion;
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
