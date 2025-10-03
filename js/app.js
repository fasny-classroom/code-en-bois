// ----- noisy logging so we can see what's going on -----
function now() { return new Date().toISOString().split('T')[1].replace('Z',''); }
function log(...a){ console.log(`[app ${now()}]`, ...a); }
function warn(...a){ console.warn(`[app ${now()}]`, ...a); }
function err(...a){ console.error(`[app ${now()}]`, ...a); }

// ----- tiny waiters -----
async function waitForBlockly(timeoutMs = 8000) {
  const t0 = performance.now();
  while (!(window.Blockly && window.Blockly.Python && window.Blockly.Python.forBlock)) {
    if (performance.now() - t0 > timeoutMs) throw new Error("Timed out waiting for Blockly.Python.forBlock");
    await new Promise(r => setTimeout(r, 50));
  }
  return window.Blockly;
}
async function waitForCEBBlocks(timeoutMs = 8000) {
  const t0 = performance.now();
  while (!window.CEBBlocks) {
    if (performance.now() - t0 > timeoutMs) throw new Error("Timed out waiting for window.CEBBlocks");
    await new Promise(r => setTimeout(r, 50));
  }
  return window.CEBBlocks;
}
async function waitForGrammar(timeoutMs = 8000) {
  const t0 = performance.now();
  while (!(window.CEB_GRAMMAR && Array.isArray(window.CEB_GRAMMAR.categories) && window.CEB_GRAMMAR.categories.length)) {
    if (performance.now() - t0 > timeoutMs) throw new Error("Timed out waiting for window.CEB_GRAMMAR");
    await new Promise(r => setTimeout(r, 50));
  }
  return window.CEB_GRAMMAR;
}

// ----- main startup -----
(async function () {
  log("startup: app.js loaded. Scripts present:",
    Array.from(document.querySelectorAll('script[src]')).map(s => s.src).slice(-10)
  );

  // wait for core libs + our CEBBlocks export + grammar
  const BlocklyRef = await waitForBlockly();
  log("ok: Blockly present:", !!BlocklyRef, "Python forBlock:", !!BlocklyRef.Python?.forBlock);

  const CEB = await waitForCEBBlocks();
  log("ok: CEBBlocks available:", Object.keys(CEB));

  const GRAM = await waitForGrammar();
  log("grammar ok: categories =", GRAM.categories.length);

  // ----- workspace build -----
  let workspace = null;
  function rebuild(lang = 'fr') {
    log("rebuild(): injecting Blockly workspace, lang =", lang);
    if (workspace) workspace.dispose();

    // register our blocks + generators
    CEB.defineBlocksFromGrammar(GRAM, lang);

    // try category toolbox first
    const catToolbox = CEB.toolboxJsonFromGrammar(GRAM, lang);
    log("toolbox (category) json categories =", catToolbox.contents?.length ?? 0);

    workspace = Blockly.inject('blocklyDiv', {
      toolbox: catToolbox,
      trashcan: true,
      grid: { spacing: 20, length: 3, colour: '#ddd', snap: true },
      renderer: 'zelos',
      media: 'https://unpkg.com/blockly/media/',
      toolboxPosition: 'start',
      zoom: { controls: true, wheel: true }
    });
    log("workspace injected:", !!workspace);

    // diagnose toolbox contents
    const tb = workspace.getToolbox?.();
    log("toolbox present:", !!tb);
    try {
      const items = tb?.getToolboxItems?.() || [];
      const names = items.map(it => it.getName?.() || it.id || it.kind || 'item');
      log("toolbox items:", names);
    } catch (e) {
      warn("could not introspect toolbox items:", e);
    }

    // fallback to flyout if categories look empty
    const seemsEmpty = !tb || (tb.getToolboxItems && tb.getToolboxItems().length === 0);
    if (seemsEmpty) {
      warn("category toolbox appears empty -> rebuilding with simple flyout");
      workspace.dispose();
      const flyToolbox = CEB.toolboxFlyoutFromGrammar(GRAM, lang);
      log("toolbox (flyout) blocks =", flyToolbox.contents?.length ?? 0);
      workspace = Blockly.inject('blocklyDiv', {
        toolbox: flyToolbox,
        trashcan: true,
        grid: { spacing: 20, length: 3, colour: '#ddd', snap: true },
        renderer: 'zelos',
        media: 'https://unpkg.com/blockly/media/',
        toolboxPosition: 'start',
        zoom: { controls: true, wheel: true }
      });
      const tb2 = workspace.getToolbox?.();
      log("flyout toolbox present:", !!tb2);
    }

    try { workspace.getToolbox()?.setVisible(true); } catch (_) {}
  }

  // build once (FR default)
  rebuild('fr');

  // ----- Pyodide + engine -----
  log("pyodide: loading…");
  const pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full" });
  log("pyodide: loaded.");
  await loadEngineModule();

  // After: const pyodide = await loadPyodide(...);
  async function loadEngineModule() {
    const engineSrc = await fetch('./py/engine.py').then(r => {
      log("fetch engine.py status:", r.status);
      return r.text();
    });
    // write & import with a fresh spec each time
    pyodide.FS.writeFile('/engine.py', engineSrc);
    await pyodide.runPythonAsync(`
  import sys, os, importlib.util
  if 'engine' in sys.modules:
      del sys.modules['engine']
  assert os.path.exists('/engine.py'), "engine.py missing in FS"
  spec = importlib.util.spec_from_file_location('engine','/engine.py')
  engine = importlib.util.module_from_spec(spec)
  sys.modules['engine'] = engine
  spec.loader.exec_module(engine)
  print("py: engine loaded:", hasattr(engine, 'Engine'))
  `);
    log("pyodide: engine imported.");
  }

  const engineSrc = await fetch('./py/engine.py').then(r => {
    log("fetch engine.py status:", r.status);
    return r.text();
  });
  pyodide.FS.writeFile('/engine.py', engineSrc);

  await pyodide.runPythonAsync(`
import sys, os, importlib.util
print("py: sys.path:", sys.path)
assert os.path.exists('/engine.py'), "engine.py missing in FS"
spec = importlib.util.spec_from_file_location('engine','/engine.py')
engine = importlib.util.module_from_spec(spec)
sys.modules['engine'] = engine
spec.loader.exec_module(engine)
print("py: engine loaded:", hasattr(engine, 'Engine'))
`);
  log("pyodide: engine imported.");

  // ----- buttons (optional) -----
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  if (!runBtn || !resetBtn) warn("buttons not found in DOM");

  runBtn?.addEventListener('click', async () => {
    try {
      log("Run clicked");
      const code = CEB.generatePyCode(workspace);
      log("code length =", code.length);
      await pyodide.runPythonAsync(code);
      log("program finished.");
    } catch (e) {
      err("program error:", e);
    }
  });

  
  resetBtn?.addEventListener('click', async () => {
  log("Reset clicked");
  try {
    await loadEngineModule();
    log("engine reloaded.");
  } catch (e) {
    err("engine reload failed:", e);
  }
});

  // // optional language toggles if you add elements with these ids
  // document.getElementById('langFr')?.addEventListener('click', () => rebuild('fr'));
  // document.getElementById('langEn')?.addEventListener('click', () => rebuild('en'));
})();