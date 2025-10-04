import * as Blockly from 'blockly/core';

export function blocksFromGrammar(grammar, i18n) {
  const defs = [];
  for (const b of grammar.blocks) {
    const cat = (grammar.categories || []).find(c => c.id === b.category);
    const tBlock = i18n.blocks?.[b.type] || {};
    const def = {
      type: b.type,
      // prefer translation if present
      message0: tBlock.message0 || b.message0,
      tooltip: b.tooltip || '',
      helpUrl: b.helpUrl || '',
      colour: cat ? cat.colour : 160,
    };
    if (b.hat === 'cap') def.hat = 'cap';
    if (b.shape === 'statement' || b.shape === 'C') {
      if (b.hat !== 'cap') def.previousStatement = null;
      def.nextStatement = null;
    }
    if (b.args0) {
      def.args0 = b.args0.map(a => {
        if (a.input_statement) return { type:'input_statement', name:a.name };
        if (a.input_dummy) return { type:'input_dummy' };
        if (a.field_dropdown) {
          // localize dropdown OPTION labels only; values stay the same
          const arr = a.field_dropdown.map(([label, value]) => {
            if (b.type === 'ceb_turn' && i18n.blocks?.ceb_turn?.dir?.[value]) {
              return [i18n.blocks.ceb_turn.dir[value], value];
            }
            if (b.type === 'ceb_set_speed' && i18n.blocks?.ceb_set_speed?.speed?.[value]) {
              return [i18n.blocks.ceb_set_speed.speed[value], value];
            }
            return [label, value];
          });
          return { type:'field_dropdown', name:a.name, options: arr };
        }
        const res = { type:'input_value', name:a.name };
        if (a.check) res.check = a.check;
        return res;
      });
    }
    defs.push(def);
  }
  return Blockly.common.createBlockDefinitionsFromJsonArray(defs);
}