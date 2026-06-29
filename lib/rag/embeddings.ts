import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * EmbeddingsService provides text vectorization capabilities.
 * 
 * Default / Preferred Model: Google Gemini 'text-embedding-004' (768 dimensions).
 * Requires the GEMINI_API_KEY or GOOGLE_API_KEY environment variable.
 * 
 * Fallback Mode: In the absence of a Google API key, the service utilizes a local,
 * deterministic unit-vector hash projection. This ensures that the application remains
 * functional for developer evaluations and offline tests, returning normalized vectors of
 * the correct dimension (768) that can be compared using cosine similarity.
 */
export class EmbeddingsService {
  private genAI: GoogleGenerativeAI | null = null;
  private warnedFallback = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // Check if a valid, non-placeholder API key is set
    const hasValidKey = apiKey &&
      apiKey.trim() !== "" &&
      apiKey !== "your_gemini_api_key_here" &&
      apiKey !== "your-key-here";

    if (hasValidKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log("[EmbeddingsService] Initialized Google Gemini (text-embedding-004) embeddings.");
    } else {
      console.warn(
        "[EmbeddingsService] WARNING: No valid GEMINI_API_KEY or GOOGLE_API_KEY found. " +
        "RAG will fall back to local vector simulation. To enable high-accuracy semantic search, " +
        "please add GEMINI_API_KEY to your .env.local file."
      );
      this.warnedFallback = true;
    }
  }

  /**
   * Generates a 768-dimensional vector embedding for a string of text.
   * Uses Google Gemini 'text-embedding-004' if an API key is configured.
   * If the API key is configured but the API call fails, throws an error to prevent silent retrieval degradation.
   * Falls back to a deterministic local simulated vector ONLY if no API key is configured.
   */
  public async embedText(text: string): Promise<number[]> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await model.embedContent(text);
        if (result?.embedding?.values) {
          return result.embedding.values;
        }
        throw new Error("Empty embedding values received from the Gemini API.");
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[EmbeddingsService] Google Gemini embedding API failure: ${errMsg}`);
        throw new Error(`Google Gemini embeddings generation failed: ${errMsg}. Check your GEMINI_API_KEY/GOOGLE_API_KEY environment variables.`);
      }
    }

    if (!this.warnedFallback) {
      console.warn(
        "[EmbeddingsService] Fallback mode active: No GEMINI_API_KEY or GOOGLE_API_KEY was found in the environment. " +
        "Using local deterministic character-hash unit-vector simulation for development/testing."
      );
      this.warnedFallback = true;
    }

    return this.generateFallbackEmbedding(text);
  }

  /**
   * Generates a deterministic 768-dimensional vector from string inputs.
   * Maps characters to sine/cosine coordinates and normalizes the resulting
   * array to lie on the unit sphere (magnitude = 1.0).
   * 
   * This ensures cosine similarity (A . B) matches the dot product exactly.
   */
  private generateFallbackEmbedding(text: string): number[] {
    const dims = 768;
    const vector = new Array<number>(dims).fill(0);

    if (!text || text.trim() === "") {
      vector[0] = 1.0;
      return vector;
    }

    // A lightweight hash projection to fill the dimensions
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index1 = (charCode * (i + 17)) % dims;
      const index2 = (charCode * 31 + i) % dims;
      vector[index1] += Math.sin(charCode + i) * 2.0;
      vector[index2] += Math.cos(charCode * (i + 3)) * 1.5;
    }

    // Normalize vector to have a magnitude of 1.0 (unit sphere)
    let sumOfSquares = 0;
    for (let i = 0; i < dims; i++) {
      sumOfSquares += vector[i] * vector[i];
    }
    const magnitude = Math.sqrt(sumOfSquares);

    if (magnitude === 0) {
      vector[0] = 1.0;
    } else {
      for (let i = 0; i < dims; i++) {
        vector[i] /= magnitude;
      }
    }

    return vector;
  }
}
