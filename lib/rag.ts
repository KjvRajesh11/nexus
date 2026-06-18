interface Chunk {
  text: string;
  documentName: string;
  id: number;
}

/**
 * Smart paragraph-aware text chunker.
 * Respects paragraph boundaries where possible, packing them into chunks of ~chunkSize.
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 150): string[] {
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    if (para.length > chunkSize) {
      // If a single paragraph is too large, flush the current chunk and split the paragraph
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      let i = 0;
      while (i < para.length) {
        chunks.push(para.slice(i, i + chunkSize));
        i += chunkSize - overlap;
      }
    } else {
      if ((currentChunk + "\n\n" + para).length > chunkSize) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = para;
      } else {
        currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Self-contained TF-IDF term relevance retrieval engine.
 * Computes scores for all document chunks based on term matching and returns the top K.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: Chunk[],
  topK = 8,
  maxChars = 12000
): Chunk[] {
  const tokenize = (text: string): string[] => text.toLowerCase().match(/\w+/g) || [];
  const queryTokens = Array.from(new Set(tokenize(query)));

  if (queryTokens.length === 0 || chunks.length === 0) {
    return chunks.slice(0, topK);
  }

  const totalChunks = chunks.length;

  // Calculate IDF for each query token
  const idfs: Record<string, number> = {};
  queryTokens.forEach(token => {
    const chunksWithToken = chunks.filter(c => tokenize(c.text).includes(token)).length;
    idfs[token] = Math.log((totalChunks + 1) / (chunksWithToken + 1)) + 1; // smoothed IDF
  });

  // Score all chunks
  const scored = chunks.map(chunk => {
    const tokens = tokenize(chunk.text);
    let score = 0;

    queryTokens.forEach(token => {
      const tf = tokens.filter(t => t === token).length / (tokens.length || 1);
      const idf = idfs[token] || 0;
      score += tf * idf;
    });

    return { chunk, score };
  });

  // Sort by score descending, then by original order
  scored.sort((a, b) => b.score - a.score);

  // Take top K chunks, fitting within maxChars budget
  const results: Chunk[] = [];
  let currentLength = 0;

  for (const item of scored) {
    if (results.length >= topK) break;
    // If we have some matches with non-zero scores, skip zero-score chunks once we have gathered context.
    // If no chunks matched the query (all score = 0), we still return the first few chunks as fallback context.
    if (item.score === 0 && results.length > 0 && scored[0].score > 0) {
      continue;
    }

    if (currentLength + item.chunk.text.length > maxChars) {
      if (results.length === 0) {
        results.push({
          ...item.chunk,
          text: item.chunk.text.slice(0, maxChars)
        });
      }
      break;
    }
    results.push(item.chunk);
    currentLength += item.chunk.text.length;
  }

  return results;
}
