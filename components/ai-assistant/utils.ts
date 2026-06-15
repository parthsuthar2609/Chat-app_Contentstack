import { ChatMessage } from '@/typescript/ai-assistant';

const PDF_PAGE_HEIGHT = 280;
const PDF_MARGIN = 15;

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

/** Download the conversation as a PDF file. */
export async function exportChatToPdf(
  messages: ChatMessage[],
  options: { assistantName?: string; title?: string; filename?: string } = {},
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const assistantName = options.assistantName ?? 'Assistant';
  const title = options.title ?? 'AI Assistant Chat';
  const filename = options.filename ?? 'ai-assistant-chat.pdf';

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
