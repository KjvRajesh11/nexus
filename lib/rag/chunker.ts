/**
 * Options for the Recursive Character Chunker
 */
export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

/**
 * Patterns for detecting section headers (used as natural chunk boundaries).
 */
const SECTION_HEADER_PATTERNS = [
  /^#{1,4}\s+.+/,                                // Markdown: ## Section, ### Subsection
  /^(?:I{1,3}V?|VI{0,3}|IX|X{0,3})\.\s+[A-Z]/,  // Roman numerals: IV. Results
  /^\d{1,2}(?:\.\d{1,2}){0,2}\s+[A-Z]/,          // Numbered: 3.1 Methods, 4.2.1 Overview
  /^(?:ABSTRACT|INTRODUCTION|METHODS?|RESULTS?|DISCUSSION|CONCLUSION|ACKNOWLEDGEMENTS?|REFERENCES|BIBLIOGRAPHY)\s*$/i, // Standalone section names
];

/**
 * Patterns for header/footer noise to strip.
 */
const NOISE_LINE_PATTERNS = [
  /^page \d+ (?:of \d+)?$/i,
  /^\d+$/,                                          // Standalone page numbers
  /^(?:chapter|section)\s+\d+\s*[•·|—-]\s*.+/i,    // Running headers like "Chapter 5 • Methods"
  /copyright ©.*not for distribution/i,
  /^doi:\s*10\.\d{4,}/i,                            // DOI lines
  /^https?:\/\/doi\.org\//i,                         // DOI URL lines
  /^\[?\s*downloaded from\s/i,                       // Journal watermarks
  /^this article has been/i,
  /^preprint\s+(?:not|submitted)/i,
];

/**
 * Detects the start of a references/bibliography section.
 */
function isReferenceSectionStart(line: string): boolean {
  const trimmed = line.trim();
  return /^(?:references|bibliography|works cited|literature cited)\s*$/i.test(trimmed);
}

/**
 * A recursive character-based text splitter, designed to keep paragraphs, sentences,
 * and words together as much as possible to preserve semantic coherence.
 *
 * Layout-aware features:
 * - Merges hyphenated words across line breaks
 * - Strips header/footer noise (page numbers, DOIs, watermarks)
 * - Keeps tables intact within single chunks
 * - Groups figure/table captions with surrounding content
 * - Detects section headers as natural chunk boundaries
 * - Strips trailing reference/bibliography sections
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: ChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? 1200;
    this.chunkOverlap = options.chunkOverlap ?? 200;
    this.separators = options.separators ?? ["\n\n", "\n", ". ", " ", ""];
  }

  /**
   * Splits the input text into chunks, using pre-processing layout-aware heuristics to:
   * 1. Merge line-break hyphenated words (e.g. "comput-\ner" -> "computer").
   * 2. Clean page numbers and header/footer noise.
   * 3. Normalize figure/table captions to prevent orphan splits.
   * 4. Keep tab/space-delimited tables intact in single chunks.
   * 5. Detect section headers as natural split points.
   * 6. Strip trailing references/bibliography sections.
   */
  public splitText(text: string): string[] {
    if (!text) return [];

    // 1. Merge hyphenated words across line boundaries
    let processedText = text.replace(/(\w+)-\s*\n\s*(\w+)/g, "$1$2");

    // 2. Prevent caption isolation by removing double-newlines before/after captions
    processedText = processedText.replace(/\n\n(Figure\s+\d+|Fig\.\s+\d+|Table\s+\d+|Chart\s+\d+|Diagram\s+\d+)/gi, "\n$1");
    processedText = processedText.replace(/(Figure\s+\d+|Fig\.\s+\d+|Table\s+\d+|Chart\s+\d+|Diagram\s+\d+)[:.]\s*\n\n/gi, "$1: ");

    const lines = processedText.split("\n");
    const chunks: string[] = [];
    let currentTextBuffer: string[] = [];
    let currentTableBuffer: string[] = [];
    let inTable = false;
    let inReferences = false;

    // Helper to check if a line is likely part of a table (piped or space/tab aligned columns)
    const isLikelyTableRow = (lineStr: string, inTab: boolean): boolean => {
      const trimmedLine = lineStr.trim();
      if (trimmedLine.length === 0) return false;

      // Piped tables
      if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|") && trimmedLine.length > 2) return true;
      if (inTab && trimmedLine.includes("|") && (trimmedLine.startsWith("-") || trimmedLine.startsWith("|"))) return true;

      // Split by tabs or 2+ consecutive spaces
      const parts = trimmedLine.split(/\t| {2,}/);
      if (parts.length >= 2) {
        if (inTab) return true; // Keep collecting table rows
        if (parts.length >= 3) return true; // 3+ columns is definitely a table

        // For 2 columns, verify it's data-heavy (number, date, short code, currency etc.)
        const hasDataOrShortText = parts.some(p =>
          /^\$?[\d,.-]+%?$/.test(p.trim()) ||
          p.trim().length <= 15
        );
        if (hasDataOrShortText) return true;
      }
      return false;
    };

    /** Check if a line matches a section header pattern */
    const isSectionHeader = (lineStr: string): boolean => {
      const trimmed = lineStr.trim();
      if (trimmed.length === 0 || trimmed.length > 120) return false;
      return SECTION_HEADER_PATTERNS.some(pattern => pattern.test(trimmed));
    };

    /** Check if a line is noise that should be stripped */
    const isNoiseLine = (lineStr: string): boolean => {
      const trimmed = lineStr.trim();
      if (trimmed.length === 0) return false;
      return NOISE_LINE_PATTERNS.some(pattern => pattern.test(trimmed));
    };

    /** Flush the current text buffer into chunks */
    const flushTextBuffer = () => {
      if (currentTextBuffer.length > 0) {
        chunks.push(...this.split(currentTextBuffer.join("\n"), this.separators));
        currentTextBuffer = [];
      }
    };

    /** Flush the current table buffer into chunks */
    const flushTableBuffer = () => {
      if (currentTableBuffer.length > 0) {
        const tableText = currentTableBuffer.join("\n");
        if (tableText.length <= this.chunkSize) {
          chunks.push(tableText);
        } else {
          chunks.push(...this.split(tableText, this.separators));
        }
        currentTableBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Strip noise lines
      if (isNoiseLine(line)) continue;

      // Detect start of references section and stop processing
      if (isReferenceSectionStart(line)) {
        inReferences = true;
        continue;
      }
      if (inReferences) continue; // Skip all lines after references header

      const isTableLine = isLikelyTableRow(line, inTable);

      if (isTableLine) {
        if (!inTable) {
          inTable = true;
          // Flush normal text first
          flushTextBuffer();
        }
        currentTableBuffer.push(line);
      } else {
        if (inTable) {
          inTable = false;
          flushTableBuffer();
        }

        // If this is a section header, flush the buffer to create a natural break
        if (isSectionHeader(line) && currentTextBuffer.length > 0) {
          flushTextBuffer();
        }

        currentTextBuffer.push(line);
      }
    }

    // Flush ALL remaining buffers (fixes the bug where only one would flush)
    if (inTable) {
      flushTableBuffer();
    }
    if (currentTextBuffer.length > 0) {
      flushTextBuffer();
    }

    return chunks.map(c => c.trim()).filter(Boolean);
  }

  /**
   * Internal recursive split function.
   */
  private split(text: string, separators: string[]): string[] {
    // If text is already small enough, return it as a single piece
    if (text.length <= this.chunkSize) {
      return [text];
    }

    // If no separators are left, hard-split the text by size
    if (separators.length === 0) {
      const chunks: string[] = [];
      let start = 0;
      while (start < text.length) {
        chunks.push(text.slice(start, start + this.chunkSize));
        start += this.chunkSize - this.chunkOverlap;
      }
      return chunks;
    }

    // Select the first separator and split
    const separator = separators[0];
    const nextSeparators = separators.slice(1);

    // We split, but we want to preserve the separator if it is something like a period.
    // For simplicity, standard string split:
    const parts = this.splitBySeparator(text, separator);

    const finalChunks: string[] = [];
    let currentChunk = "";

    for (const part of parts) {
      // If a single part is larger than chunkSize, we split it recursively
      if (part.length > this.chunkSize) {
        // First flush any current chunk
        if (currentChunk) {
          finalChunks.push(currentChunk);
          currentChunk = "";
        }

        // Recursively split the large part
        const subChunks = this.split(part, nextSeparators);

        // Merge sub-chunks into final list, handling overlap at boundaries
        for (const subChunk of subChunks) {
          if (currentChunk === "") {
            currentChunk = subChunk;
          } else if ((currentChunk + subChunk).length <= this.chunkSize) {
            currentChunk += subChunk;
          } else {
            finalChunks.push(currentChunk);
            // Implement overlap
            currentChunk = this.getOverlapText(currentChunk, subChunk) + subChunk;
          }
        }
      } else {
        // If adding this part exceeds chunkSize
        if (currentChunk === "") {
          currentChunk = part;
        } else if ((currentChunk + part).length <= this.chunkSize) {
          currentChunk += part;
        } else {
          finalChunks.push(currentChunk);
          // Start next chunk with the overlap text from the current chunk + the new part
          currentChunk = this.getOverlapText(currentChunk, part) + part;
        }
      }
    }

    if (currentChunk) {
      finalChunks.push(currentChunk);
    }

    return finalChunks.map(c => c.trim()).filter(Boolean);
  }

  /**
   * Split string by separator, keeping the separator at the end of the parts if it is a punctuation separator.
   */
  private splitBySeparator(text: string, separator: string): string[] {
    if (separator === "") {
      return text.split("");
    }

    const parts = text.split(separator);
    if (parts.length <= 1) {
      return parts;
    }

    // Reconstruct parts to keep separators if desired (e.g. for paragraphs or sentence periods)
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      // Re-attach separator to all but the last item
      if (i < parts.length - 1) {
        part = part + separator;
      }
      if (part) {
        result.push(part);
      }
    }
    return result;
  }

  /**
   * Extracts overlap text from the end of the current chunk, up to chunkOverlap characters,
   * preferably cutting at a word boundary.
   */
  private getOverlapText(currentChunk: string, nextPart: string): string {
    if (this.chunkOverlap <= 0) return "";

    const rawOverlap = currentChunk.slice(-this.chunkOverlap);
    // Find the first space/newline in the overlap to avoid mid-word cuts
    const spaceIndex = rawOverlap.indexOf(" ");
    if (spaceIndex !== -1 && spaceIndex < this.chunkOverlap * 0.5) {
      return rawOverlap.slice(spaceIndex + 1);
    }
    return rawOverlap;
  }
}
