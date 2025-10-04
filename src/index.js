import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import './ui/layout.css';

import { loadGrammarSet } from './app/loadGrammarSet';
import { loadLevel } from './app/loadLevel';
import { resolveSession } from './app/sessionPlan';
import { loadI18n } from './i18n/load';
import { state } from './app/state';
import { blocksFromGrammar } from './blocks/fromGrammar';
import { toolboxXmlFromGrammar } from './toolbox/fromGrammar';
import { installJsonGenerator } from './generators/json';
import { run } from './runtime/opcodes';
import { World } from './runtime/world';
import { Renderer2D } from './runtime/renderer/canvas2d';
import { populateSelect } from './ui/controls';

async function boot(){

// inside boot():
  const { lang, locale, appI18n } = await loadI18n();
  document.getElementById('runBtn').textContent   = appI18n.ui?.Run   || 'Run';
  document.getElementById('resetBtn').textContent = appI18n.ui?.Reset || 'Reset';
  Blockly.setLocale(locale); 
  const params = new URLSearchParams(location.search);
  const cls = params.get('class');
  const { classId, current } = await resolveSession({ cls });
  const levelId = params.get('level') || current.level;
  const setKey  = params.get('set') || current.set || 'basic';

  // Merge grammar according to sets.json
  const setsUrl = new URL('./conf/grammar/sets.json', document.baseURI);
  const sets = await (await fetch(setsUrl)).json();
  const chosenSet = setKey;
  history.replaceState(null, '', updateQuery({ class: classId, level: levelId, set: chosenSet }));

  const base = new URL('./conf/grammar/', document.baseURI);
  const files = sets.sets[chosenSet];
  const grammar = { version:'1.0.0', categories: [], blocks: [] };
  for(const f of files){
    const g = await (await fetch(new URL(f, base))).json();
    if (g.categories) grammar.categories.push(...g.categories);
    if (g.blocks) grammar.blocks.push(...g.blocks);
  }

  
  Blockly.common.defineBlocks(blocksFromGrammar(grammar, appI18n));
  const toolboxXml = Blockly.utils.xml.textToDom(toolboxXmlFromGrammar(grammar, appI18n));
  const workspace = Blockly.inject('blocklyDiv', { toolbox: toolboxXml, /* ... */ });

  const wsKey = `${classId}:${levelId}`;
  const saved = state.loadWorkspace(wsKey);
  if (saved) Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(saved), workspace);

  const Gen = installJsonGenerator(grammar);

  const level = await loadLevel(levelId);
  const canvas = document.getElementById('world');
  const world = new World(level);
  const renderer = new Renderer2D(canvas, {});
  renderer.drawWorld(world);

  document.getElementById('runBtn').onclick = async () => {
    const program = JSON.parse(Gen.workspaceToCode(workspace));
    const out = [];
    const print = (m)=>out.push(String(m));
    await run(program, {
      print,
      move: (steps)=>{ world.move(Number(steps||0)); },
      turn: (dir, ang)=>{ world.turn(String(dir||'RIGHT'), Number(ang||90)); },
      tick: ()=>renderer.drawWorld(world),
    });
    document.getElementById('output').textContent = out.join('\n');
    const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
    state.saveWorkspace(wsKey, xml);
  };

  document.getElementById('resetBtn').onclick = () => {
    workspace.clear();
    Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom("<xml xmlns=\"https://developers.google.com/blockly/xml\"><block type=\"ceb_start\" x=\"40\" y=\"40\"></block></xml>"), workspace);
    document.getElementById('output').textContent = '';
    world.x = level.start.x; world.y = level.start.y; world.heading = level.start.heading || 'E';
    renderer.drawWorld(world);
  };

  // In boot():
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = lang;
    langSelect.onchange = (e) => {
      const u = new URL(location.href);
      u.searchParams.set('lang', e.target.value);
      location.href = u.toString();   // reload with new language
    };
  }

  populateSelect(document.getElementById('setSelect'), Object.keys(sets.sets).map(k=>({value:k,label:k})), chosenSet);
  populateSelect(document.getElementById('levelSelect'), [{value:levelId,label:levelId}], levelId);
  populateSelect(document.getElementById('classSelect'), [{value:classId,label:classId}], classId);
  document.getElementById('setSelect').onchange = (e)=>{ location.href = updateQuery({ set: e.target.value }); };
}

function updateQuery(patch){
  const u = new URL(location.href);
  const q = u.searchParams;
  for (const [k,v] of Object.entries(patch)) q.set(k, v);
  u.search = q.toString();
  return u.toString();
}

boot().catch(e=>{ console.error(e); alert(e.message); });
