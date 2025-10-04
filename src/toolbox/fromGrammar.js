export function toolboxXmlFromGrammar(grammar, i18n) {
  const byCat = new Map();
  for (const cat of grammar.categories || []) byCat.set(cat.id, []);
  for (const b of grammar.blocks) {
    if (!byCat.has(b.category)) byCat.set(b.category, []);
    byCat.get(b.category).push(b);
  }
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const catXml = [...byCat.entries()].map(([id, blocks]) => {
    const c = (grammar.categories || []).find(c => c.id === id) || { name: id, colour: 160 };
    const localizedName = i18n.categories?.[id] || c.name;
    const blocksXml = blocks.map(b => {
      // shadows are the same across languages (numbers/text), so unchanged
      const values = (b.args0 || []).filter(a => a.shadow).map(a => {
        const sh = a.shadow;
        const fields = Object.entries(sh.field || {}).map(([k,v])=>`<field name="${k}">${esc(v)}</field>`).join('');
        return `<value name="${a.name}"><shadow type="${sh.type}">${fields}</shadow></value>`;
      }).join('');
      return `<block type="${b.type}">${values}</block>`;
    }).join('');
    return `<category name="${esc(localizedName)}" colour="${c.colour}">${blocksXml}</category>`;
  }).join('');
  return `<xml id="toolbox" style="display:none">${catXml}</xml>`;
}