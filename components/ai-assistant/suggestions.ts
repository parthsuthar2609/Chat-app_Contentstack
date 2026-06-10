const CONTENT_STACK_PROMPTS = [
  'What is a headless CMS and why use Contentstack?',
  'How does Live Preview work with Next.js?',
  'Explain modular blocks in a Page content type',
  'Best practices for publishing entries to development',
];

const SITECORE_PROMPTS = [
  'What is Sitecore XM Cloud?',
  'How does composable DXP differ from monolithic CMS?',
  'When should I choose Sitecore AI features?',
  'Compare headless delivery vs traditional Sitecore',
];

const GENERIC_PROMPTS = [
  'Summarize the latest blog posts on this site',
  'What is composable architecture in one paragraph?',
  'Give me a 3-step CMS content workflow',
];

export function getSuggestionsForStack(stackId: string, stackName: string): string[] {
  if (stackId === 'content-stack' || /content\s*stack/i.test(stackName)) {
    return CONTENT_STACK_PROMPTS;
  }
  if (stackId === 'sitecore-ai' || /sitecore/i.test(stackName)) {
    return SITECORE_PROMPTS;
  }
  return GENERIC_PROMPTS;
}
