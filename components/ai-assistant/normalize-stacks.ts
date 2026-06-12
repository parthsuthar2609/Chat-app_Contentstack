import { resolveSuggestedPrompts } from '@/components/ai-assistant/suggestions';
import {
  AiAssistantData,
  AdditionalParam,
  StackEditTags,
  TechStack,
  TechStackCms,
} from '@/typescript/ai-assistant';

type FieldMap = {
  name: keyof AdditionalParam;
  chatTabLabel: keyof AdditionalParam;
  searchTabLabel: keyof AdditionalParam;
  chatPlaceholder: keyof AdditionalParam;
  searchPlaceholder: keyof AdditionalParam;
};

const CONTENT_STACK_FIELDS: FieldMap = {
  name: 'stack_name',
  chatTabLabel: 'system_prompt',
  searchTabLabel: 'so_tagged',
  chatPlaceholder: 'google_site',
  searchPlaceholder: 'blog_filter_tags',
};

const SITECORE_FIELDS: FieldMap = {
  name: 'stack_slug',
  chatTabLabel: 'blog_filter_tags',
  searchTabLabel: 'so_tagged',
  chatPlaceholder: 'google_site',
  searchPlaceholder: 'blog_filter_tags',
};

function pickEditTags($: AdditionalParam | undefined, fields: FieldMap): StackEditTags {
  return {
    name: $?.[fields.name],
    chatTabLabel: $?.[fields.chatTabLabel],
    searchTabLabel: $?.[fields.searchTabLabel],
    chatPlaceholder: $?.[fields.chatPlaceholder],
    searchPlaceholder: $?.[fields.searchPlaceholder],
    sendButtonText: $?.send_button_text,
    searchButtonText: $?.search_button_text,
    searchHint: $?.search_hint,
    clearChatCta: $?.clear_chat_cta,
    readArticleText: $?.read_article_text,
    searchingButtonText: $?.searching_button_text,
  };
}

/** Turn one CMS row into a tab the UI can use. */
function toStack(
  raw: TechStackCms,
  id: string,
  name: string,
  slug: string,
  fields: FieldMap,
): TechStack {
  return {
    id,
    name,
    slug,
    llm_prompt: raw.llm_prompt,
    blog_tags: raw.blog_filter_tags,
    chat_enabled: raw.chat_enabled,
    search_enabled: raw.search_enabled,
    chat_tab_label: raw.chat_tab_label || raw.system_prompt,
    search_tab_label: raw.search_tab_label || raw.so_tagged,
    chat_placeholder: raw.chat_placeholder || raw.google_site || raw.google_site_restric,
    search_placeholder: raw.search_placeholder || raw.blog_filter_tags,
    send_button_text: raw.send_button_text,
    search_button_text: raw.search_button_text,
    searching_button_text: raw.searching_button_text,
    search_hint: raw.search_hint,
    clear_chat_cta: raw.clear_chat_cta,
    read_article_text: raw.read_article_text,
    suggested_prompts: resolveSuggestedPrompts(raw, id),
    editTags: pickEditTags(raw.$, fields),
    $: raw.$,
  };
}

/** One CMS row with stack_name + stack_slug becomes two tabs. */
function splitIntoTwoTabs(raw: TechStackCms): TechStack[] {
  const contentName = raw.stack_name?.trim();
  const sitecoreName = raw.stack_slug?.trim();
  if (!contentName || !sitecoreName) return [];

  return [
    toStack(raw, 'content-stack', contentName, 'contentstack', CONTENT_STACK_FIELDS),
    toStack(raw, 'sitecore-ai', sitecoreName, 'sitecore', SITECORE_FIELDS),
  ];
}

/** Read tech_stack from page data and return tabs for the UI. */
export function normalizeStacks(data: AiAssistantData): TechStack[] {
  const raw = data.tech_stacks ?? data.tech_stack;
  if (!raw) return [];

  const rows = Array.isArray(raw) ? raw : [raw];

  // Academy setup: one row → Content Stack + Sitecore tabs
  if (rows.length === 1) {
    const tabs = splitIntoTwoTabs(rows[0]);
    if (tabs.length) return tabs;
  }

  // Fallback: one tab per row
  return rows
    .filter((row) => row.stack_name?.trim())
    .map((row, index) => {
      const name = row.stack_name!.trim();
      const slug = row.stack_slug?.trim() || name;
      const id = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `stack-${index}`;
      return toStack(row, id, name, slug, CONTENT_STACK_FIELDS);
    });
}
