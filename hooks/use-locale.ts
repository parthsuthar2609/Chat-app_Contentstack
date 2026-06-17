'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredLocale, setStoredLocale } from '@/lib/locale';

export function useLocale() {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    const onChange = (e: Event) => {
      setLocaleState((e as CustomEvent<string>).detail || getStoredLocale());
    };
    window.addEventListener('cs-locale-change', onChange);
    return () => window.removeEventListener('cs-locale-change', onChange);
  }, []);

  const setLocale = useCallback((code: string) => {
    setStoredLocale(code);
    setLocaleState(code);
  }, []);

  return { locale, setLocale };
}
