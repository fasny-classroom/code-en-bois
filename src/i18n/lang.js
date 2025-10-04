// src/i18n/lang.js
export function resolveLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q) { localStorage.setItem('ceb:lang', q); return q; }
  return localStorage.getItem('ceb:lang') || 'en';
}