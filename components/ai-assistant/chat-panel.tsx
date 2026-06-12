'use client';

import React from 'react';
import ChatMessageBubble from '@/components/ai-assistant/chat-message';
import SuggestedPrompts from '@/components/ai-assistant/suggested-prompts';
import { resolveStackIconKey, StackIcon } from '@/components/ai-assistant/stack-icons';
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
  chatBodyRef: React.RefObject<HTMLDivElement | null>;
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
  chatBodyRef,
  onInputChange,
  onSend,
  onClear,
  onPromptSelect,
  onRegenerate,
}: ChatPanelProps) {
  const lastAssistantId = [...messages].reverse().find((m) => m.role === 'assistant')?.id;
  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className='ai-assistant__chat-panel ai-assistant__panel-enter' role='tabpanel'>
      {messages.length > 0 && stack.clear_chat_cta && (
        <div className='ai-assistant__chat-toolbar'>
          <button type='button' className='ai-assistant__toolbar-btn' onClick={onClear}>
            <i className='fa-solid fa-trash-can' aria-hidden />
            <span {...(stack.editTags.clearChatCta as {})}>{stack.clear_chat_cta}</span>
          </button>
        </div>
      )}

      <div className='ai-assistant__chat-body' ref={chatBodyRef}>
        {showWelcome ? (
          <div className='ai-assistant__chat-welcome'>
            <div className='ai-assistant__avatar'>
              <StackIcon stackKey={resolveStackIconKey(stack.name, stack.slug)} />
            </div>
            {welcomeHeading && (
              <h2 {...(welcomeHeadingTag as {})}>{welcomeHeading}</h2>
            )}
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
          <input
            type='text'
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={stack.chat_placeholder}
            className='ai-assistant__composer-input'
            disabled={isLoading}
            {...(stack.editTags.chatPlaceholder as {})}
          />
        )}
        <button
          type='submit'
          className='ai-assistant__composer-send'
          disabled={isLoading || !chatInput.trim()}
        >
          <i className='fa-solid fa-paper-plane' aria-hidden />
          {stack.send_button_text && (
            <span {...(stack.editTags.sendButtonText as {})}>{stack.send_button_text}</span>
          )}
        </button>
      </form>
    </div>
  );
}
