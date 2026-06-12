'use client';

import React from 'react';
import { SuggestedPromptItem } from '@/typescript/ai-assistant';

type SuggestedPromptsProps = {
  suggestions: SuggestedPromptItem[];
  editTags?: Record<string, Record<string, string>>;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export default function SuggestedPrompts({
  suggestions,
  editTags,
  onSelect,
  disabled,
}: SuggestedPromptsProps) {
  if (!suggestions.length) return null;

  return (
    <div className='ai-assistant__suggestions'>
      <div className='ai-assistant__suggestion-chips'>
        {suggestions.map((item, index) => (
          <button
            key={item.fieldKey}
            type='button'
            className='ai-assistant__suggestion-chip'
            style={{ animationDelay: `${index * 0.07}s` }}
            disabled={disabled}
            onClick={() => onSelect(item.text)}
            {...(editTags?.[item.fieldKey] as {})}
          >
            {item.text}
          </button>
        ))}
      </div>
    </div>
  );
}
