'use client';

import { useEffect, useRef, useState } from 'react';
import { getLanguageMeta, LANGUAGES } from '@/lib/locale';
import { useLocale } from '@/hooks/use-locale';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getLanguageMeta(locale);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectLanguage(code: string) {
    setLocale(code);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`language-switcher${open ? ' is-open' : ''}`}
      title="Main content language"
    >
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Main content language: ${current.name}`}
      >
        <i className="fa-solid fa-globe language-switcher__icon" aria-hidden />
        <span className="language-switcher__current">{current.label}</span>
        <i className="fa-solid fa-chevron-down language-switcher__chevron" aria-hidden />
      </button>

      {open && (
        <ul className="language-switcher__menu" role="listbox" aria-label="Select language">
          {LANGUAGES.map(({ code, label, name }) => {
            const isActive = locale === code;
            return (
              <li key={code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`language-switcher__option${isActive ? ' is-active' : ''}`}
                  onClick={() => selectLanguage(code)}
                >
                  <span className="language-switcher__option-code">{label}</span>
                  <span className="language-switcher__option-name">{name}</span>
                  {isActive && (
                    <i className="fa-solid fa-check language-switcher__check" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
