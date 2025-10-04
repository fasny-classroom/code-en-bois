export const state = {
  saveWorkspace(key, xml){ localStorage.setItem('ws:'+key, xml); },
  loadWorkspace(key){ return localStorage.getItem('ws:'+key) || null; }
};
