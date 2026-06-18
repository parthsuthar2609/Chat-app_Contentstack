import { ChatMessage } from '@/typescript/ai-assistant';

const FOLLOW_UP_TEMPLATES = [
  'Can you summarize that in simpler terms?',
  'What are the key takeaways?',
  'Can you give me a practical example?',
  'What should I do next?',
];

/** Build 2–3 contextual follow-up prompts from the last assistant reply. */
export function buildFollowUpPrompts(message: ChatMessage | undefined, limit = 3): string[] {
  if (!message || message.role !== 'assistant') return [];

  const prompts: string[] = [];

  if (message.sources?.length) {
    const first = message.sources[0];
    prompts.push(`Tell me more about "${first.title}"`);
    if (message.sources.length > 1) {
      prompts.push(`How do "${first.title}" and "${message.sources[1].title}" relate?`);
    }
  }

  if (message.content.length > 120) {
    prompts.push('Summarize your answer in 3 bullet points');
  }

  for (const template of FOLLOW_UP_TEMPLATES) {
    if (prompts.length >= limit) break;
    if (!prompts.includes(template)) prompts.push(template);
  }

  return prompts.slice(0, limit);
}
