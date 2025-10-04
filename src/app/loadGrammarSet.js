export async function loadGrammarSet() {
  const HREF_BASE = new URL(
    window.location.href.endsWith('/') ? window.location.href : window.location.href + '/'
  );
  const base = new URL('./conf/grammar/', HREF_BASE);
  const sets = await (await fetch(new URL('sets.json', base))).json();
  const params = new URLSearchParams(location.search);
  const key = params.get('set') || localStorage.getItem('ceb:set') || sets.default || 'basic';
  localStorage.setItem('ceb:set', key);
  const files = sets.sets[key];
  if (!files) throw new Error(`Unknown set: ${key}`);
  const merged = { version: '1.0.0', categories: [], blocks: [] };
  for (const f of files) {
    const g = await (await fetch(new URL(f, base))).json();
    if (g.categories) merged.categories.push(...g.categories);
    if (g.blocks) merged.blocks.push(...g.blocks);
  }
  return { key, grammar: merged };
}
