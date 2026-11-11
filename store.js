// Хранилище данных Forumnik 1.5: файл на диске (через Python) либо localStorage в браузере.
const Store = (() => {
  const LS_KEY = 'forumnik-data-v15';
  const defaults = () => ({
    v: 1,
    profiles: [], activeProfile: null,
    favorites: [], drafts: {}, history: [], folders: [], links: {}, customLinks: [],
    readMessages: [],
    settings: {
      accent: '#4c8dff', bg: '#0b1220', animations: true, splash: true,
      saveNotices: true, confirmExit: true, tray: false, trayOnClose: false,
      autoCheck: true, autoQuickFill: true, autoCopyOnOpen: true, autoOpenForum: true,
      widgets: [
        { id: 'quick', on: true }, { id: 'favorites', on: true }, { id: 'recent', on: true },
        { id: 'pinned', on: true }, { id: 'stats', on: true }, { id: 'news', on: true }, { id: 'version', on: true }
      ],
      hotkeys: { generate: 'Ctrl+Enter', copy: 'Ctrl+Shift+C', newComplaint: 'Ctrl+N', saveEntry: 'Ctrl+S', search: 'Ctrl+K' },
      backup: { onStart: true, onExit: true, keep: 10 }
    },
    stats: { generated: 0, copied: 0, opened: 0, launches: 0, firstRun: Date.now(), perServer: {}, perCat: {} },
    session: { clean: true, server: 1, cat: '', fields: null }
  });

  let data = defaults();
  let timer = null;
  const api = () => (window.pywebview && window.pywebview.api) || null;

  function merge(base, incoming) {
    if (Array.isArray(base) || typeof base !== 'object' || base === null) return incoming === undefined ? base : incoming;
    const out = { ...base };
    if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
      for (const key of Object.keys(incoming)) {
        out[key] = key in base ? merge(base[key], incoming[key]) : incoming[key];
      }
    }
    return out;
  }

  function normalize() {
    const def = defaults().settings.widgets;
    const have = new Set(data.settings.widgets.map(w => w.id));
    def.forEach(w => { if (!have.has(w.id)) data.settings.widgets.push(w); });
    data.settings.widgets = data.settings.widgets.filter(w => def.some(d => d.id === w.id));
  }

  async function waitApi() {
    if (api()) return;
    await new Promise(resolve => {
      window.addEventListener('pywebviewready', resolve, { once: true });
      setTimeout(resolve, 1500);
    });
  }

  async function init() {
    await waitApi();
    let raw = null;
    try {
      raw = api() ? await api().load_data() : localStorage.getItem(LS_KEY);
    } catch (e) { raw = null; }
    if (raw) {
      try { data = merge(defaults(), JSON.parse(raw)); } catch (e) { data = defaults(); }
    }
    normalize();
    migrateLegacyDrafts();
    return data;
  }

  // Черновики из версии 1.3/1.4 лежали в localStorage окна — переносим их один раз.
  function migrateLegacyDrafts() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const m = key && key.match(/^forumnik-draft-(\d+)-(.+)$/);
        if (!m) continue;
        const k = `${m[1]}:${m[2]}`;
        if (data.drafts[k]) continue;
        const fields = JSON.parse(localStorage.getItem(key) || '{}');
        if (Object.values(fields).some(v => String(v || '').trim())) {
          data.drafts[k] = { fields, note: '', updated: Date.now(), pinned: false, folder: '' };
        }
      }
    } catch (e) { /* миграция необязательна */ }
  }

  function persistNow() {
    const json = JSON.stringify(data);
    try {
      if (api()) api().save_data(json);
      else localStorage.setItem(LS_KEY, json);
    } catch (e) { /* ничего не делаем: данные останутся в памяти */ }
  }

  function save() {
    clearTimeout(timer);
    timer = setTimeout(persistNow, 350);
  }

  function replaceAll(next) {
    data = merge(defaults(), next);
    normalize();
    persistNow();
  }

  return {
    init, save, persistNow, replaceAll, defaults,
    get data() { return data; },
    get api() { return api(); }
  };
})();
