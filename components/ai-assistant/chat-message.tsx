'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChatMessage as ChatMessageType, ChatSource } from '@/typescript/ai-assistant';
import { formatMessageTime, loadMessageFeedback, saveMessageFeedback } from '@/components/ai-assistant/utils';

type ChatMessageProps = {
  message: ChatMessageType;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onFeedback?: (messageId: string, feedback: 'up' | 'down' | null) => void;
  onAskAboutSource?: (title: string) => void;
};

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={key++} className='ai-assistant__inline-code'>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <Link key={key++} href={linkMatch[2]} className='ai-assistant__inline-link'>
            {linkMatch[1]}
          </Link>,
        );
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length ? parts : [text];
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let codeLines: string[] = [];
  let inCodeBlock = false;
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    const ListTag = listOrdered ? 'ol' : 'ul';
    nodes.push(
      React.createElement(
        ListTag,
        { key: key++, className: 'ai-assistant__md-list' },
        listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>),
      ),
    );
    listItems = [];
    listOrdered = false;
  }

  function flushCodeBlock() {
    if (!codeLines.length) return;
    nodes.push(
      <pre key={key++} className='ai-assistant__code-block'>
        <code>{codeLines.join('\n')}</code>
      </pre>,
    );
    codeLines = [];
    inCodeBlock = false;
  }

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      nodes.push(
        <h4 key={key++} className='ai-assistant__md-h4'>
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(
        <h3 key={key++} className='ai-assistant__md-h3'>
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      listOrdered = true;
      listItems.push(orderedMatch[1]);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();
    nodes.push(
      <p key={key++} className='ai-assistant__md-p'>
        {renderInline(trimmed)}
      </p>,
    );
  }

  flushList();
  flushCodeBlock();
  return nodes;
}

export default function ChatMessageBubble({
  message,
  onRegenerate,
  isRegenerating,
  onFeedback,
  onAskAboutSource,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(message.feedback ?? null);

  useEffect(() => {
    const saved = loadMessageFeedback(message.id);
    if (saved) setFeedback(saved);
  }, [message.id]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function handleFeedback(next: 'up' | 'down') {
    const value = feedback === next ? null : next;
    setFeedback(value);
    saveMessageFeedback(message.id, value);
    onFeedback?.(message.id, value);
  }

  return (
    <div
      className={`ai-assistant__message-wrap ai-assistant__message-wrap--${message.role}${
        isRegenerating ? ' is-regenerating' : ''
      }`}
    >
      <div className={`ai-assistant__bubble ai-assistant__bubble--${message.role}`}>
        {message.createdAt && (
          <time className='ai-assistant__msg-time' dateTime={new Date(message.createdAt).toISOString()}>
            {formatMessageTime(message.createdAt)}
          </time>
        )}
        {message.role === 'assistant' ? (
          <div className='ai-assistant__md'>{renderMarkdown(message.content)}</div>
        ) : (
          message.content
        )}

        {message.sources && message.sources.length > 0 && (
          <div className='ai-assistant__sources'>
            <span className='ai-assistant__sources-label'>
              <i className='fa-solid fa-book-open' aria-hidden /> From your site
            </span>
            <ul>
              {message.sources.map((source: ChatSource) => (
                <li key={source.uid}>
                  <Link href={source.url}>{source.title}</Link>
                  {onAskAboutSource && (
                    <button
                      type='button'
                      className='ai-assistant__source-ask'
                      onClick={() => onAskAboutSource(source.title)}
                      title={`Ask about ${source.title}`}
                    >
                      <i className='fa-solid fa-comment-dots' aria-hidden />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {message.role === 'assistant' && (
        <div className='ai-assistant__message-actions'>
          <button type='button' onClick={handleCopy} className='ai-assistant__msg-action'>
            <i className={`fa-${copied ? 'solid fa-check' : 'regular fa-copy'}`} aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </button>
          {onRegenerate && (
            <button
              type='button'
              onClick={onRegenerate}
              disabled={isRegenerating}
              className='ai-assistant__msg-action'
            >
              <i className='fa-solid fa-rotate-right' aria-hidden />
              {isRegenerating ? 'Regenerating…' : 'Regenerate'}
            </button>
          )}
          <button
            type='button'
            onClick={() => handleFeedback('up')}
            className={`ai-assistant__msg-action ai-assistant__msg-action--feedback${feedback === 'up' ? ' is-active' : ''}`}
            aria-pressed={feedback === 'up'}
            aria-label='Helpful response'
          >
            <i className={`fa-${feedback === 'up' ? 'solid' : 'regular'} fa-thumbs-up`} aria-hidden />
          </button>
          <button
            type='button'
            onClick={() => handleFeedback('down')}
            className={`ai-assistant__msg-action ai-assistant__msg-action--feedback${feedback === 'down' ? ' is-active' : ''}`}
            aria-pressed={feedback === 'down'}
            aria-label='Not helpful'
          >
            <i className={`fa-${feedback === 'down' ? 'solid' : 'regular'} fa-thumbs-down`} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
