import React from 'react';

export type StackIconKey = 'contentstack' | 'sitecore' | 'default';

export function resolveStackIconKey(name?: string, slug?: string): StackIconKey {
  const value = `${slug || ''} ${name || ''}`.toLowerCase();
  if (value.includes('contentstack') || value.includes('content stack')) {
    return 'contentstack';
  }
  if (value.includes('sitecore')) {
    return 'sitecore';
  }
  return 'default';
}

type StackIconProps = {
  stackKey: StackIconKey;
  className?: string;
};

export function StackIcon({ stackKey, className = 'ai-assistant__stack-icon' }: StackIconProps) {
  if (stackKey === 'contentstack') {
    return (
      <svg className={className} viewBox='0 0 24 24' aria-hidden fill='none'>
        <rect x='3' y='14' width='18' height='4' rx='1' fill='currentColor' opacity='0.35' />
        <rect x='5' y='9' width='14' height='4' rx='1' fill='currentColor' opacity='0.65' />
        <rect x='7' y='4' width='10' height='4' rx='1' fill='currentColor' />
      </svg>
    );
  }

  if (stackKey === 'sitecore') {
    return (
      <svg className={className} viewBox='0 0 24 24' aria-hidden fill='none'>
        <path
          d='M12 3L20 8.5V15.5L12 21L4 15.5V8.5L12 3Z'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinejoin='round'
        />
        <path
          d='M12 8L16 10.5V15.5L12 18L8 15.5V10.5L12 8Z'
          fill='currentColor'
        />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox='0 0 24 24' aria-hidden fill='none'>
      <path
        d='M8 6L4 10V18L8 22H16L20 18V10L16 6H8Z'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
      <path d='M9 12H15M12 9V15' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
    </svg>
  );
}
