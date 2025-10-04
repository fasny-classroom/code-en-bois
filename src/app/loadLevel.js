export async function loadLevel(id){
  const base = new URL('./conf/levels/', document.baseURI);
  const res = await fetch(new URL(id + '.json', base));
  if (!res.ok) throw new Error('Level not found: '+id);
  return await res.json();
}
