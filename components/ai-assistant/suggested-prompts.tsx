'use client';

import React from 'react';
import { getSuggestionsForStack } from '@/components/ai-assistant/suggestions';

type SuggestedPromptsProps = {
  stackId: string;
  stackName: string;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
};

export default function SuggestedPrompts({
  stackId,
  stackName,
  onSelect,
  disabled,
}: SuggestedPromptsProps) {
  const suggestions: string[] = getSuggestionsForStack(stackId, stackName);

  return (
    <div className='ai-assistant__suggestions'>
      <div className='ai-assistant__suggestion-chips'>
        {suggestions.map((prompt: any) => (
          <button
            key={prompt}
            type='button'
            className='ai-assistant__suggestion-chip'
            disabled={disabled}
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
