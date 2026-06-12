import { SuggestedPromptItem, TechStackCms } from '@/typescript/ai-assistant';

const CONTENT_STACK_HEADING_KEYS = [
  'content_stack_heading_1',
  'content_stack_heading_2',
  'content_stack_heading_3',
  'content_stack_heading_4',
] as const;

const SITECORE_HEADING_KEYS = [
  'sitecore_heading_1',
  'sitecore_heading_2',
  'sitecore_heading_3',
  'sitecore_heading_4',
] as const;

function collectHeadingPrompts(
  raw: TechStackCms,
  keys: readonly string[],
): SuggestedPromptItem[] {
  return keys
    .map((key) => {
      const value = raw[key as keyof TechStackCms];
      if (typeof value !== 'string' || !value.trim()) return null;
      return {
        text: value.trim(),
        fieldKey: key as SuggestedPromptItem['fieldKey'],
      };
    })
    .filter((item): item is SuggestedPromptItem => item !== null);
}

/** Resolve prompt chips from CMS heading fields per platform tab. */
export function resolveSuggestedPrompts(raw: TechStackCms, stackId: string): SuggestedPromptItem[] {
  if (stackId === 'content-stack') {
    return collectHeadingPrompts(raw, CONTENT_STACK_HEADING_KEYS);
  }

  if (stackId === 'sitecore-ai') {
    return collectHeadingPrompts(raw, SITECORE_HEADING_KEYS);
  }

  return [];
}
