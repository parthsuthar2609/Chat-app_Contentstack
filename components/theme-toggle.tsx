'use client';

import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('cs-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('cs-theme', theme);

  const main = document.querySelector('.mainClass');
  if (main) {
    main.classList.add('is-theme-animating');
    window.setTimeout(() => main.classList.remove('is-theme-animating'), 520);
  }
}

function SunIcon() {
  return (
    <svg className='theme-toggle__icon theme-toggle__icon--sun' viewBox='0 0 24 24' aria-hidden>
      <circle cx='12' cy='12' r='4.5' fill='currentColor' />
      <g className='theme-toggle__rays' stroke='currentColor' strokeWidth='1.75' strokeLinecap='round'>
        <line x1='12' y1='2' x2='12' y2='5' />
        <line x1='12' y1='19' x2='12' y2='22' />
        <line x1='2' y1='12' x2='5' y2='12' />
        <line x1='19' y1='12' x2='22' y2='12' />
        <line x1='4.2' y1='4.2' x2='6.3' y2='6.3' />
        <line x1='17.7' y1='17.7' x2='19.8' y2='19.8' />
        <line x1='4.2' y1='19.8' x2='6.3' y2='17.7' />
        <line x1='17.7' y1='6.3' x2='19.8' y2='4.2' />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className='theme-toggle__icon theme-toggle__icon--moon' viewBox='0 0 24 24' aria-hidden>
      <path
        d='M15.5 3.2a7.5 7.5 0 1 0 5.3 12.7A6.5 6.5 0 0 1 15.5 3.2z'
        fill='currentColor'
      />
      <circle className='theme-toggle__star theme-toggle__star--1' cx='7' cy='6' r='0.7' fill='currentColor' />
      <circle className='theme-toggle__star theme-toggle__star--2' cx='5' cy='11' r='0.5' fill='currentColor' />
      <circle className='theme-toggle__star theme-toggle__star--3' cx='9' cy='14' r='0.45' fill='currentColor' />
    </svg>
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setSwitching(true);
    applyTheme(next);
    setTheme(next);
    window.setTimeout(() => setSwitching(false), 520);
  }

  const isDark = theme === 'dark';

  return (
    <button
      type='button'
      className={`theme-toggle${isDark ? ' is-dark' : ''}${switching ? ' is-switching' : ''}`}
      onClick={toggle}
      aria-label={isDark ? 'Switch main area to light mode' : 'Switch main area to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className='theme-toggle__glow' aria-hidden />
      <span className='theme-toggle__track' aria-hidden>
        <span className='theme-toggle__thumb'>
          {isDark ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className='theme-toggle__bg-icon theme-toggle__bg-icon--sun'>
          <SunIcon />
        </span>
        <span className='theme-toggle__bg-icon theme-toggle__bg-icon--moon'>
          <MoonIcon />
        </span>
      </span>
    </button>
  );
}
