export async function loadLevel(id){
  const HREF_BASE = new URL(
    window.location.href.endsWith('/') ? window.location.href : window.location.href + '/'
  );
  const base = new URL('./conf/levels/', HREF_BASE);
  const res = await fetch(new URL(id + '.json', base));
  if (!res.ok) throw new Error('Level not found: '+id);
  return await res.json();
}
