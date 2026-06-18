import { Message } from '@/app/page';

/**
 * Convert an array of chat messages to a markdown representation.
 * User messages are prefixed with **You:** and AI messages with **Nexus:**.
 * Citations are kept as they appear in the AI HTML content.
 */
export function chatToMarkdown(messages: Message[]): string {
  const lines: string[] = [];
  messages.forEach((msg) => {
    if (msg.role === 'user') {
      const content = msg.text ?? '';
      lines.push(`**You:** ${content}`);
    } else if (msg.role === 'ai') {
      const html = msg.html ?? '';
      // Strip HTML tags while preserving <cite> citations
      const temp = document.createElement('div');
      temp.innerHTML = html;
      // Replace <cite> tags with markdown citation like [1]
      const citationReplaced = temp.innerHTML.replace(/<cite>(\d+)<\/cite>/gi, '[$1]');
      const text = citationReplaced.replace(/<[^>]+>/g, '');
      lines.push(`**Nexus:** ${text.trim()}`);
    }
  });
  return lines.join('\n\n');
}

/**
 * Triggers a download of the given markdown string.
 */
export function downloadMarkdown(messages: Message[], filename: string = 'chat_export.md') {
  const md = chatToMarkdown(messages);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Triggers a PDF export by opening the native browser print dialog.
 * Custom print CSS handles hiding navigation, sidebars, and input areas.
 */
export function downloadPdf() {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
