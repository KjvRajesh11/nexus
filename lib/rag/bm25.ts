/**
 * A simple, native TypeScript implementation of the BM25 (Best Match 25) algorithm
 * for ranking document chunks based on query term frequency and inverse document frequency.
 */

export interface BM25Doc {
  id: string;
  text: string;
}

export class BM25 {
  private k1: number;
  private b: number;
  private documents: BM25Doc[] = [];

  // Pre-computed stats
  private docTokens: string[][] = [];
  private docLengths: number[] = [];
  private avgDocLength = 0;
  private N = 0;

  // Term frequencies per document: termsMap[docIndex][term] = count
  private termFreqs: Map<string, number>[] = [];
  // Document frequencies: how many documents contain a term
  private docFreqs = new Map<string, number>();

  constructor(documents: BM25Doc[], k1 = 1.2, b = 0.75) {
    this.documents = documents;
    this.k1 = k1;
    this.b = b;
    this.N = documents.length;
    this.initialize();
  }

  /**
   * Tokenizes text into normalized words (lowercased, punctuation removed)
   */
  public static tokenize(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, " ")
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 1); // Ignore single characters/stop-words like 'a', 'I'
  }

  private initialize() {
    let totalLength = 0;

    for (let i = 0; i < this.N; i++) {
      const tokens = BM25.tokenize(this.documents[i].text);
      this.docTokens.push(tokens);
      this.docLengths.push(tokens.length);
      totalLength += tokens.length;

      const tfMap = new Map<string, number>();
      const uniqueTerms = new Set<string>();

      for (const token of tokens) {
        tfMap.set(token, (tfMap.get(token) || 0) + 1);
        uniqueTerms.add(token);
      }

      this.termFreqs.push(tfMap);

      for (const term of uniqueTerms) {
        this.docFreqs.set(term, (this.docFreqs.get(term) || 0) + 1);
      }
    }

    this.avgDocLength = this.N > 0 ? totalLength / this.N : 0;
  }

  /**
   * Computes the Inverse Document Frequency (IDF) for a given term.
   * Uses standard BM25 IDF formula with a smoothing factor of 0.5.
   */
  private idf(term: string): number {
    const df = this.docFreqs.get(term) || 0;
    // Standard BM25 IDF: Math.log(1 + (N - df + 0.5) / (df + 0.5))
    // We add 0.5 to prevent division by zero and negative values
    return Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
  }

  /**
   * Scores all documents against a query string.
   * Returns a sorted list of matches with their document index and score.
   */
  public search(query: string): { index: number; score: number }[] {
    const queryTokens = BM25.tokenize(query);
    if (queryTokens.length === 0 || this.N === 0) {
      return [];
    }

    const scores: { index: number; score: number }[] = [];

    for (let docIdx = 0; docIdx < this.N; docIdx++) {
      let score = 0;
      const docLen = this.docLengths[docIdx];
      const tfMap = this.termFreqs[docIdx];

      for (const term of queryTokens) {
        const tf = tfMap.get(term) || 0;
        if (tf === 0) continue;

        const termIdf = this.idf(term);

        // BM25 term weighting formula:
        // score += IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)))
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));

        score += termIdf * (numerator / denominator);
      }

      if (score > 0) {
        scores.push({ index: docIdx, score });
      }
    }

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }
}
