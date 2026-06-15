'use client';

import React from 'react';
import Link from 'next/link';
import SuggestedPrompts from '@/components/ai-assistant/suggested-prompts';
import { SearchResultItem, TechStack } from '@/typescript/ai-assistant';

type SearchPanelProps = {
  stack: TechStack;
  searchQuery: string;
  searchResults: SearchResultItem[];
  searchSummary: string;
  searchError: string;
  isLoading: boolean;
  searchHistory: string[];
  onQueryChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onPromptSelect: (prompt: string) => void;
  onHistorySelect: (query: string) => void;
};

export default function SearchPanel({
  stack,
  searchQuery,
  searchResults,
  searchSummary,
  searchError,
  isLoading,
  searchHistory,
  onQueryChange,
  onSearch,
  onPromptSelect,
  onHistorySelect,
}: SearchPanelProps) {
  const searchButtonLabel = isLoading
    ? stack.searching_button_text || stack.search_button_text
    : stack.search_button_text;

  return (
    <div className='ai-assistant__search-panel ai-assistant__panel-enter' role='tabpanel'>
      {stack.search_tab_label && (
        <div className='ai-assistant__search-hero'>
          <h2 {...(stack.editTags.searchTabLabel as {})}>{stack.search_tab_label}</h2>
          {stack.search_hint && (
            <p {...(stack.editTags.searchHint as {})}>{stack.search_hint}</p>
          )}
        </div>
      )}

      <form className='ai-assistant__search-bar' onSubmit={onSearch}>
        <i className='fa-solid fa-magnifying-glass' aria-hidden />
        {stack.search_placeholder && (
          <input
            type='search'
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={stack.search_placeholder}
            disabled={isLoading}
            {...(stack.editTags.searchPlaceholder as {})}
          />
        )}
        <button
          type='submit'
          className='ai-assistant__search-submit'
          disabled={isLoading || !searchQuery.trim()}
        >
          {searchButtonLabel && (
            <span
              {...((isLoading && stack.searching_button_text
                ? stack.editTags.searchingButtonText
                : stack.editTags.searchButtonText) as {})}
            >
              {searchButtonLabel}
            </span>
          )}
        </button>
      </form>

      {isLoading && (
        <div className='ai-assistant__search-loading' aria-live='polite'>
          <span className='ai-assistant__typing-dot' />
          <span className='ai-assistant__typing-dot' />
          <span className='ai-assistant__typing-dot' />
          <span>Searching blogs…</span>
        </div>
      )}

      {!isLoading && searchHistory.length > 0 && !searchResults.length && !searchSummary && (
        <div className='ai-assistant__search-history'>
          <p className='ai-assistant__search-history-label'>Recent searches</p>
          <div className='ai-assistant__search-history-chips'>
            {searchHistory.map((item) => (
              <button
                key={item}
                type='button'
                className='ai-assistant__search-history-chip'
                onClick={() => onHistorySelect(item)}
              >
                <i className='fa-solid fa-clock-rotate-left' aria-hidden />
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

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
              {stack.read_article_text && (
                <Link href={item.url} className='ai-assistant__search-card-link'>
                  <span {...(stack.editTags.readArticleText as {})}>
                    {stack.read_article_text}
                  </span>{' '}
                  <i className='fa-solid fa-arrow-right' aria-hidden />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isLoading && !searchResults.length && !searchSummary && (
        <SuggestedPrompts
          suggestions={stack.suggested_prompts}
          editTags={stack.$}
          disabled={isLoading}
          onSelect={onPromptSelect}
        />
      )}
    </div>
  );
}
