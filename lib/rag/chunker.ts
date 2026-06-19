/**
 * Options for the Recursive Character Chunker
 */
export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

/**
 * A recursive character-based text splitter, designed to keep paragraphs, sentences,
 * and words together as much as possible to preserve semantic coherence.
 */
export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: ChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? 1000;
    this.chunkOverlap = options.chunkOverlap ?? 150;
    this.separators = options.separators ?? ["\n\n", "\n", ". ", " ", ""];
  }

  /**
   * Splits the input text into chunks.
   */
  public splitText(text: string): string[] {
    return this.split(text, this.separators);
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
