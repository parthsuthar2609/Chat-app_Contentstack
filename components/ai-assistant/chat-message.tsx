'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChatMessage as ChatMessageType, ChatSource } from '@/typescript/ai-assistant';

type ChatMessageProps = {
  message: ChatMessageType;
  stackName?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
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
  let key = 0;

  function flushList() {
    if (!listItems.length) return;
    nodes.push(
      <ul key={key++} className='ai-assistant__md-list'>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
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

  return nodes;
}

export default function ChatMessageBubble({
  message,
  onRegenerate,
  isRegenerating,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div
      className={`ai-assistant__message-wrap ai-assistant__message-wrap--${message.role}`}
    >
      <div className={`ai-assistant__bubble ai-assistant__bubble--${message.role}`}>
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
        </div>
      )}
    </div>
  );
}
