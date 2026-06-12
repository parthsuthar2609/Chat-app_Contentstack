type EditableTag = Record<string, string>;

type AdditionalParam = {
  hero_title?: EditableTag;
  hero_description?: EditableTag;
  main_heading?: EditableTag;
  text_subheading?: EditableTag;
  stack_name?: EditableTag;
  stack_slug?: EditableTag;
  system_prompt?: EditableTag;
  llm_prompt?: EditableTag;
  blog_filter_tags?: EditableTag;
  google_site?: EditableTag;
  google_site_restric?: EditableTag;
  so_tagged?: EditableTag;
  chat_tab_label?: EditableTag;
  search_tab_label?: EditableTag;
  chat_placeholder?: EditableTag;
  search_placeholder?: EditableTag;
  send_button_text?: EditableTag;
  search_button_text?: EditableTag;
  search_hint?: EditableTag;
  clear_chat_cta?: EditableTag;
  read_article_text?: EditableTag;
  searching_button_text?: EditableTag;
  content_stack_heading_1?: EditableTag;
  content_stack_heading_2?: EditableTag;
  content_stack_heading_3?: EditableTag;
  content_stack_heading_4?: EditableTag;
  sitecore_heading_1?: EditableTag;
  sitecore_heading_2?: EditableTag;
  sitecore_heading_3?: EditableTag;
  sitecore_heading_4?: EditableTag;
};

export type StackEditKeys = {
  name: keyof AdditionalParam;
  chatTabLabel: keyof AdditionalParam;
  searchTabLabel: keyof AdditionalParam;
  chatPlaceholder: keyof AdditionalParam;
  searchPlaceholder: keyof AdditionalParam;
  sendButtonText: keyof AdditionalParam;
  searchButtonText: keyof AdditionalParam;
  searchHint: keyof AdditionalParam;
  clearChatCta: keyof AdditionalParam;
  readArticleText: keyof AdditionalParam;
  searchingButtonText: keyof AdditionalParam;
};

export type TechStackCms = {
  stack_name?: string;
  stack_slug?: string;
  system_prompt?: string;
  llm_prompt?: string;
  chat_enabled?: boolean;
  search_enabled?: boolean;
  blog_filter_tags?: string;
  google_site?: string;
  google_site_restric?: string;
  so_tagged?: string;
  chat_tab_label?: string;
  search_tab_label?: string;
  chat_placeholder?: string;
  search_placeholder?: string;
  send_button_text?: string;
  search_button_text?: string;
  main_heading?: string;
  text_subheading?: string;
  search_hint?: string;
  clear_chat_cta?: string;
  read_article_text?: string;
  searching_button_text?: string;
  content_stack_heading_1?: string;
  content_stack_heading_2?: string;
  content_stack_heading_3?: string;
  content_stack_heading_4?: string;
  sitecore_heading_1?: string;
  sitecore_heading_2?: string;
  sitecore_heading_3?: string;
  sitecore_heading_4?: string;
  $?: AdditionalParam;
};

export type TechStack = {
  id: string;
  name: string;
  slug: string;
  llm_prompt?: string;
  blog_tags?: string;
  chat_enabled?: boolean;
  search_enabled?: boolean;
  chat_tab_label?: string;
  search_tab_label?: string;
  chat_placeholder?: string;
  search_placeholder?: string;
  send_button_text?: string;
  search_button_text?: string;
  main_heading?: string;
  text_subheading?: string;
  search_hint?: string;
  clear_chat_cta?: string;
  read_article_text?: string;
  searching_button_text?: string;
  suggested_prompts: SuggestedPromptItem[];
  editKeys: StackEditKeys;
  $?: AdditionalParam;
};

export type AiAssistantSeo = {
  enable_search_indexing?: boolean;
  meta_title?: string;
  meta_description?: string;
  [key: string]: string | boolean | undefined;
};

export type AiAssistantData = {
  uid?: string;
  locale?: string;
  title?: string;
  url?: string;
  hero_title?: string;
  hero_description?: string;
  main_heading?: string;
  text_subheading?: string;
  tech_stacks?: TechStackCms[];
  tech_stack?: TechStackCms | TechStackCms[];
  seo?: AiAssistantSeo;
  $?: AdditionalParam;
};

export type SuggestedPromptItem = {
  text: string;
  fieldKey: keyof AdditionalParam;
};

export type AiAssistantMode = 'chat' | 'search';

export type ChatSource = {
  uid: string;
  title: string;
  url: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  createdAt?: number;
};

export type SearchResultItem = {
  uid: string;
  title: string;
  url: string;
  excerpt: string;
};
