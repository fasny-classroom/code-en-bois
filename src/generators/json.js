import * as Blockly from 'blockly/core';

export function installJsonGenerator(grammar) {
  const gen = new Blockly.Generator('json');
  const opcodeOf = new Map((grammar.blocks || []).map(b => [b.type, b.opcode || b.type]));
  gen.scrub_ = (block, code) => code;

  function emitLiteral(block) {
    if (!block) return null;
    if (block.type === 'math_number') return { lit: Number(block.getFieldValue('NUM') || 0) };
    if (block.type === 'text') return { lit: String(block.getFieldValue('TEXT') || '') };
    return emit(block);
  }

  function emit(block) {
    const opcode = opcodeOf.get(block.type) || block.type;
    const node = { op: opcode, args: {} };
    for (const input of block.inputList) {
      const conn = input.connection;
      if (conn && conn.name) {
        const name = conn.name;
        const target = conn.targetBlock && conn.targetBlock();
        node.args[name] = target ? emitLiteral(target) : null;
      }
    }
    const st = block.getInput('DO');
    if (st && st.connection) {
      node.body = [];
      let child = st.connection.targetBlock();
      while (child) {
        node.body.push(emit(child));
        child = child.getNextBlock();
      }
    }
    return node;
  }

  gen.workspaceToCode = (ws) => {
    const top = ws.getTopBlocks(true);
    const start = top.find(b => b.type === 'ceb_start') || top[0];
    const program = [];
    let cur = start ? start.getNextBlock() : null;
    while (cur) { program.push(emit(cur)); cur = cur.getNextBlock(); }
    return JSON.stringify(program);
  };

  return gen;
}
