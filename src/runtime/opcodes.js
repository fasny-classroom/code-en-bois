export async function run(program, io = {}) {
  const ctx = {
    speed: 'NORMAL',
    print: io.print || ((...a)=>console.log(...a)),
    move:  io.move  || ((steps)=>console.log('[MOVE]', steps)),
    turn:  io.turn  || ((dir, ang)=>console.log('[TURN]', dir, ang)),
    wait:  io.wait  || ((secs)=>new Promise(r=>setTimeout(r, secs*1000))),
    tick:  io.tick  || (()=>{}),
  };

  function val(v) {
    if (v == null) return null;
    if (typeof v === 'object' && 'lit' in v) return v.lit;
    return v;
  }

  async function exec(node) {
    switch (node.op) {
      case 'PRINT': ctx.print(val(node.args.TEXT)); break;
      case 'MOVE':  ctx.move(val(node.args.STEPS)); ctx.tick(); break;
      case 'TURN':  ctx.turn(val(node.args.DIR)||'RIGHT', val(node.args.ANGLE)); ctx.tick(); break;
      case 'WAIT':  await ctx.wait(val(node.args.SECS)); break;
      case 'REPEAT': {
        const n = val(node.args.TIMES) ?? 0;
        for (let i=0;i<n;i++) await execBody(node.body||[]);
        break;
      }
      case 'SPEED': ctx.speed = String(val(node.args.SPEED)||'NORMAL'); break;
      default: break;
    }
  }
  async function execBody(list){ for(const n of list) await exec(n); }
  for (const n of program) await exec(n);
}
