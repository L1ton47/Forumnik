// Forumnik 1.5 — ядро: утилиты, оформление, конструктор жалоб, записи.
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const D = () => Store.data;
const pad2 = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const REUSABLE = ['yourNick', 'applicantName', 'recipientName', 'org', 'signature'];

let selectedServer = 1;
let currentResult = '';
let currentEntryId = null;
let dirty = false;
let editing = false;
const PAGE_HOOKS = {};

const serverGrid = $('server-grid');
const categorySelect = $('category-select');
const fieldsContainer = $('dynamic-fields');
const form = $('complaint-form');
const resultText = $('result-text');
const resultEdit = $('result-edit');
const resultWrap = $('result-wrap');
const emptyState = $('empty-state');
const copyButton = $('copy-button');
const downloadButton = $('download-button');
const editButton = $('edit-button');
const openForumButton = $('open-forum-button');
const outputStatus = $('output-status');

/* ---------- утилиты ---------- */
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function flashSaved(text) {
  if (!D().settings.saveNotices) return;
  const el = $('save-indicator');
  const d = new Date();
  el.textContent = `${text || 'Сохранено'} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  el.classList.add('show');
  clearTimeout(flashSaved.timer);
  flashSaved.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function fmtDate(ts) {
  const d = new Date(ts);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

async function copyText(text) {
  try {
    if (window.pywebview?.api?.copy_text) {
      const r = await window.pywebview.api.copy_text(text);
      if (!r?.ok) throw new Error(r?.error || 'copy');
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const h = document.createElement('textarea');
      h.value = text; h.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(h); h.select();
      const ok = document.execCommand('copy'); h.remove();
      if (!ok) throw new Error('fallback');
    }
    return true;
  } catch (e) { return false; }
}

function openUrl(url) {
  if (!url) return;
  if (window.pywebview?.api?.open_url) window.pywebview.api.open_url(url);
  else window.open(url, '_blank', 'noopener');
}

/* ---------- оформление ---------- */
function validHex(v, fallback) { return /^#[0-9a-f]{6}$/i.test(v || '') ? v : fallback; }
function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
function mixHex(a, b, t) {
  const x = hexRgb(a), y = hexRgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function applyTheme() {
  const s = D().settings;
  const accent = validHex(s.accent, '#4c8dff'), bg = validHex(s.bg, '#0b1220');
  const r = document.documentElement.style;
  r.setProperty('--blue', accent);
  r.setProperty('--blue-2', mixHex(accent, '#000000', 0.25));
  r.setProperty('--bg', bg);
  r.setProperty('--panel', mixHex(bg, '#ffffff', 0.06));
  r.setProperty('--panel-2', mixHex(bg, '#ffffff', 0.10));
  r.setProperty('--line', mixHex(bg, '#ffffff', 0.17));
  r.setProperty('--side', mixHex(bg, '#ffffff', 0.03));
  document.body.classList.toggle('anim', !!s.animations);
  document.body.classList.toggle('no-anim', !s.animations);
}

/* ---------- модальные окна ---------- */
function openModal(html, setup) {
  $('modal-box').innerHTML = html;
  $('modal').classList.remove('hidden');
  if (setup) setup($('modal-box'));
}
function closeModal() { $('modal').classList.add('hidden'); $('modal-box').innerHTML = ''; }
$('modal').addEventListener('mousedown', e => { if (e.target === $('modal') && closeModal.onCancel) closeModal.onCancel(); });

function uiPrompt(title, label, value = '') {
  return new Promise(resolve => {
    const done = v => { closeModal.onCancel = null; closeModal(); resolve(v); };
    closeModal.onCancel = () => done(null);
    openModal(`<h3>${esc(title)}</h3><label class="mini-label">${esc(label)}</label><input class="field-control" id="m-input" value="${esc(value)}" /><div class="modal-actions"><button class="ghost-btn" id="m-cancel" type="button">Отмена</button><button class="primary-button" id="m-ok" type="button">Готово</button></div>`, box => {
      const input = box.querySelector('#m-input'); input.focus(); input.select();
      box.querySelector('#m-ok').onclick = () => done(input.value.trim());
      box.querySelector('#m-cancel').onclick = () => done(null);
      input.onkeydown = e => { if (e.key === 'Enter') done(input.value.trim()); if (e.key === 'Escape') done(null); };
    });
  });
}
function uiConfirm(title, text, okLabel = 'Да') {
  return new Promise(resolve => {
    const done = v => { closeModal.onCancel = null; closeModal(); resolve(v); };
    closeModal.onCancel = () => done(false);
    openModal(`<h3>${esc(title)}</h3><p class="modal-text">${esc(text)}</p><div class="modal-actions"><button class="ghost-btn" id="m-cancel" type="button">Отмена</button><button class="primary-button" id="m-ok" type="button">${esc(okLabel)}</button></div>`, box => {
      box.querySelector('#m-ok').onclick = () => done(true);
      box.querySelector('#m-cancel').onclick = () => done(false);
    });
  });
}
function uiChoose(title, options, current = '') {
  return new Promise(resolve => {
    const done = v => { closeModal.onCancel = null; closeModal(); resolve(v); };
    closeModal.onCancel = () => done(null);
    openModal(`<h3>${esc(title)}</h3><select class="select-control" id="m-select">${options.map(o => `<option value="${esc(o.value)}" ${o.value === current ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select><div class="modal-actions"><button class="ghost-btn" id="m-cancel" type="button">Отмена</button><button class="primary-button" id="m-ok" type="button">Готово</button></div>`, box => {
      box.querySelector('#m-ok').onclick = () => done(box.querySelector('#m-select').value);
      box.querySelector('#m-cancel').onclick = () => done(null);
    });
  });
}

/* ---------- ссылки на разделы форума ---------- */
function resolveLink(server, cat) {
  const L = D().links || {};
  const byCat = L[`${server}:${cat}`] || CATEGORY_LINKS[`${server}:${cat}`];
  if (byCat) return { url: byCat, exact: true };
  const bySrv = L[String(server)] || SERVER_LINKS[server];
  if (bySrv) return { url: bySrv, exact: true };
  return { url: FORUM_ROOT, exact: false };
}

/* ---------- сервер / категории / поля ---------- */
function serverLabel(n) { return pad2(n); }
function getCategory() { return SCHEMES[selectedServer].categories.find(c => c.id === categorySelect.value); }
function catById(server, id) { return (SCHEMES[server]?.categories || []).find(c => c.id === id); }
function draftKey() { return `${selectedServer}:${categorySelect.value}`; }

function localDateValue() {
  const n = new Date();
  return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}-${pad2(n.getDate())}`;
}
function displayDate(v) {
  const m = (v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (v || '');
}

function renderServerGrid() {
  serverGrid.innerHTML = SERVERS.map(n => {
    const basic = SCHEMES[n].verified === false;
    return `<button class="server-card ${n === selectedServer ? 'selected' : ''} ${basic ? 'basic' : ''}" data-server="${n}" type="button" title="${basic ? 'Базовый набор категорий' : 'Шаблоны сервера готовы'}"><strong>${serverLabel(n)}</strong><span>Сервер ${serverLabel(n)}</span><i>${basic ? '◐' : '✓'}</i></button>`;
  }).join('');
  $('server-warning').classList.toggle('hidden', SCHEMES[selectedServer].verified !== false);
}

function selectServer(n, prefCat) {
  selectedServer = n;
  D().session.server = n;
  renderServerGrid();
  renderCategories(prefCat);
}

function renderCategories(prefCat) {
  const cats = SCHEMES[selectedServer].categories;
  categorySelect.innerHTML = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  if (prefCat && cats.some(c => c.id === prefCat)) categorySelect.value = prefCat;
  renderFields();
}

function renderFields(skipRestore = false) {
  const category = getCategory();
  if (!category) return;
  $('category-hint').textContent = category.hint;
  fieldsContainer.innerHTML = category.fields.map(field => {
    const id = `field-${field.id}`;
    const req = field.required ? ' <span class="required">*</span>' : '';
    const help = field.hint || HELP_TEXT[field.id] || 'Заполни это поле, если информация есть.';
    let control;
    if (field.type === 'textarea') {
      control = `<textarea class="field-control textarea" id="${id}" name="${field.id}" placeholder="Напиши здесь..."></textarea><div class="field-meta"><span>Можно писать своими словами</span><span id="${id}-counter">0 символов</span></div>`;
    } else if (field.type === 'select') {
      control = `<select class="field-control" id="${id}" name="${field.id}"><option value="">Выбери вариант</option>${(field.options || []).map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
    } else if (field.type === 'date') {
      control = `<div class="input-with-action"><input class="field-control" id="${id}" name="${field.id}" type="date" value="${localDateValue()}" /><button class="inline-action" type="button" data-date-for="${id}">Сегодня</button></div>`;
    } else {
      control = `<input class="field-control" id="${id}" name="${field.id}" type="text" placeholder="${field.type === 'link' ? 'Вставь ссылку на материал...' : 'Введи значение...'}" autocomplete="off" />`;
    }
    return `<div class="field-group ${field.width === 'full' ? 'full' : ''}"><div class="label-row"><label for="${id}">${esc(field.label)}${req}</label><button class="copy-field" type="button" data-copy-field="${id}" title="Скопировать это поле">⧉</button></div>${control}<small>${esc(help)}</small></div>`;
  }).join('');
  if (!skipRestore) restoreDraft();
  resetResult();
  updateFavUI();
  updateForumLine();
}

function updateTextCounters() {
  fieldsContainer.querySelectorAll('textarea.field-control').forEach(i => {
    const c = $(`${i.id}-counter`);
    if (c) c.textContent = `${i.value.length} символов`;
  });
}

function rawFields() {
  const out = {};
  const category = getCategory();
  if (!category) return out;
  for (const field of category.fields) {
    const input = $(`field-${field.id}`);
    if (input) out[field.id] = input.value;
  }
  return out;
}
function hasContent() {
  const category = getCategory();
  if (!category) return false;
  const values = rawFields();
  return category.fields.some(f2 => f2.type !== 'date' && String(values[f2.id] || '').trim()) || !!$('entry-note').value.trim();
}

function setDirty(v) {
  dirty = v;
  D().session.clean = !v;
  try { window.pywebview?.api?.set_dirty(v); } catch (e) { /* ignore */ }
}

/* ---------- черновики ---------- */
function saveDraft() {
  const category = getCategory();
  if (!category) return;
  const key = draftKey();
  const note = $('entry-note').value;
  if (!hasContent()) {
    delete D().drafts[key];
    $('draft-status').textContent = 'Черновик будет сохраняться на этом ПК';
  } else {
    const prev = D().drafts[key] || {};
    D().drafts[key] = { fields: rawFields(), note, updated: Date.now(), pinned: !!prev.pinned, folder: prev.folder || '' };
    $('draft-status').textContent = 'Черновик сохраняется на этом ПК';
    flashSaved('Черновик сохранён');
    D().session = { clean: false, server: selectedServer, cat: categorySelect.value, fields: rawFields(), note };
    setDirty(true);
  }
  Store.save();
}

function fillInputs(fields) {
  for (const [id, value] of Object.entries(fields || {})) {
    const input = $(`field-${id}`);
    if (input && typeof value === 'string') input.value = value;
  }
  updateTextCounters();
}

function restoreDraft() {
  $('entry-note').value = '';
  const draft = D().drafts[draftKey()];
  if (draft) {
    fillInputs(draft.fields);
    $('entry-note').value = draft.note || '';
  } else if (D().settings.autoQuickFill) {
    quickFillProfile(true);
  }
  updateTextCounters();
}

/* ---------- быстрое заполнение / профили ---------- */
function activeProfile() { return D().profiles.find(p => p.id === D().activeProfile) || null; }

function renderProfileSelect() {
  const sel = $('profile-select');
  sel.innerHTML = `<option value="">— без профиля —</option>` + D().profiles.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  sel.value = D().activeProfile || '';
}

function setIfEmpty(id, value) {
  const input = $(`field-${id}`);
  if (input && value && !input.value.trim()) { input.value = value; return true; }
  return false;
}

function quickFillProfile(silent) {
  const p = activeProfile();
  if (!p) { if (!silent) showToast('Сначала создай профиль: Настройки → Профили'); return; }
  let n = 0;
  n += setIfEmpty('yourNick', p.nick) ? 1 : 0;
  n += setIfEmpty('applicantName', p.realName) ? 1 : 0;
  n += setIfEmpty('signature', p.signature || p.realName || p.nick) ? 1 : 0;
  updateTextCounters();
  if (!silent) { showToast(n ? 'Данные профиля подставлены' : 'Подставлять нечего — поля уже заполнены'); saveDraft(); }
}

function quickFillLast() {
  const category = getCategory();
  const last = D().history.filter(h => h.server === selectedServer && h.cat === category.id).sort((a, b) => b.created - a.created)[0];
  if (!last) { showToast('Для этого сервера и категории ещё нет прошлых жалоб'); return; }
  let n = 0;
  for (const id of REUSABLE) if (category.fields.some(f2 => f2.id === id)) n += setIfEmpty(id, last.fields?.[id]) ? 1 : 0;
  updateTextCounters();
  showToast(n ? 'Подставлено из прошлой жалобы' : 'Подставлять нечего — поля уже заполнены');
  saveDraft();
}

/* ---------- избранное ---------- */
function favKey() { return `${selectedServer}:${categorySelect.value}`; }
function updateFavUI() {
  const isFav = D().favorites.includes(favKey());
  const btn = $('fav-button');
  btn.textContent = isFav ? '★' : '☆';
  btn.classList.toggle('on', isFav);
  btn.title = isFav ? 'Убрать из избранного' : 'Добавить в избранное';
  $('fav-chips').innerHTML = D().favorites.map(k => {
    const [s, c] = k.split(':'); const cat = catById(Number(s), c);
    return cat ? `<button class="chip" type="button" data-fav="${k}">★ ${pad2(s)} · ${esc(cat.name)}</button>` : '';
  }).join('');
}
function toggleFavorite() {
  const k = favKey(); const list = D().favorites; const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1); else list.push(k);
  Store.save(); updateFavUI();
  showToast(i >= 0 ? 'Убрано из избранного' : 'Добавлено в избранное');
}
function openFavorite(k) {
  const [s, c] = k.split(':');
  openPage('complaints');
  selectServer(Number(s), c);
}

/* ---------- результат ---------- */
function resetResult() {
  currentResult = ''; currentEntryId = null; editing = false;
  resultWrap.classList.add('hidden'); emptyState.classList.remove('hidden');
  resultEdit.classList.add('hidden'); resultText.classList.remove('hidden');
  [copyButton, downloadButton, editButton, openForumButton].forEach(b => { b.disabled = true; });
  editButton.textContent = 'Редактировать';
  outputStatus.textContent = 'Ожидает заполнения';
}

function showResult(category, text) {
  currentResult = text;
  resultText.textContent = text;
  $('result-server').textContent = `СЕРВЕР ${serverLabel(selectedServer)}`;
  $('result-category').textContent = category.name.toUpperCase();
  emptyState.classList.add('hidden'); resultWrap.classList.remove('hidden');
  [copyButton, downloadButton, editButton, openForumButton].forEach(b => { b.disabled = false; });
  outputStatus.textContent = 'Текст сформирован';
}

function updateForumLine() {
  const link = resolveLink(selectedServer, categorySelect.value);
  $('forum-link-line').innerHTML = link.exact
    ? `Раздел: <span>${esc(link.url)}</span>`
    : `Откроется общая страница форума. Точную ссылку раздела можно задать в Настройки → Ссылки на разделы.`;
}

function collectValues(category) {
  const values = {};
  for (const field of category.fields) {
    const input = $(`field-${field.id}`);
    const value = input ? input.value.trim() : '';
    values[field.id] = field.type === 'date' ? displayDate(value) : value;
    if (field.required && !value) { showToast(`Заполни поле «${field.label}».`); input?.focus(); return null; }
  }
  return values;
}

function upsertEntry(category, text) {
  const fields = rawFields();
  const nick = fields.yourNick || fields.applicantName || '';
  let entry = currentEntryId ? D().history.find(h => h.id === currentEntryId) : null;
  if (!entry) {
    entry = { id: uid(), created: Date.now(), pinned: false, folder: '', archived: false };
    D().history.push(entry);
    currentEntryId = entry.id;
    const st = D().stats;
    st.generated++;
    st.perServer[selectedServer] = (st.perServer[selectedServer] || 0) + 1;
    const ck = `${selectedServer}:${category.id}`;
    st.perCat[ck] = (st.perCat[ck] || 0) + 1;
  }
  Object.assign(entry, { server: selectedServer, cat: category.id, catName: category.name, title: TITLES[category.id] || category.name, text, fields, nick, note: $('entry-note').value, updated: Date.now() });
  return entry;
}

function generate() {
  const category = getCategory();
  if (!category) return;
  const values = collectValues(category);
  if (!values) return;
  const text = selectedServer === 4 && ['fsin', 'fsb', 'mvd'].includes(category.id)
    ? buildInstitutionComplaint(category, values) : buildGeneralComplaint(category, values);
  showResult(category, text);
  upsertEntry(category, text);
  saveDraft();
  setDirty(false);
  Store.save();
  showToast('Готово. Проверь текст и ссылки перед отправкой.');
}

/* ---------- переход к записи ---------- */
function loadIntoForm({ server, cat, fields, note, text, entryId }) {
  openPage('complaints');
  selectedServer = server; D().session.server = server;
  renderServerGrid();
  const cats = SCHEMES[server].categories;
  categorySelect.innerHTML = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  categorySelect.value = cat;
  renderFields(true);
  fillInputs(fields);
  $('entry-note').value = note || '';
  if (text) { showResult(getCategory(), text); currentEntryId = entryId || null; }
}

/* ---------- события конструктора ---------- */
serverGrid.addEventListener('click', e => {
  const b = e.target.closest('[data-server]'); if (!b) return;
  selectServer(Number(b.dataset.server));
});
categorySelect.addEventListener('change', () => renderFields());
$('fav-button').addEventListener('click', toggleFavorite);
$('fav-chips').addEventListener('click', e => { const b = e.target.closest('[data-fav]'); if (b) openFavorite(b.dataset.fav); });
$('profile-select').addEventListener('change', e => { D().activeProfile = e.target.value || null; Store.save(); });
$('quickfill-profile').addEventListener('click', () => quickFillProfile(false));
$('quickfill-last').addEventListener('click', quickFillLast);

fieldsContainer.addEventListener('input', e => { if (e.target.matches('textarea')) updateTextCounters(); saveDraft(); });
fieldsContainer.addEventListener('change', saveDraft);
$('entry-note').addEventListener('input', saveDraft);

fieldsContainer.addEventListener('click', async e => {
  const date = e.target.closest('[data-date-for]');
  if (date) { const i = $(date.dataset.dateFor); if (i) { i.value = localDateValue(); saveDraft(); } return; }
  const cp = e.target.closest('[data-copy-field]');
  if (cp) {
    const i = $(cp.dataset.copyField);
    const v = i ? i.value.trim() : '';
    if (!v) { showToast('Поле пустое'); return; }
    showToast((await copyText(v)) ? 'Поле скопировано' : 'Не удалось скопировать');
  }
});

form.addEventListener('submit', e => { e.preventDefault(); generate(); });

$('reset-button').addEventListener('click', () => {
  const category = getCategory();
  delete D().drafts[draftKey()];
  form.reset();
  $('entry-note').value = '';
  if (category) for (const f2 of category.fields) if (f2.type === 'date') { const i = $(`field-${f2.id}`); if (i) i.value = localDateValue(); }
  updateTextCounters(); resetResult(); setDirty(false); Store.save();
  $('draft-status').textContent = 'Черновик очищен';
  showToast('Поля и сохранённый черновик очищены');
});

copyButton.addEventListener('click', async () => {
  if (!currentResult) return;
  if (await copyText(currentResult)) { D().stats.copied++; Store.save(); showToast('Текст скопирован'); }
  else showToast('Не удалось скопировать. Выдели текст в окне результата вручную.');
});

editButton.addEventListener('click', () => {
  if (!currentResult) return;
  editing = !editing;
  if (editing) {
    resultEdit.value = currentResult;
    resultEdit.classList.remove('hidden'); resultText.classList.add('hidden');
    editButton.textContent = 'Готово'; resultEdit.focus();
  } else {
    resultText.textContent = currentResult;
    resultEdit.classList.add('hidden'); resultText.classList.remove('hidden');
    editButton.textContent = 'Редактировать';
  }
});
resultEdit.addEventListener('input', () => {
  currentResult = resultEdit.value;
  const entry = D().history.find(h => h.id === currentEntryId);
  if (entry) { entry.text = currentResult; entry.updated = Date.now(); Store.save(); }
  outputStatus.textContent = 'Текст изменён вручную';
});

downloadButton.addEventListener('click', async () => {
  if (!currentResult) return;
  const filename = `Forumnik_server_${serverLabel(selectedServer)}_${categorySelect.value}.txt`;
  try {
    if (window.pywebview?.api?.save_text_file) {
      const r = await window.pywebview.api.save_text_file(currentResult, filename);
      if (r?.cancelled) return;
      if (!r?.ok) throw new Error(r?.error || 'save');
      showToast('TXT-файл сохранён'); return;
    }
    const blob = new Blob(['\uFEFF', currentResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('TXT-файл подготовлен');
  } catch (err) { showToast('Не удалось сохранить файл. Попробуй скопировать текст.'); }
});

openForumButton.addEventListener('click', async () => {
  if (!currentResult) return;
  const link = resolveLink(selectedServer, categorySelect.value);
  let copied = false;
  if (D().settings.autoCopyOnOpen) { copied = await copyText(currentResult); if (copied) D().stats.copied++; }
  D().stats.opened++; Store.save();
  showToast(copied ? 'Текст скопирован — открываю форум' : 'Открываю форум');
  openUrl(link.url);
});

$('help-toggle').addEventListener('click', () => {
  const panel = $('quick-help');
  const expanded = panel.classList.toggle('expanded');
  $('help-toggle').setAttribute('aria-expanded', String(expanded));
  $('help-toggle').textContent = expanded ? 'Скрыть инструкцию' : 'Как пользоваться?';
});

/* ---------- навигация ---------- */
const PAGE_LABELS = { home: 'Главная', complaints: 'Жалобы', records: 'Мои записи', stats: 'Статистика', join: 'Заявка на вступление', updates: 'Обновления', info: 'Информация', support: 'Поддержать', settings: 'Настройки' };
let currentPage = 'home';

function openPage(page, push = true) {
  if (!PAGE_LABELS[page]) page = 'home';
  currentPage = page;
  document.querySelectorAll('.page-view').forEach(v => v.classList.toggle('hidden', v.id !== `page-${page}`));
  document.querySelectorAll('.nav-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $('breadcrumb').innerHTML = `Forumnik <span>/</span> ${PAGE_LABELS[page]}`;
  document.title = `Forumnik ${APP_VERSION} — ${PAGE_LABELS[page]}`;
  if (push && location.hash !== `#${page}`) { openPage.skip = true; location.hash = page; }
  if (PAGE_HOOKS[page]) PAGE_HOOKS[page]();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
window.addEventListener('hashchange', () => {
  if (openPage.skip) { openPage.skip = false; return; }
  openPage(location.hash.slice(1), false);
});
document.querySelectorAll('.nav-item[data-page]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.page === 'join') showToast('Раздел появится в следующих обновлениях');
  openPage(b.dataset.page);
}));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-open-page]');
  if (b) openPage(b.dataset.openPage);
  const ext = e.target.closest('a[data-ext]');
  if (ext) { e.preventDefault(); openUrl(ext.href); }
});

/* ---------- горячие клавиши ---------- */
function comboFromEvent(e) {
  const k = e.key;
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(k)) return '';
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(k.length === 1 ? k.toUpperCase() : k);
  return parts.join('+');
}
const HOTKEY_LABELS = { generate: 'Сформировать жалобу', copy: 'Скопировать результат', newComplaint: 'Новая жалоба', saveEntry: 'Сохранить черновик', search: 'Поиск по записям' };

document.addEventListener('keydown', e => {
  if (document.body.dataset.capturing) return;
  if (!$('modal').classList.contains('hidden')) return;
  const combo = comboFromEvent(e);
  if (!combo) return;
  const hk = D().settings.hotkeys;
  const action = Object.keys(hk).find(a => hk[a] === combo);
  if (!action) return;
  e.preventDefault();
  if (action === 'generate') { if (currentPage === 'complaints') form.requestSubmit(); }
  else if (action === 'copy') { if (!copyButton.disabled) copyButton.click(); }
  else if (action === 'newComplaint') { openPage('complaints'); fieldsContainer.querySelector('input,textarea')?.focus(); }
  else if (action === 'saveEntry') { if (currentPage === 'complaints') { saveDraft(); flashSaved('Сохранено'); } }
  else if (action === 'search') { openPage('records'); setTimeout(() => $('records-search')?.focus(), 30); }
});

/* ---------- закрытие / сбой ---------- */
window.forumnikBeforeClose = () => ({ dirty });
