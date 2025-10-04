export function populateSelect(el, items, current){
  el.innerHTML = '';
  for (const it of items){
    const opt = document.createElement('option');
    opt.value = it.value;
    opt.textContent = it.label;
    if (it.value === current) opt.selected = true;
    el.appendChild(opt);
  }
}
