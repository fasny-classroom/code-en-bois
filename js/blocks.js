console.log("[blocks] file loaded");
(function () {
  // Avoid double registration if script is ever included twice
  if (window.CEBBlocks) {
    console.log("[blocks] already loaded, skipping");
    return;
  }

  const L = (v, lang) => (v && typeof v === 'object' ? (v[lang] || v.en) : v);

  // Poll until condition is true, with watchdog logs
  function when(cond, cb, label, timeoutMs = 8000) {
    const start = performance.now();
    (function tick(attempt = 0) {
      if (cond()) return cb();
      if (performance.now() - start > timeoutMs) {
        console.error(`[blocks] TIMEOUT waiting for ${label}. Details:`, {
          hasBlockly: !!window.Blockly,
          hasPython: !!(window.Blockly && window.Blockly.Python),
          hasForBlock: !!(window.Blockly && window.Blockly.Python && window.Blockly.Python.forBlock),
          scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src)
        });
        return;
      }
      if (attempt % 10 === 0) {
        console.log(`[blocks] waiting for ${label}… attempt ${attempt}`);
      }
      setTimeout(() => tick(attempt + 1), 50);
    })();
  }

  when(
    () => !!(window.Blockly && window.Blockly.Python && window.Blockly.Python.forBlock),
    () => {
      console.log("[blocks] Blockly.Python available, starting registration");
      const PythonGen = window.Blockly.Python;

      function defineBlocksFromGrammar(grammar, lang) {
        const cats = (grammar && Array.isArray(grammar.categories)) ? grammar.categories : [];
        for (const cat of cats) {
          console.log(`[blocks] registering category '${L(cat.name, lang)}'`);
          for (const b of (cat.blocks || [])) {
            console.log(`[blocks] registering block type '${b.type}'`);
            Blockly.Blocks[b.type] = {
              init: function () {
                this.appendDummyInput().appendField(L(b.label, lang));
                this.setPreviousStatement(true);
                this.setNextStatement(true);
                this.setColour(cat.color);
              }
            };
            PythonGen.forBlock[b.type] = function () {
              return (b.gen || '') + '\n';
            };
          }
        }
        console.log("[blocks] block definitions complete");
      }

      // Category toolbox (preferred)
      function toolboxJsonFromGrammar(grammar, lang) {
        const cats = (grammar && Array.isArray(grammar.categories)) ? grammar.categories : [];
        const contents = cats.map(cat => ({
          kind: "category",
          name: L(cat.name, lang),
          colour: cat.color,
          contents: (cat.blocks || []).map(b => ({ kind: "block", type: b.type }))
        }));
        const toolbox = { kind: "categoryToolbox", contents };
        console.log("[blocks] toolbox JSON categories:", contents.length);
        return toolbox;
      }

      // Flyout toolbox (no categories) — for visibility fallback
      function toolboxFlyoutFromGrammar(grammar, lang) {
        const cats = (grammar && Array.isArray(grammar.categories)) ? grammar.categories : [];
        const allBlocks = [];
        for (const cat of cats) {
          for (const b of (cat.blocks || [])) {
            allBlocks.push({ kind: "block", type: b.type });
          }
        }
        const toolbox = { kind: "flyoutToolbox", contents: allBlocks };
        console.log("[blocks] flyout toolbox blocks:", allBlocks.length);
        return toolbox;
      }

      function generatePyCode(ws) {
        console.log("[blocks] generating Python code");
        const body = Blockly.Python.workspaceToCode(ws);
        const code = `import js, asyncio
from engine import Engine
engine = Engine(js.document.getElementById('canvas'))
api = engine.api()
async def __program():
  ${body.replace(/\n/g, '\n  ')}
await __program()`;
        console.log("[blocks] code preview:", code.substring(0, 100));
        return code;
      }

      window.CEBBlocks = {
        defineBlocksFromGrammar,
        toolboxJsonFromGrammar,
        toolboxFlyoutFromGrammar,
        generatePyCode
      };
      console.log("[blocks] CEBBlocks ready");
    },
    "Blockly.Python.forBlock"
  );
})();