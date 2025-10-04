// src/i18n/load.js
import { resolveLang } from './lang';

export async function loadI18n() {
  const lang = resolveLang();     // 'en' or 'fr'
  // 1) Blockly built-in UI locale (menus)
  // Dynamic import so Webpack bundles both locales.
  const locale = await import(`blockly/msg/${lang}.js`).then(m => m.default || m);
  // 2) App + block text translations
  const base = new URL('../../conf/i18n/', document.baseURI);
  const appI18n = await (await fetch(new URL(`${lang}.json`, base))).json();
  return { lang, locale, appI18n };
}