import { Chunk } from "./vector-store";

export interface AcademicPaper {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  abstract: string;
  url: string;
  source: "OpenAlex" | "Semantic Scholar";
}

/** Timeout for all external academic API requests (milliseconds). */
const ACADEMIC_FETCH_TIMEOUT_MS = 6000;

/** Maximum consecutive failures before circuit breaker trips. */
const CIRCUIT_BREAKER_THRESHOLD = 3;

/** How long (ms) to skip a service after circuit breaker trips. */
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Circuit breaker state per API service.
 * Prevents wasting time on a service that is consistently failing.
 */
interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureTime: number;
  isOpen: boolean; // true = tripped, skip requests
}

const circuitBreakers: Record<string, CircuitBreakerState> = {
  openalex: { consecutiveFailures: 0, lastFailureTime: 0, isOpen: false },
  semanticscholar: { consecutiveFailures: 0, lastFailureTime: 0, isOpen: false },
};

/**
 * Check if a service's circuit breaker allows requests.
 * If the breaker is open but cooldown has elapsed, close it (half-open/retry).
 */
function isServiceAvailable(service: string): boolean {
  const cb = circuitBreakers[service];
  if (!cb) return true;
  if (!cb.isOpen) return true;
  
  // Check if cooldown has elapsed
  if (Date.now() - cb.lastFailureTime > CIRCUIT_BREAKER_COOLDOWN_MS) {
    console.log(`[AcademicSearch] Circuit breaker for ${service} cooldown elapsed. Resetting to half-open.`);
    cb.isOpen = false;
    cb.consecutiveFailures = 0;
    return true;
  }
  
  console.warn(`[AcademicSearch] Circuit breaker OPEN for ${service}. Skipping. (${cb.consecutiveFailures} consecutive failures, cooldown ${Math.round((CIRCUIT_BREAKER_COOLDOWN_MS - (Date.now() - cb.lastFailureTime)) / 1000)}s remaining)`);
  return false;
}

/** Record a successful request — reset the breaker. */
function recordSuccess(service: string) {
  const cb = circuitBreakers[service];
  if (cb) {
    cb.consecutiveFailures = 0;
    cb.isOpen = false;
  }
}

/** Record a failure — increment count and potentially trip the breaker. */
function recordFailure(service: string) {
  const cb = circuitBreakers[service];
  if (!cb) return;
  cb.consecutiveFailures++;
  cb.lastFailureTime = Date.now();
  if (cb.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
    cb.isOpen = true;
    console.warn(`[AcademicSearch] Circuit breaker TRIPPED for ${service} after ${cb.consecutiveFailures} consecutive failures. Skipping for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`);
  }
}

/**
 * Fetch wrapper with abort-based timeout and retry-once on 5xx/network errors.
 * Does NOT retry on 429 (rate limit) — those should be respected.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response | null> {
  const attempt = async (): Promise<Response | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ACADEMIC_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`[AcademicSearch] Request timed out after ${ACADEMIC_FETCH_TIMEOUT_MS}ms: ${url.substring(0, 80)}...`);
      } else {
        console.error(`[AcademicSearch] Network error on fetch:`, err.message);
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  // First attempt
  let res = await attempt();

  // Retry once on 5xx or null (network/timeout error), but NOT on 429
  if (res === null || (res.status >= 500 && res.status < 600)) {
    const retryReason = res === null ? "timeout/network error" : `server error ${res.status}`;
    console.log(`[AcademicSearch] Retrying once after ${retryReason}: ${url.substring(0, 80)}...`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    res = await attempt();
  }

  return res;
}

/**
 * Reconstructs the abstract from OpenAlex's abstract_inverted_index format.
 */
function reconstructAbstract(invertedIndex: any): string {
  if (!invertedIndex) return "";
  try {
    const words: string[] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      if (Array.isArray(positions)) {
        for (const pos of positions) {
          words[pos] = word;
        }
      }
    }
    // Filter out undefined slots and join
    return words.filter(w => w !== undefined).join(" ").trim();
  } catch (err) {
    console.error("[AcademicSearch] Abstract reconstruction error:", err);
    return "";
  }
}

/**
 * Search academic publications via the official OpenAlex API.
 */
export async function searchOpenAlex(query: string, limit = 5): Promise<AcademicPaper[]> {
  if (!query || query.trim() === "") return [];
  if (!isServiceAvailable("openalex")) return [];
  
  try {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=${limit}&mailto=nexus-agent@example.com`;
    
    console.log(`[AcademicSearch] Querying OpenAlex: "${query}"`);
    const res = await fetchWithTimeout(url, {
      headers: { "User-Agent": "NexusResearchBot/1.0 (mailto:nexus-agent@example.com)" }
    });

    if (!res) {
      recordFailure("openalex");
      return [];
    }

    if (res.status === 429) {
      console.warn(`[AcademicSearch] OpenAlex rate-limited (429). Skipping this source.`);
      // Don't count rate limits toward circuit breaker — they're expected behavior
      return [];
    }

    if (!res.ok) {
      console.warn(`[AcademicSearch] OpenAlex API returned status ${res.status}`);
      recordFailure("openalex");
      return [];
    }

    const data = await res.json();
    const results = data.results || [];
    
    recordSuccess("openalex");
    
    return results.map((w: any) => {
      const authors = (w.authorships || [])
        .map((a: any) => a.author?.display_name)
        .filter(Boolean)
        .join(", ");
      
      const venue = w.primary_location?.source?.display_name || "";
      const abstract = reconstructAbstract(w.abstract_inverted_index);
      
      return {
        id: `openalex_${w.id.split("/").pop()}`,
        title: w.title || "Untitled Paper",
        authors: authors || "Unknown Authors",
        venue: venue || "Unknown Venue",
        year: w.publication_year || new Date().getFullYear(),
        abstract: abstract || w.display_name || "",
        url: w.doi || w.id || "",
        source: "OpenAlex" as const
      };
    });
  } catch (err) {
    console.error("[AcademicSearch] OpenAlex search failed:", err);
    recordFailure("openalex");
    return [];
  }
}

/**
 * Search academic publications via the official Semantic Scholar API.
 */
export async function searchSemanticScholar(query: string, limit = 5): Promise<AcademicPaper[]> {
  if (!query || query.trim() === "") return [];
  if (!isServiceAvailable("semanticscholar")) return [];

  try {
    const fields = "title,authors,venue,year,abstract,url";
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${fields}`;

    console.log(`[AcademicSearch] Querying Semantic Scholar: "${query}"`);
    const res = await fetchWithTimeout(url);

    if (!res) {
      recordFailure("semanticscholar");
      return [];
    }

    if (res.status === 429) {
      console.warn(`[AcademicSearch] Semantic Scholar rate-limited (429). Skipping this source.`);
      return [];
    }

    if (!res.ok) {
      console.warn(`[AcademicSearch] Semantic Scholar API returned status ${res.status}`);
      recordFailure("semanticscholar");
      return [];
    }

    const data = await res.json();
    const results = data.data || [];

    recordSuccess("semanticscholar");

    return results.map((p: any) => {
      const authors = (p.authors || [])
        .map((a: any) => a.name)
        .filter(Boolean)
        .join(", ");
      
      return {
        id: `s2_${p.paperId}`,
        title: p.title || "Untitled Paper",
        authors: authors || "Unknown Authors",
        venue: p.venue || "Unknown Venue",
        year: p.year || new Date().getFullYear(),
        abstract: p.abstract || "",
        url: p.url || "",
        source: "Semantic Scholar" as const
      };
    });
  } catch (err) {
    console.error("[AcademicSearch] Semantic Scholar search failed:", err);
    recordFailure("semanticscholar");
    return [];
  }
}

/**
 * Search academic databases, merge, de-duplicate and format into RAG Chunks.
 */
export async function searchAcademicDatabases(query: string, limit = 5): Promise<Chunk[]> {
  if (!query || query.trim() === "") return [];

  // Run both searches in parallel — each has its own internal timeout, so this is safe
  const [openAlexResults, s2Results] = await Promise.all([
    searchOpenAlex(query, limit),
    searchSemanticScholar(query, limit)
  ]);

  const merged = [...openAlexResults, ...s2Results];
  
  // De-duplicate by normalised title
  const seenTitles = new Set<string>();
  const uniquePapers: AcademicPaper[] = [];

  for (const paper of merged) {
    const normalizedTitle = paper.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(normalizedTitle)) {
      seenTitles.add(normalizedTitle);
      uniquePapers.push(paper);
    }
  }

  // Format into Chunk structures, tagging source type so UI can show badges
  return uniquePapers.map(paper => {
    const chunkText = `[Title] ${paper.title}
[Authors] ${paper.authors}
[Source] ${paper.venue} (${paper.year})
[Link] ${paper.url}
[Abstract] ${paper.abstract}`;

    return {
      id: `academic_${paper.id}`,
      documentId: `doc_${paper.id}`,
      // Source tag: prefix tells frontend to apply the "🎓 Academic" badge
      documentName: `${paper.source}: ${paper.title} (${paper.year})`,
      text: chunkText,
      embedding: [] // Embeddings computed by retrieval node before RRF
    };
  });
}
