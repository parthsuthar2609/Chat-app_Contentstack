import { ChatMessage } from '@/typescript/ai-assistant';

const PDF_PAGE_HEIGHT = 280;
const PDF_MARGIN = 15;

export const MAX_CHAT_INPUT_CHARS = 2000;

export function formatMessageTime(ts?: number): string {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function buildChatTranscript(messages: ChatMessage[], assistantName = 'Assistant'): string {
  return messages
    .map((m) => {
      const label = m.role === 'user' ? 'You' : assistantName;
      const time = m.createdAt ? ` (${formatMessageTime(m.createdAt)})` : '';
      return `${label}${time}:\n${m.content}`;
    })
    .join('\n\n---\n\n');
}

/** Build a filesystem-safe unique export name, e.g. `content-stack-chat-2026-06-03_14-30-52.pdf` */
export function buildUniqueExportFilename(baseName: string, extension = 'pdf'): string {
  const safe =
    baseName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'export';
  const stamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', '_')
    .replace(/:/g, '-');
  return `${safe}-${stamp}.${extension}`;
}

/** Download the conversation as a PDF file. */
export async function exportChatToPdf(
  messages: ChatMessage[],
  options: { assistantName?: string; title?: string; filename?: string } = {},
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const assistantName = options.assistantName ?? 'Assistant';
  const title = options.title ?? 'AI Assistant Chat';
  const filename = buildUniqueExportFilename(options.filename ?? 'ai-assistant-chat.pdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - PDF_MARGIN * 2;
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > PDF_PAGE_HEIGHT) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PDF_MARGIN, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Exported ${new Date().toLocaleString()}`, PDF_MARGIN, y);
  y += 12;
  doc.setTextColor(0);

  for (const msg of messages) {
    const label = msg.role === 'user' ? 'You' : assistantName;
    const time = msg.createdAt ? ` · ${formatMessageTime(msg.createdAt)}` : '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const headerLines = doc.splitTextToSize(`${label}${time}`, maxWidth) as string[];
    ensureSpace(headerLines.length * 5 + 4);
    doc.text(headerLines, PDF_MARGIN, y);
    y += headerLines.length * 5 + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const bodyLines = doc.splitTextToSize(msg.content, maxWidth) as string[];
    for (const line of bodyLines) {
      ensureSpace(5);
      doc.text(line, PDF_MARGIN, y);
      y += 5;
    }

    if (msg.sources?.length) {
      ensureSpace(8);
      doc.setFontSize(9);
      doc.setTextColor(113, 92, 221);
      doc.text('Sources:', PDF_MARGIN, y);
      y += 4;
      for (const source of msg.sources) {
        ensureSpace(4);
        doc.text(`• ${source.title} (${source.url})`, PDF_MARGIN + 2, y);
        y += 4;
      }
      doc.setTextColor(0);
      doc.setFontSize(10);
    }

    y += 6;
  }

  doc.save(filename);
}

/** Copy full conversation to clipboard as plain text. */
export async function copyChatTranscript(
  messages: ChatMessage[],
  assistantName = 'Assistant',
): Promise<void> {
  const text = buildChatTranscript(messages, assistantName);
  await navigator.clipboard.writeText(text);
}

/** Download conversation as a plain-text file. */
export function downloadChatTranscript(
  messages: ChatMessage[],
  options: { assistantName?: string; filename?: string } = {},
): void {
  const assistantName = options.assistantName ?? 'Assistant';
  const filename = options.filename ?? 'ai-assistant-chat.txt';
  const blob = new Blob([buildChatTranscript(messages, assistantName)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const CHAT_STORAGE_KEY = 'ai-assistant-chat';
const MAX_CHAT_MESSAGES = 50;

/** Load saved messages for one platform tab (Content Stack / Sitecore). */
export function loadChatHistory(stackId: string): ChatMessage[] {
  if (typeof window === 'undefined' || !stackId) return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_KEY}:${stackId}`);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

/** Save messages for one platform tab (keeps last 50). */
export function saveChatHistory(stackId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined' || !stackId) return;
  try {
    const trimmed = messages.slice(-MAX_CHAT_MESSAGES);
    localStorage.setItem(`${CHAT_STORAGE_KEY}:${stackId}`, JSON.stringify(trimmed));
  } catch {
    /* storage full */
  }
}

/** Remove saved messages for one platform tab. */
export function clearChatHistory(stackId: string): void {
  if (typeof window === 'undefined' || !stackId) return;
  localStorage.removeItem(`${CHAT_STORAGE_KEY}:${stackId}`);
}

export function loadSearchHistory(stackId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`ai-assistant-search:${stackId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(stackId: string, query: string, limit = 5): string[] {
  const trimmed = query.trim();
  if (!trimmed || typeof window === 'undefined') return [];
  const next = [trimmed, ...loadSearchHistory(stackId).filter((q) => q !== trimmed)].slice(0, limit);
  sessionStorage.setItem(`ai-assistant-search:${stackId}`, JSON.stringify(next));
  return next;
}

export function clearSearchHistory(stackId: string): void {
  if (typeof window === 'undefined' || !stackId) return;
  sessionStorage.removeItem(`ai-assistant-search:${stackId}`);
}

const FEEDBACK_STORAGE_KEY = 'ai-assistant-feedback';

/** Persist thumbs up/down per message id (local only). */
export function saveMessageFeedback(messageId: string, feedback: 'up' | 'down' | null): void {
  if (typeof window === 'undefined' || !messageId) return;
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, 'up' | 'down'>) : {};
    if (feedback) map[messageId] = feedback;
    else delete map[messageId];
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage full */
  }
}

export function loadMessageFeedback(messageId: string): 'up' | 'down' | null {
  if (typeof window === 'undefined' || !messageId) return null;
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, 'up' | 'down'>) : {};
    return map[messageId] ?? null;
  } catch {
    return null;
  }
}
