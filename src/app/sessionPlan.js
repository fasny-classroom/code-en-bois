export async function resolveSession({cls}){
  const base = new URL('../../conf/classes/', document.baseURI);
  const mani = await (await fetch(new URL('class_manifest.json', base))).json();
  const id = cls || mani.default;
  const f = new URL(id + '.json', base);
  const plan = await (await fetch(f)).json();
  const today = new Date();
  const iso = (d)=>d.toISOString().slice(0,10);
  const pick = plan.sessions.find(s => iso(new Date(s.from)) <= iso(today) && iso(today) <= iso(new Date(s.to))) || plan.sessions[0];
  return { classId: id, plan, today, current: pick };
}
