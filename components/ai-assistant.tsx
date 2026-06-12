'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import parse from 'html-react-parser';
import Link from 'next/link';
import ChatMessageBubble from '@/components/ai-assistant/chat-message';
import SuggestedPrompts from '@/components/ai-assistant/suggested-prompts';
import { resolveStackIconKey, StackIcon } from '@/components/ai-assistant/stack-icons';
import { resolveSuggestedPrompts } from '@/components/ai-assistant/suggestions';
import {
  AiAssistantData,
  AiAssistantMode,
  ChatMessage,
  SearchResultItem,
  StackEditKeys,
  TechStack,
  TechStackCms,
} from '@/typescript/ai-assistant';

type AiAssistantProps = {
  data: AiAssistantData;
};

const STORAGE_PREFIX = 'ai-assistant-messages';

function slugify(value?: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getEditTag(stack: TechStack, key: keyof StackEditKeys) {
  const field = stack.editKeys[key];
  return stack.$?.[field] as Record<string, string> | undefined;
}

function mapCmsToStack(
  raw: TechStackCms,
  id: string,
  name: string,
  slug: string,
  editKeys: StackEditKeys,
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
    main_heading: raw.main_heading,
    text_subheading: raw.text_subheading,
    search_hint: raw.search_hint,
    clear_chat_cta: raw.clear_chat_cta,
    read_article_text: raw.read_article_text,
    searching_button_text: raw.searching_button_text,
    suggested_prompts: resolveSuggestedPrompts(raw, id),
    editKeys,
    $: raw.$,
  };
}

const SHARED_STACK_EDIT_KEYS = {
  sendButtonText: 'send_button_text' as const,
  searchButtonText: 'search_button_text' as const,
  searchHint: 'search_hint' as const,
  clearChatCta: 'clear_chat_cta' as const,
  readArticleText: 'read_article_text' as const,
  searchingButtonText: 'searching_button_text' as const,
};

const CONTENT_STACK_EDIT_KEYS: StackEditKeys = {
  name: 'stack_name',
  chatTabLabel: 'system_prompt',
  searchTabLabel: 'so_tagged',
  chatPlaceholder: 'google_site',
  searchPlaceholder: 'blog_filter_tags',
  ...SHARED_STACK_EDIT_KEYS,
};

const SITECORE_EDIT_KEYS: StackEditKeys = {
  name: 'stack_slug',
  chatTabLabel: 'blog_filter_tags',
  searchTabLabel: 'so_tagged',
  chatPlaceholder: 'google_site',
  searchPlaceholder: 'blog_filter_tags',
  ...SHARED_STACK_EDIT_KEYS,
};

function defaultEditKeys(raw: TechStackCms): StackEditKeys {
  return {
    name: 'stack_name',
    chatTabLabel: raw.chat_tab_label ? 'chat_tab_label' : 'system_prompt',
    searchTabLabel: raw.search_tab_label ? 'search_tab_label' : 'so_tagged',
    chatPlaceholder: raw.chat_placeholder
      ? 'chat_placeholder'
      : raw.google_site
        ? 'google_site'
        : 'google_site_restric',
    searchPlaceholder: raw.search_placeholder ? 'search_placeholder' : 'blog_filter_tags',
    ...SHARED_STACK_EDIT_KEYS,
  };
}

function expandTwoTabsFromRow(raw: TechStackCms): TechStack[] {
  const contentName = raw.stack_name?.trim();
  const sitecoreName = raw.stack_slug?.trim();
  if (!contentName || !sitecoreName) return [];

  return [
    mapCmsToStack(raw, 'content-stack', contentName, 'contentstack', CONTENT_STACK_EDIT_KEYS),
    mapCmsToStack(raw, 'sitecore-ai', sitecoreName, 'sitecore', SITECORE_EDIT_KEYS),
  ];
}

function normalizeStacks(data: AiAssistantData): TechStack[] {
  const raw = data.tech_stacks ?? data.tech_stack;
  if (!raw) return [];

  const list = Array.isArray(raw) ? raw : [raw];

  if (list.length === 1) {
    const expanded = expandTwoTabsFromRow(list[0]);
    if (expanded.length) return expanded;
  }

  return list
    .filter((item) => item.stack_name?.trim())
    .map((item, index) => {
      const name = item.stack_name!.trim();
      const slug = item.stack_slug?.trim() || name;
      return mapCmsToStack(item, slugify(slug) || `stack-${index}`, name, slug, defaultEditKeys(item));
    });
}

function loadStoredMessages(stackId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}:${stackId}`);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(stackId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}:${stackId}`, JSON.stringify(messages));
  } catch {
    /* storage full */
  }
}

export default function AiAssistant({ data }: AiAssistantProps) {
  const techStacks = useMemo(() => normalizeStacks(data), [data]);
  const [activeStackId, setActiveStackId] = useState('');
  const [activeMode, setActiveMode] = useState<AiAssistantMode>('chat');
  const [chatInput, setChatInput] = useState('');
  const [messagesByStack, setMessagesByStack] = useState<Record<string, ChatMessage[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!techStacks.length) {
      setActiveStackId('');
      return;
    }
    if (!techStacks.some((s) => s.id === activeStackId)) {
      setActiveStackId(techStacks[0].id);
    }
  }, [techStacks, activeStackId]);

  useEffect(() => {
    if (!activeStackId || hydratedRef.current) return;
    const stored: Record<string, ChatMessage[]> = {};
    techStacks.forEach((stack) => {
      const msgs = loadStoredMessages(stack.id);
      if (msgs.length) stored[stack.id] = msgs;
    });
    if (Object.keys(stored).length) {
      setMessagesByStack((prev) => ({ ...stored, ...prev }));
    }
    hydratedRef.current = true;
  }, [activeStackId, techStacks]);

  useEffect(() => {
    if (!activeStackId) return;
    const messages = messagesByStack[activeStackId];
    if (messages) saveStoredMessages(activeStackId, messages);
  }, [messagesByStack, activeStackId]);

  const currentStack = techStacks.find((s) => s.id === activeStackId);
  const messages = messagesByStack[activeStackId] ?? [];
  const chatEnabled = currentStack?.chat_enabled === true;
  const searchEnabled = currentStack?.search_enabled === true;

  useEffect(() => {
    if (!currentStack) return;
    if (!chatEnabled && activeMode === 'chat' && searchEnabled) setActiveMode('search');
    else if (!searchEnabled && activeMode === 'search' && chatEnabled) setActiveMode('chat');
  }, [activeStackId, chatEnabled, searchEnabled, activeMode, currentStack]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isChatLoading, activeStackId]);

  const sendChatMessage = useCallback(
    async (text: string, options?: { regenerate?: boolean }) => {
      if (!text || !currentStack || isChatLoading) return;

      const priorMessages = messagesByStack[activeStackId] ?? [];
      let history = priorMessages;
      let userMessage: ChatMessage | null = null;

      if (options?.regenerate) {
        const lastUserIdx = [...priorMessages].reverse().findIndex((m) => m.role === 'user');
        if (lastUserIdx === -1) return;
        const cutIdx = priorMessages.length - 1 - lastUserIdx;
        history = priorMessages.slice(0, cutIdx);
        text = priorMessages[cutIdx]?.content || text;
        setMessagesByStack((prev) => ({
          ...prev,
          [activeStackId]: history,
        }));
        setRegeneratingId('regen');
      } else {
        userMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          createdAt: Date.now(),
        };
        setMessagesByStack((prev) => ({
          ...prev,
          [activeStackId]: [...(prev[activeStackId] ?? []), userMessage!],
        }));
        setChatInput('');
      }

      setChatError('');
      setIsChatLoading(true);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: history.map((msg) => ({ role: msg.role, content: msg.content })),
            systemPrompt: currentStack.llm_prompt,
            stackName: currentStack.name,
            stackId: currentStack.id,
            blogTags: currentStack.blog_tags,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to get a response.');

        setMessagesByStack((prev) => ({
          ...prev,
          [activeStackId]: [
            ...(prev[activeStackId] ?? []),
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: result.reply,
              sources: result.sources,
              createdAt: Date.now(),
            },
          ],
        }));
      } catch (error) {
        setChatError(error instanceof Error ? error.message : 'Something went wrong.');
      } finally {
        setIsChatLoading(false);
        setRegeneratingId(null);
      }
    },
    [activeStackId, currentStack, isChatLoading, messagesByStack],
  );

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    await sendChatMessage(chatInput.trim());
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || !searchEnabled || !currentStack || isSearchLoading) return;

    setSearchError('');
    setSearchResults([]);
    setSearchSummary('');
    setIsSearchLoading(true);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          blogTags: currentStack.blog_tags,
          stackName: currentStack.name,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Search failed.');

      setSearchResults(result.results || []);
      setSearchSummary(result.summary || '');
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setIsSearchLoading(false);
    }
  }

  function clearChat() {
    setMessagesByStack((prev) => ({ ...prev, [activeStackId]: [] }));
    sessionStorage.removeItem(`${STORAGE_PREFIX}:${activeStackId}`);
    setChatError('');
  }

  function switchStack(id: string) {
    setActiveStackId(id);
    setSearchQuery('');
    setSearchResults([]);
    setSearchSummary('');
    setChatError('');
    setSearchError('');
    setActiveMode('chat');
  }

  function handleRegenerate() {
    sendChatMessage('', { regenerate: true });
  }

  if (!techStacks.length) {
    return null;
  }

  const pageTitle = data.main_heading || data.hero_title || data.title;
  const pageSubheading =
    data.text_subheading || currentStack?.text_subheading || data.hero_description;
  const welcomeHeading =
    data.main_heading || currentStack?.main_heading || currentStack?.chat_tab_label;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;

  return (
    <section className='ai-assistant'>
      <div className='max-width ai-assistant__container'>
        {pageTitle && (
          <header className='ai-assistant__hero'>
            <h1
              className='ai-assistant__title'
              {...((data.$?.main_heading || data.$?.hero_title) as {})}
            >
              {pageTitle}
            </h1>
            {pageSubheading && (
              <div
                className='ai-assistant__description'
                {...((data.$?.text_subheading || data.$?.hero_description) as {})}
              >
                {typeof pageSubheading === 'string' ? parse(pageSubheading) : pageSubheading}
              </div>
            )}
          </header>
        )}

        <div className='ai-assistant__platform-tabs' role='tablist' aria-label='Platforms'>
          {techStacks.map((stack) => (
            <button
              key={stack.id}
              type='button'
              role='tab'
              aria-selected={activeStackId === stack.id}
              className={`ai-assistant__platform-tab${activeStackId === stack.id ? ' is-active' : ''}`}
              onClick={() => switchStack(stack.id)}
            >
              <StackIcon stackKey={resolveStackIconKey(stack.name, stack.slug)} />
              <span {...(getEditTag(stack, 'name') as {})}>{stack.name}</span>
            </button>
          ))}
        </div>

        {currentStack && (
          <div className='ai-assistant__workspace' key={activeStackId}>
            <div className='ai-assistant__mode-switch' role='tablist'>
              {chatEnabled && currentStack.chat_tab_label && (
                <button
                  type='button'
                  role='tab'
                  aria-selected={activeMode === 'chat'}
                  className={`ai-assistant__mode-btn${activeMode === 'chat' ? ' is-active' : ''}`}
                  onClick={() => setActiveMode('chat')}
                >
                  <i className='fa-regular fa-comment-dots' aria-hidden />
                  <span {...(getEditTag(currentStack, 'chatTabLabel') as {})}>
                    {currentStack.chat_tab_label}
                  </span>
                </button>
              )}
              {searchEnabled && currentStack.search_tab_label && (
                <button
                  type='button'
                  role='tab'
                  aria-selected={activeMode === 'search'}
                  className={`ai-assistant__mode-btn${activeMode === 'search' ? ' is-active' : ''}`}
                  onClick={() => setActiveMode('search')}
                >
                  <i className='fa-solid fa-magnifying-glass' aria-hidden />
                  <span {...(getEditTag(currentStack, 'searchTabLabel') as {})}>
                    {currentStack.search_tab_label}
                  </span>
                </button>
              )}
            </div>

            {activeMode === 'chat' && chatEnabled && (
              <div className='ai-assistant__chat-panel ai-assistant__panel-enter' role='tabpanel' key='chat'>
                <div className='ai-assistant__chat-toolbar'>
                  {messages.length > 0 && currentStack.clear_chat_cta && (
                    <button type='button' className='ai-assistant__toolbar-btn' onClick={clearChat}>
                      <i className='fa-solid fa-trash-can' aria-hidden />
                      <span {...(getEditTag(currentStack, 'clearChatCta') as {})}>
                        {currentStack.clear_chat_cta}
                      </span>
                    </button>
                  )}
                  {messages.length > 0 && (
                    <span className='ai-assistant__msg-count'>
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className='ai-assistant__chat-body' ref={chatBodyRef}>
                  {messages.length === 0 && !isChatLoading ? (
                    <div className='ai-assistant__chat-welcome'>
                      <div className='ai-assistant__avatar'>
                        <StackIcon stackKey={resolveStackIconKey(currentStack.name, currentStack.slug)} />
                      </div>
                      {welcomeHeading && (
                        <h2
                          {...((data.$?.main_heading ||
                            currentStack.$?.main_heading ||
                            getEditTag(currentStack, 'chatTabLabel')) as {})}
                        >
                          {welcomeHeading}
                        </h2>
                      )}
                      {pageSubheading && typeof pageSubheading === 'string' && (
                        <p
                          className='ai-assistant__welcome-hint'
                          {...((data.$?.text_subheading || currentStack.$?.text_subheading) as {})}
                        >
                          {pageSubheading}
                        </p>
                      )}
                      <SuggestedPrompts
                        suggestions={currentStack.suggested_prompts}
                        editTags={currentStack.$}
                        disabled={isChatLoading}
                        onSelect={(prompt) => sendChatMessage(prompt)}
                      />
                    </div>
                  ) : (
                    <div className='ai-assistant__messages'>
                      {messages.map((msg) => (
                        <ChatMessageBubble
                          key={msg.id}
                          message={msg}
                          onRegenerate={
                            msg.id === lastAssistantId && !isChatLoading
                              ? handleRegenerate
                              : undefined
                          }
                          isRegenerating={regeneratingId !== null && msg.id === lastAssistantId}
                        />
                      ))}
                      {isChatLoading && (
                        <div className='ai-assistant__message-wrap ai-assistant__message-wrap--assistant ai-assistant__typing-wrap'>
                        <div className='ai-assistant__bubble ai-assistant__bubble--assistant ai-assistant__bubble--typing'>
                          <span className='ai-assistant__typing-dot' />
                          <span className='ai-assistant__typing-dot' />
                          <span className='ai-assistant__typing-dot' />
                        </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {chatError && (
                  <p className='ai-assistant__chat-error' role='alert'>
                    {chatError}
                  </p>
                )}

                <form
                  className={`ai-assistant__composer${isChatLoading ? ' is-sending' : ''}`}
                  onSubmit={handleSendChat}
                >
                  {currentStack.chat_placeholder && (
                    <input
                      type='text'
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={currentStack.chat_placeholder}
                      className='ai-assistant__composer-input'
                      disabled={isChatLoading}
                      {...(getEditTag(currentStack, 'chatPlaceholder') as {})}
                    />
                  )}
                  <button
                    type='submit'
                    className='ai-assistant__composer-send'
                    disabled={isChatLoading || !chatInput.trim()}
                  >
                    <i className='fa-solid fa-paper-plane' aria-hidden />
                    {currentStack.send_button_text && (
                      <span {...(getEditTag(currentStack, 'sendButtonText') as {})}>
                        {currentStack.send_button_text}
                      </span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeMode === 'search' && searchEnabled && (
              <div className='ai-assistant__search-panel ai-assistant__panel-enter' role='tabpanel' key='search'>
                {currentStack.search_tab_label && (
                  <div className='ai-assistant__search-hero'>
                    <h2 {...(getEditTag(currentStack, 'searchTabLabel') as {})}>
                      {currentStack.search_tab_label}
                    </h2>
                    {currentStack.search_hint && (
                      <p {...(getEditTag(currentStack, 'searchHint') as {})}>
                        {currentStack.search_hint}
                      </p>
                    )}
                  </div>
                )}

                <form className='ai-assistant__search-bar' onSubmit={handleSearch}>
                  <i className='fa-solid fa-magnifying-glass' aria-hidden />
                  {currentStack.search_placeholder && (
                    <input
                      type='search'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={currentStack.search_placeholder}
                      disabled={isSearchLoading}
                      {...(getEditTag(currentStack, 'searchPlaceholder') as {})}
                    />
                  )}
                  <button
                    type='submit'
                    className='ai-assistant__search-submit'
                    disabled={isSearchLoading || !searchQuery.trim()}
                  >
                    {(() => {
                      const label = isSearchLoading
                        ? currentStack.searching_button_text || currentStack.search_button_text
                        : currentStack.search_button_text;
                      if (!label) return null;
                      return (
                        <span
                          {...(getEditTag(
                            currentStack,
                            isSearchLoading && currentStack.searching_button_text
                              ? 'searchingButtonText'
                              : 'searchButtonText',
                          ) as {})}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </button>
                </form>

                {searchError && (
                  <p className='ai-assistant__chat-error' role='alert'>
                    {searchError}
                  </p>
                )}

                {searchSummary && (
                  <div className='ai-assistant__search-summary ai-assistant__fade-rise'>
                    <i className='fa-solid fa-wand-magic-sparkles' aria-hidden />
                    <p>{searchSummary}</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <ul className='ai-assistant__search-results'>
                    {searchResults.map((item, index) => (
                      <li
                        key={item.uid}
                        className='ai-assistant__search-card ai-assistant__fade-rise'
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        <Link href={item.url} className='ai-assistant__search-card-title'>
                          {item.title}
                        </Link>
                        <p>{item.excerpt}…</p>
                        {currentStack.read_article_text && (
                          <Link href={item.url} className='ai-assistant__search-card-link'>
                            <span {...(getEditTag(currentStack, 'readArticleText') as {})}>
                              {currentStack.read_article_text}
                            </span>{' '}
                            <i className='fa-solid fa-arrow-right' aria-hidden />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {!isSearchLoading && !searchResults.length && !searchSummary && (
                  <SuggestedPrompts
                    suggestions={currentStack.suggested_prompts}
                    editTags={currentStack.$}
                    disabled={isSearchLoading}
                    onSelect={(prompt) => setSearchQuery(prompt)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
