'use client';

import React, { useState } from 'react';
import ChatMessageBubble from '@/components/ai-assistant/chat-message';
import SuggestedPrompts from '@/components/ai-assistant/suggested-prompts';
import { resolveStackIconKey, StackIcon } from '@/components/ai-assistant/stack-icons';
import { exportChatToPdf } from '@/components/ai-assistant/utils';
import { ChatMessage, TechStack } from '@/typescript/ai-assistant';

type ChatPanelProps = {
  stack: TechStack;
  welcomeHeading?: string;
  welcomeText?: string;
  welcomeHeadingTag?: Record<string, string>;
  welcomeTextTag?: Record<string, string>;
  messages: ChatMessage[];
  chatInput: string;
  chatError: string;
  isLoading: boolean;
  showScrollBtn: boolean;
  chatBodyRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onScrollToBottom: () => void;
  onStop: () => void;
  onInputChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  onClear: () => void;
  onPromptSelect: (prompt: string) => void;
  onRegenerate: () => void;
};

export default function ChatPanel({
  stack,
  welcomeHeading,
  welcomeText,
  welcomeHeadingTag,
  welcomeTextTag,
  messages,
  chatInput,
  chatError,
  isLoading,
  showScrollBtn,
  chatBodyRef,
  onScroll,
  onScrollToBottom,
  onStop,
  onInputChange,
  onSend,
  onClear,
  onPromptSelect,
  onRegenerate,
}: ChatPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;
  const showWelcome = messages.length === 0 && !isLoading;

  async function handleExportChat() {
    if (!messages.length || exporting) return;
    setExporting(true);
    try {
      const safeName = stack.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await exportChatToPdf(messages, {
        assistantName: stack.name,
        title: `${stack.name} — AI Chat`,
        filename: `${safeName || 'ai-assistant'}-chat.pdf`,
      });
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch {
      /* PDF export failed */
    } finally {
      setExporting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim() && !isLoading) onSend(e);
    }
  }

  return (
    <div className='ai-assistant__chat-panel ai-assistant__panel-enter' role='tabpanel'>
      {messages.length > 0 && (
        <div className='ai-assistant__chat-toolbar'>
          <div className='ai-assistant__toolbar-actions'>
            {stack.clear_chat_cta && (
              <button type='button' className='ai-assistant__toolbar-btn' onClick={onClear}>
                <i className='fa-solid fa-trash-can' aria-hidden />
                <span {...(stack.editTags.clearChatCta as {})}>{stack.clear_chat_cta}</span>
              </button>
            )}
            <button
              type='button'
              className='ai-assistant__toolbar-btn'
              onClick={handleExportChat}
              disabled={exporting}
            >
              <i
                className={`fa-${exported ? 'solid fa-check' : exporting ? 'solid fa-spinner fa-spin' : 'solid fa-file-pdf'}`}
                aria-hidden
              />
              {exported ? 'Downloaded' : exporting ? 'Creating PDF…' : 'Export PDF'}
            </button>
          </div>
          <span className='ai-assistant__msg-count'>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className='ai-assistant__chat-body-wrap'>
        <div className='ai-assistant__chat-body' ref={chatBodyRef} onScroll={onScroll}>
          {showWelcome ? (
            <div className='ai-assistant__chat-welcome'>
              <div className='ai-assistant__avatar'>
                <StackIcon stackKey={resolveStackIconKey(stack.name, stack.slug)} />
              </div>
              {welcomeHeading && <h2 {...(welcomeHeadingTag as {})}>{welcomeHeading}</h2>}
              {welcomeText && (
                <p className='ai-assistant__welcome-hint' {...(welcomeTextTag as {})}>
                  {welcomeText}
                </p>
              )}
              <SuggestedPrompts
                suggestions={stack.suggested_prompts}
                editTags={stack.$}
                disabled={isLoading}
                onSelect={onPromptSelect}
              />
            </div>
          ) : (
            <div className='ai-assistant__messages'>
              {messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  onRegenerate={
                    msg.id === lastAssistantId && !isLoading ? onRegenerate : undefined
                  }
                  isRegenerating={isLoading && msg.id === lastAssistantId}
                />
              ))}
              {isLoading && (
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

        {showScrollBtn && (
          <button
            type='button'
            className='ai-assistant__scroll-btn'
            onClick={onScrollToBottom}
            aria-label='Scroll to latest message'
          >
            <i className='fa-solid fa-arrow-down' aria-hidden />
          </button>
        )}
      </div>

      {chatError && (
        <p className='ai-assistant__chat-error' role='alert'>
          {chatError}
        </p>
      )}

      <form
        className={`ai-assistant__composer${isLoading ? ' is-sending' : ''}`}
        onSubmit={onSend}
      >
        {stack.chat_placeholder && (
          <textarea
            value={chatInput}
            onChange={(e) => {
              onInputChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={stack.chat_placeholder}
            className='ai-assistant__composer-input ai-assistant__composer-textarea'
            disabled={isLoading}
            rows={1}
            {...(stack.editTags.chatPlaceholder as {})}
          />
        )}
        <div className='ai-assistant__composer-actions'>
          <span className='ai-assistant__composer-hint'>Enter to send · Shift+Enter for new line</span>
          {isLoading ? (
            <button type='button' className='ai-assistant__composer-stop' onClick={onStop}>
              <i className='fa-solid fa-stop' aria-hidden /> Stop
            </button>
          ) : (
            <button
              type='submit'
              className='ai-assistant__composer-send'
              disabled={!chatInput.trim()}
            >
              <i className='fa-solid fa-paper-plane' aria-hidden />
              {stack.send_button_text && (
                <span {...(stack.editTags.sendButtonText as {})}>{stack.send_button_text}</span>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
