'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import parse from 'html-react-parser';
import ChatPanel from '@/components/ai-assistant/chat-panel';
import { normalizeStacks } from '@/components/ai-assistant/normalize-stacks';
import SearchPanel from '@/components/ai-assistant/search-panel';
import { resolveStackIconKey, StackIcon } from '@/components/ai-assistant/stack-icons';
import {
  AiAssistantData,
  AiAssistantMode,
  ChatMessage,
  SearchResultItem,
} from '@/typescript/ai-assistant';

type AiAssistantProps = {
  data: AiAssistantData;
};

const STORAGE_KEY = 'ai-assistant-messages';

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
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const stack = stacks.find((s) => s.id === activeStackId);
  const messages = messagesByStack[activeStackId] ?? [];

  // Load saved chat from browser session (once)
  useEffect(() => {
    const saved: Record<string, ChatMessage[]> = {};
    stacks.forEach((s) => {
      try {
        const raw = sessionStorage.getItem(`${STORAGE_KEY}:${s.id}`);
        if (raw) saved[s.id] = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    });
    if (Object.keys(saved).length) setMessagesByStack(saved);
  }, [stacks]);

  // Save chat when messages change
  useEffect(() => {
    if (!activeStackId || !messagesByStack[activeStackId]) return;
    sessionStorage.setItem(
      `${STORAGE_KEY}:${activeStackId}`,
      JSON.stringify(messagesByStack[activeStackId]),
    );
  }, [messagesByStack, activeStackId]);

  // Auto-scroll on new messages
  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, chatLoading]);

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
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            createdAt: Date.now(),
          },
        ],
      }));
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setChatLoading(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query || searchLoading) return;
    if (!stack) return; // This should never happen, but just in case
    setSearchError('');
    setSearchResults([]);
    setSearchSummary('');
    setSearchLoading(true);

    try {
      const res = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          blogTags: stack?.blog_tags,
          stackName: stack?.name,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Search failed.');

      setSearchResults(result.results || []);
      setSearchSummary(result.summary || '');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setSearchLoading(false);
    }
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
    sessionStorage.removeItem(`${STORAGE_KEY}:${activeStackId}`);
    setChatError('');
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

        {/* Platform tabs: Content Stack | Sitecore */}
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
          {/* Chat | Search mode switch */}
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
              chatBodyRef={chatBodyRef}
              onInputChange={setChatInput}
              onSend={(e) => {
                e.preventDefault();
                sendMessage(chatInput);
              }}
              onClear={clearChat}
              onPromptSelect={sendMessage}
              onRegenerate={() => sendMessage('', true)}
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
              onQueryChange={setSearchQuery}
              onSearch={runSearch}
              onPromptSelect={setSearchQuery}
            />
          )}
        </div>
      </div>
    </section>
  );
}
