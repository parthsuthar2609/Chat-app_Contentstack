'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import parse from 'html-react-parser';
import ChatPanel from '@/components/ai-assistant/chat-panel';
import { buildFollowUpPrompts } from '@/components/ai-assistant/follow-ups';
import { normalizeStacks } from '@/components/ai-assistant/normalize-stacks';
import SearchPanel from '@/components/ai-assistant/search-panel';
import { resolveStackIconKey, StackIcon } from '@/components/ai-assistant/stack-icons';
import {
  AiAssistantData,
  AiAssistantMode,
  ChatMessage,
  SearchResultItem,
} from '@/typescript/ai-assistant';
import {
  clearChatHistory,
  clearSearchHistory,
  loadChatHistory,
  loadSearchHistory,
  saveChatHistory,
  saveSearchHistory,
} from '@/components/ai-assistant/utils';

type AiAssistantProps = {
  data: AiAssistantData;
};

export default function AiAssistant({ data }: AiAssistantProps) {
  const stacks = useMemo(() => normalizeStacks(data), [data]);

  const [activeStackId, setActiveStackId] = useState(stacks[0]?.id ?? '');
  const [mode, setMode] = useState<AiAssistantMode>('chat');
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [messagesByStack, setMessagesByStack] = useState<Record<string, ChatMessage[]>>({});
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [lastFailedMessage, setLastFailedMessage] = useState('');
  const [lastFailedSearch, setLastFailedSearch] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stack = stacks.find((s) => s.id === activeStackId);
  const messages = messagesByStack[activeStackId] ?? [];
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const followUpPrompts = useMemo(
    () => (chatLoading ? [] : buildFollowUpPrompts(lastAssistant)),
    [lastAssistant, chatLoading],
  );

  useEffect(() => {
    const saved: Record<string, ChatMessage[]> = {};
    stacks.forEach((s) => {
      const msgs = loadChatHistory(s.id);
      if (msgs.length) saved[s.id] = msgs;
    });
    if (Object.keys(saved).length) setMessagesByStack(saved);
  }, [stacks]);

  useEffect(() => {
    if (!activeStackId) return;
    const msgs = messagesByStack[activeStackId];
    if (msgs?.length) saveChatHistory(activeStackId, msgs);
  }, [messagesByStack, activeStackId]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

  useEffect(() => {
    if (activeStackId) setSearchHistory(loadSearchHistory(activeStackId));
  }, [activeStackId]);

  if (!stacks.length || !stack) return null;

  const pageTitle = data.main_heading || data.hero_title || data.title;
  const pageSubheading = data.text_subheading || stack.text_subheading || data.hero_description;
  const welcomeHeading = data.main_heading || stack.main_heading || stack.chat_tab_label;
  const titleTag = (data.$?.main_heading || data.$?.hero_title) as Record<string, string>;
  const subTag = (data.$?.text_subheading || data.$?.hero_description) as Record<string, string>;

  async function sendMessage(text: string, regenerate = false) {
    if (!stack || (!text.trim() && !regenerate) || chatLoading) return;

    let history = messages;
    let messageText = text.trim();

    if (regenerate) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (!lastUser) return;
      history = messages.slice(0, messages.indexOf(lastUser) + 1);
      messageText = lastUser.content;
      setMessagesByStack((prev) => ({ ...prev, [activeStackId]: history }));
    } else {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: messageText,
        createdAt: Date.now(),
      };
      setMessagesByStack((prev) => ({
        ...prev,
        [activeStackId]: [...(prev[activeStackId] ?? []), userMsg],
      }));
      setChatInput('');
    }

    setChatError('');
    setLastFailedMessage(messageText);
    setChatLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: messageText,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt: stack?.llm_prompt,
          stackName: stack?.name,
          stackId: stack?.id,
          blogTags: stack?.blog_tags,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to get a response.');

      setMessagesByStack((prev) => ({
        ...prev,
        [activeStackId]: [
          ...(prev[activeStackId] ?? []),
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: result.reply,
            sources: result.sources,
            suggestedArticles: result.suggestedArticles,
            createdAt: Date.now(),
          },
        ],
      }));
      setLastFailedMessage('');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setChatError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setChatLoading(false);
      abortRef.current = null;
    }
  }

  function stopGenerating() {
    abortRef.current?.abort();
    setChatLoading(false);
  }

  function scrollToBottom() {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
    setShowScrollBtn(false);
  }

  function handleChatScroll() {
    const el = chatBodyRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!nearBottom && messages.length > 0);
  }

  async function runSearch(queryOverride?: string) {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query || searchLoading || !stack) return;

    if (queryOverride) setSearchQuery(queryOverride);

    setSearchError('');
    setSearchResults([]);
    setSearchSummary('');
    setSearchLoading(true);
    setLastFailedSearch(query);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          blogTags: stack.blog_tags,
          stackName: stack.name,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Search failed.');

      setSearchResults(result.results || []);
      setSearchSummary(result.summary || '');
      setSearchHistory(saveSearchHistory(activeStackId, query));
      setLastFailedSearch('');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function handleHistorySelect(query: string) {
    setSearchQuery(query);
    runSearch(query);
  }

  function handleSearchPrompt(prompt: string) {
    setSearchQuery(prompt);
    runSearch(prompt);
  }

  function handleAskAboutSource(title: string) {
    const prompt = `Tell me more about "${title}"`;
    setChatInput(prompt);
    sendMessage(prompt);
  }

  function switchStack(id: string) {
    setActiveStackId(id);
    setMode('chat');
    setSearchQuery('');
    setSearchResults([]);
    setSearchSummary('');
    setChatError('');
    setSearchError('');
  }

  function clearChat() {
    setMessagesByStack((prev) => ({ ...prev, [activeStackId]: [] }));
    clearChatHistory(activeStackId);
    setChatError('');
  }

  function handleClearSearchHistory() {
    clearSearchHistory(activeStackId);
    setSearchHistory([]);
  }

  function retryChat() {
    if (!lastFailedMessage) return;
    const history = messagesByStack[activeStackId] ?? [];
    const last = history[history.length - 1];
    if (last?.role === 'user' && last.content === lastFailedMessage) {
      setMessagesByStack((prev) => ({
        ...prev,
        [activeStackId]: history.slice(0, -1),
      }));
    }
    sendMessage(lastFailedMessage);
  }

  function retrySearch() {
    if (lastFailedSearch) runSearch(lastFailedSearch);
  }

  return (
    <section className='ai-assistant'>
      <div className='max-width ai-assistant__container'>
        {(pageTitle || pageSubheading) && (
          <header className='ai-assistant__hero'>
            {pageTitle && <h1 className='ai-assistant__title' {...titleTag}>{pageTitle}</h1>}
            {pageSubheading && (
              <div className='ai-assistant__description' {...subTag}>
                {typeof pageSubheading === 'string' ? parse(pageSubheading) : pageSubheading}
              </div>
            )}
          </header>
        )}

        <div className='ai-assistant__platform-tabs' role='tablist'>
          {stacks.map((tab) => (
            <button
              key={tab.id}
              type='button'
              role='tab'
              aria-selected={activeStackId === tab.id}
              className={`ai-assistant__platform-tab${activeStackId === tab.id ? ' is-active' : ''}`}
              onClick={() => switchStack(tab.id)}
            >
              <StackIcon stackKey={resolveStackIconKey(tab.name, tab.slug)} />
              <span {...(tab.editTags.name as {})}>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className='ai-assistant__workspace' key={activeStackId}>
          <div className='ai-assistant__mode-switch' role='tablist'>
            {stack.chat_enabled && stack.chat_tab_label && (
              <button
                type='button'
                className={`ai-assistant__mode-btn${mode === 'chat' ? ' is-active' : ''}`}
                onClick={() => setMode('chat')}
              >
                <i className='fa-regular fa-comment-dots' aria-hidden />
                <span {...(stack.editTags.chatTabLabel as {})}>{stack.chat_tab_label}</span>
              </button>
            )}
            {stack.search_enabled && stack.search_tab_label && (
              <button
                type='button'
                className={`ai-assistant__mode-btn${mode === 'search' ? ' is-active' : ''}`}
                onClick={() => setMode('search')}
              >
                <i className='fa-solid fa-magnifying-glass' aria-hidden />
                <span {...(stack.editTags.searchTabLabel as {})}>{stack.search_tab_label}</span>
              </button>
            )}
          </div>

          {mode === 'chat' && stack.chat_enabled && (
            <ChatPanel
              stack={stack}
              welcomeHeading={welcomeHeading}
              welcomeText={typeof pageSubheading === 'string' ? pageSubheading : undefined}
              welcomeHeadingTag={
                (data.$?.main_heading || stack.$?.main_heading || stack.editTags.chatTabLabel) as Record<string, string>
              }
              welcomeTextTag={(data.$?.text_subheading || stack.$?.text_subheading) as Record<string, string>}
              messages={messages}
              chatInput={chatInput}
              chatError={chatError}
              isLoading={chatLoading}
              showScrollBtn={showScrollBtn}
              followUpPrompts={followUpPrompts}
              chatBodyRef={chatBodyRef}
              onScroll={handleChatScroll}
              onScrollToBottom={scrollToBottom}
              onStop={stopGenerating}
              onInputChange={setChatInput}
              onSend={(e) => {
                e.preventDefault();
                sendMessage(chatInput);
              }}
              onClear={clearChat}
              onPromptSelect={sendMessage}
              onRegenerate={() => sendMessage('', true)}
              onRetry={retryChat}
              onAskAboutSource={handleAskAboutSource}
            />
          )}

          {mode === 'search' && stack.search_enabled && (
            <SearchPanel
              stack={stack}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searchSummary={searchSummary}
              searchError={searchError}
              isLoading={searchLoading}
              searchHistory={searchHistory}
              onQueryChange={setSearchQuery}
              onSearch={handleSearchSubmit}
              onPromptSelect={handleSearchPrompt}
              onHistorySelect={handleHistorySelect}
              onClearHistory={handleClearSearchHistory}
              onRetry={retrySearch}
            />
          )}
        </div>
      </div>
    </section>
  );
}
