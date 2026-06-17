export const LOCALE_KEY = 'cs-locale';
export const DEFAULT_LOCALE = 'en-us';
export const GUJARATI_LOCALE = 'gu-in';

export const LANGUAGES = [
  { code: DEFAULT_LOCALE, label: 'EN', name: 'English' },
  { code: GUJARATI_LOCALE, label: 'GU', name: 'ગુજરાતી' },
] as const;

export function getLanguageMeta(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function getStoredLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return localStorage.getItem(LOCALE_KEY) || DEFAULT_LOCALE;
}

export function setStoredLocale(code: string) {
  localStorage.setItem(LOCALE_KEY, code);
  window.dispatchEvent(new CustomEvent('cs-locale-change', { detail: code }));

  const main = document.querySelector('.mainClass');
  if (main) {
    main.classList.add('is-locale-animating');
    window.setTimeout(() => main.classList.remove('is-locale-animating'), 480);
  }
}
