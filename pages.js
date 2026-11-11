// Forumnik 1.5 — страницы: главная, записи, статистика, обновления, информация, настройки, запуск.
const api = () => (window.pywebview && window.pywebview.api) || null;
const runtimeMessages = [];
let updateInfo = null;
let infoTab = 'about';
let settingsTab = 'look';
const recordsState = { tab: 'all', folder: '', q: '' };

function allMessages() { return [...runtimeMessages, ...MESSAGES]; }
function updateBell() {
  const unread = allMessages().filter(m => !D().readMessages.includes(m.id)).length;
  const b = $('bell-badge'); b.textContent = unread; b.classList.toggle('hidden', !unread);
}
function initTabs(root, current, onChange) {
  root.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === current);
    t.onclick = () => onChange(t.dataset.tab);
  });
}
const switchHtml = (key, label, hint, checked, extra = '') =>
  `<label class="switch-row"><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ''}</span><input type="checkbox" data-bool="${key}" ${checked ? 'checked' : ''} ${extra}><i class="switch"></i></label>`;

/* ================= ГЛАВНАЯ ================= */
const catTitle = (server, cat) => (catById(server, cat)?.name) || cat;
const entryLine = e => `<button class="mini-item" type="button" data-entry="${e.id}"><b>${pad2(e.server)} · ${esc(e.title || e.catName)}</b><small>${esc(e.nick || '')} ${esc(fmtDate(e.created))}</small></button>`;

const WIDGETS = {
  quick: { title: 'БЫСТРЫЕ ДЕЙСТВИЯ', wide: true, render: () => `<div class="quick-actions">
    <button class="qa" type="button" data-qa="new">＋<span>Новая жалоба</span></button>
    <button class="qa" type="button" data-qa="drafts">▤<span>Черновики · ${Object.keys(D().drafts).length}</span></button>
    <button class="qa" type="button" data-qa="fav">★<span>Избранное · ${D().favorites.length}</span></button></div>` },
  favorites: { title: 'ИЗБРАННОЕ', render: () => D().favorites.length
    ? `<div class="chip-row">${D().favorites.map(k => { const [s, c] = k.split(':'); return `<button class="chip" type="button" data-fav="${k}">★ ${pad2(s)} · ${esc(catTitle(Number(s), c))}</button>`; }).join('')}</div>`
    : '<p class="muted">Нажми ☆ рядом с категорией в разделе «Жалобы», чтобы добавить её сюда.</p>' },
  recent: { title: 'ПОСЛЕДНИЕ ЖАЛОБЫ', render: () => {
    const list = D().history.filter(h => !h.archived).sort((a, b) => b.created - a.created).slice(0, 5);
    return list.length ? list.map(entryLine).join('') : '<p class="muted">Пока пусто. Созданные жалобы появятся здесь.</p>'; } },
  pinned: { title: 'ЗАКРЕПЛЁННЫЕ', render: () => {
    const h = D().history.filter(x => x.pinned && !x.archived).map(entryLine);
    const d = Object.entries(D().drafts).filter(([, v]) => v.pinned).map(([k, v]) => { const [s, c] = k.split(':'); return `<button class="mini-item" type="button" data-draft="${k}"><b>${pad2(s)} · ${esc(catTitle(Number(s), c))}</b><small>Черновик · ${esc(fmtDate(v.updated))}</small></button>`; });
    return [...h, ...d].join('') || '<p class="muted">Закрепи важную запись в «Моих записях» — она будет здесь.</p>'; } },
  stats: { title: 'СТАТИСТИКА', render: () => { const s = D().stats; return `<div class="stat-row"><div><b>${s.generated}</b><span>создано</span></div><div><b>${s.copied}</b><span>копирований</span></div><div><b>${s.opened}</b><span>открытий форума</span></div></div><button class="text-action" type="button" data-open-page="stats">Подробнее <span>→</span></button>`; } },
  news: { title: 'НОВОСТИ', render: () => NEWS.slice(0, 2).map(n => `<div class="news-mini"><b>${esc(n.title)}</b><small>${esc(n.date)}</small><p>${esc(n.text)}</p></div>`).join('') },
  version: { title: 'ВЕРСИЯ', render: () => `<div class="home-version">${APP_VERSION}</div>${updateInfo?.newer ? `<span class="status-line warn"><i></i> Доступна ${esc(updateInfo.tag)}</span><button class="text-action" type="button" data-open-page="updates">Центр обновлений <span>→</span></button>` : `<span class="status-line"><i></i> Установленная версия</span><button class="text-action" type="button" data-open-page="updates">Проверить обновления <span>→</span></button>`}` }
};

function renderHome() {
  $('widget-grid').innerHTML = D().settings.widgets.filter(w => w.on).map(w => {
    const spec = WIDGETS[w.id];
    return `<article class="home-card ${spec.wide ? 'wide' : ''}"><div class="home-card-kicker">${spec.title}</div>${spec.render()}</article>`;
  }).join('') || '<p class="muted">Все виджеты скрыты. Включи их в Настройки → Внешний вид.</p>';
}
PAGE_HOOKS.home = renderHome;

$('widget-grid').addEventListener('click', async e => {
  const qa = e.target.closest('[data-qa]');
  if (qa) {
    if (qa.dataset.qa === 'new') openPage('complaints');
    if (qa.dataset.qa === 'drafts') { recordsState.tab = 'drafts'; openPage('records'); }
    if (qa.dataset.qa === 'fav') {
      const fav = D().favorites;
      if (!fav.length) { showToast('Избранное пусто — добавь категорию звёздочкой в «Жалобах»'); return; }
      if (fav.length === 1) return openFavorite(fav[0]);
      const pick = await uiChoose('Избранное', fav.map(k => { const [s, c] = k.split(':'); return { value: k, label: `${pad2(s)} · ${catTitle(Number(s), c)}` }; }));
      if (pick) openFavorite(pick);
    }
    return;
  }
  const fav = e.target.closest('[data-fav]'); if (fav) return openFavorite(fav.dataset.fav);
  const en = e.target.closest('[data-entry]'); if (en) return openEntry(en.dataset.entry);
  const dr = e.target.closest('[data-draft]'); if (dr) return openDraft(dr.dataset.draft);
});

/* ================= МОИ ЗАПИСИ ================= */
function openEntry(id) {
  const e = D().history.find(h => h.id === id); if (!e) return;
  loadIntoForm({ server: e.server, cat: e.cat, fields: e.fields, note: e.note, text: e.text, entryId: e.id });
}
function openDraft(key) {
  const d = D().drafts[key]; if (!d) return;
  const [s, c] = key.split(':');
  loadIntoForm({ server: Number(s), cat: c, fields: d.fields, note: d.note });
}

function recordItems() {
  const items = [];
  for (const [key, d] of Object.entries(D().drafts)) {
    const [s, c] = key.split(':'); const server = Number(s);
    if (!SCHEMES[server] || !catById(server, c)) continue;
    items.push({ kind: 'draft', id: key, server, cat: c, title: TITLES[c] || catTitle(server, c), text: '', fields: d.fields || {}, note: d.note || '', updated: d.updated, created: d.updated, pinned: !!d.pinned, folder: d.folder || '', archived: false, nick: d.fields?.yourNick || '' });
  }
  for (const h of D().history) items.push({ kind: 'history', id: h.id, server: h.server, cat: h.cat, title: h.title || h.catName, text: h.text || '', fields: h.fields || {}, note: h.note || '', updated: h.updated || h.created, created: h.created, pinned: !!h.pinned, folder: h.folder || '', archived: !!h.archived, nick: h.nick || '' });
  return items;
}

function renderRecords() {
  const sel = $('records-folder');
  sel.innerHTML = `<option value="">Все папки</option><option value="__none">Без папки</option>` + D().folders.map(f2 => `<option value="${esc(f2)}">📁 ${esc(f2)}</option>`).join('');
  if (![...sel.options].some(o => o.value === recordsState.folder)) recordsState.folder = '';
  sel.value = recordsState.folder;
  $('records-search').value = recordsState.q;
  initTabs($('records-tabs'), recordsState.tab, t => { recordsState.tab = t; renderRecords(); });

  const q = recordsState.q.trim().toLowerCase();
  let items = recordItems().filter(it => {
    if (recordsState.tab === 'drafts' && it.kind !== 'draft') return false;
    if (recordsState.tab === 'history' && (it.kind !== 'history' || it.archived)) return false;
    if (recordsState.tab === 'archive' && !it.archived) return false;
    if (recordsState.tab === 'all' && it.archived) return false;
    if (recordsState.folder === '__none' && it.folder) return false;
    if (recordsState.folder && recordsState.folder !== '__none' && it.folder !== recordsState.folder) return false;
    if (q) {
      const hay = [it.title, it.text, it.note, it.nick, it.folder, Object.values(it.fields).join(' ')].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  items.sort((a, b) => (b.pinned - a.pinned) || (b.updated - a.updated));

  $('records-list').innerHTML = items.length ? items.map(it => {
    const snippet = (it.text || it.fields.reason || it.fields.violation || '').replace(/\s+/g, ' ').slice(0, 150);
    const badge = it.archived ? 'Архив' : it.kind === 'draft' ? 'Черновик' : 'Жалоба';
    return `<article class="record ${it.pinned ? 'pinned' : ''}" data-kind="${it.kind}" data-id="${esc(it.id)}">
      <div class="record-top"><b>${it.pinned ? '📌 ' : ''}Сервер ${pad2(it.server)} · ${esc(it.title)}</b><span class="badge ${it.kind}">${badge}</span></div>
      <div class="record-meta">${esc(it.nick)} ${it.nick ? '·' : ''} ${esc(fmtDate(it.updated))}${it.folder ? ` · 📁 ${esc(it.folder)}` : ''}</div>
      ${snippet ? `<p class="record-snippet">${esc(snippet)}${snippet.length >= 150 ? '…' : ''}</p>` : ''}
      ${it.note ? `<p class="record-note">📝 ${esc(it.note)}</p>` : ''}
      <div class="record-actions">
        <button class="ghost-btn" data-act="open" type="button">Открыть</button>
        ${it.kind === 'history' ? '<button class="ghost-btn" data-act="copy" type="button">Копировать</button>' : ''}
        <button class="ghost-btn" data-act="pin" type="button">${it.pinned ? 'Открепить' : 'Закрепить'}</button>
        <button class="ghost-btn" data-act="folder" type="button">В папку</button>
        <button class="ghost-btn" data-act="note" type="button">Заметка</button>
        ${it.kind === 'history' ? `<button class="ghost-btn" data-act="archive" type="button">${it.archived ? 'Вернуть' : 'В архив'}</button>` : ''}
        <button class="ghost-btn danger" data-act="delete" type="button">Удалить</button>
      </div></article>`;
  }).join('') : '<div class="empty-box">Ничего не найдено.</div>';
}
PAGE_HOOKS.records = renderRecords;

$('records-search').addEventListener('input', e => { recordsState.q = e.target.value; renderRecords(); const s = $('records-search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); });
$('records-folder').addEventListener('change', e => { recordsState.folder = e.target.value; renderRecords(); });
$('folder-new').addEventListener('click', async () => {
  const name = await uiPrompt('Новая папка', 'Название папки');
  if (!name) return;
  if (D().folders.includes(name)) return showToast('Такая папка уже есть');
  D().folders.push(name); Store.save(); renderRecords();
});
$('folder-manage').addEventListener('click', () => {
  const draw = () => {
    openModal(`<h3>Папки</h3>${D().folders.length ? D().folders.map((f2, i) => `<div class="folder-row"><span>📁 ${esc(f2)}</span><button class="ghost-btn" data-r="${i}" type="button">Переименовать</button><button class="ghost-btn danger" data-d="${i}" type="button">Удалить</button></div>`).join('') : '<p class="muted">Папок пока нет.</p>'}<div class="modal-actions"><button class="primary-button" id="m-ok" type="button">Закрыть</button></div>`, box => {
      closeModal.onCancel = () => { closeModal.onCancel = null; closeModal(); renderRecords(); };
      box.querySelector('#m-ok').onclick = closeModal.onCancel;
      box.querySelectorAll('[data-r]').forEach(b => b.onclick = async () => {
        const old = D().folders[b.dataset.r];
        const name = await uiPrompt('Переименовать папку', 'Новое название', old);
        if (name && name !== old && !D().folders.includes(name)) {
          D().folders[b.dataset.r] = name;
          D().history.forEach(h => { if (h.folder === old) h.folder = name; });
          Object.values(D().drafts).forEach(d => { if (d.folder === old) d.folder = name; });
          Store.save();
        }
        draw();
      });
      box.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => {
        const old = D().folders[b.dataset.d];
        if (!(await uiConfirm('Удалить папку?', `Записи из папки «${old}» не удалятся — они окажутся без папки.`, 'Удалить'))) return draw();
        D().folders.splice(b.dataset.d, 1);
        D().history.forEach(h => { if (h.folder === old) h.folder = ''; });
        Object.values(D().drafts).forEach(d => { if (d.folder === old) d.folder = ''; });
        Store.save(); draw();
      });
    });
  };
  draw();
});

$('records-list').addEventListener('click', async e => {
  const btn = e.target.closest('[data-act]'); if (!btn) return;
  const card = btn.closest('.record'); const kind = card.dataset.kind; const id = card.dataset.id;
  const rec = kind === 'draft' ? D().drafts[id] : D().history.find(h => h.id === id);
  if (!rec) return;
  const act = btn.dataset.act;
  if (act === 'open') return kind === 'draft' ? openDraft(id) : openEntry(id);
  if (act === 'copy') { if (await copyText(rec.text)) { D().stats.copied++; showToast('Текст скопирован'); } else showToast('Не удалось скопировать'); }
  if (act === 'pin') rec.pinned = !rec.pinned;
  if (act === 'archive') rec.archived = !rec.archived;
  if (act === 'folder') {
    const pick = await uiChoose('Переместить в папку', [{ value: '', label: 'Без папки' }, ...D().folders.map(f2 => ({ value: f2, label: f2 }))], rec.folder || '');
    if (pick === null) return;
    rec.folder = pick;
  }
  if (act === 'note') {
    const v = await uiPrompt('Заметка', 'Текст заметки (в жалобу не попадает)', rec.note || '');
    if (v === null) return;
    rec.note = v;
  }
  if (act === 'delete') {
    if (!(await uiConfirm('Удалить запись?', 'Это действие нельзя отменить.', 'Удалить'))) return;
    if (kind === 'draft') delete D().drafts[id]; else D().history = D().history.filter(h => h.id !== id);
  }
  Store.save(); renderRecords();
});

/* ================= СТАТИСТИКА ================= */
function renderStats() {
  const s = D().stats;
  const days = Math.max(1, Math.ceil((Date.now() - (s.firstRun || Date.now())) / 86400000));
  const topServer = Object.entries(s.perServer).sort((a, b) => b[1] - a[1])[0];
  const topCat = Object.entries(s.perCat).sort((a, b) => b[1] - a[1])[0];
  const max = Math.max(1, ...SERVERS.map(n => s.perServer[n] || 0));
  const archived = D().history.filter(h => h.archived).length;
  $('stats-body').innerHTML = `<div class="eyebrow">ЛОКАЛЬНО · НИКУДА НЕ ОТПРАВЛЯЕТСЯ</div><h1>Статистика</h1>
    <div class="stat-grid">
      <div class="stat"><b>${s.generated}</b><span>жалоб создано</span></div>
      <div class="stat"><b>${s.copied}</b><span>копирований</span></div>
      <div class="stat"><b>${s.opened}</b><span>открытий форума</span></div>
      <div class="stat"><b>${s.launches}</b><span>запусков</span></div>
      <div class="stat"><b>${Object.keys(D().drafts).length}</b><span>черновиков</span></div>
      <div class="stat"><b>${D().history.length - archived}</b><span>в истории</span></div>
      <div class="stat"><b>${archived}</b><span>в архиве</span></div>
      <div class="stat"><b>${days}</b><span>дн. с первого запуска</span></div>
    </div>
    <div class="panel pad"><h2>По серверам</h2>${SERVERS.map(n => `<div class="bar-row"><span>${pad2(n)}</span><div class="bar"><i style="width:${Math.round((s.perServer[n] || 0) / max * 100)}%"></i></div><b>${s.perServer[n] || 0}</b></div>`).join('')}</div>
    <div class="about-facts"><div><span>Чаще всего сервер</span><b>${topServer ? pad2(topServer[0]) : '—'}</b></div><div><span>Частая категория</span><b>${topCat ? esc(catTitle(Number(topCat[0].split(':')[0]), topCat[0].split(':')[1])) : '—'}</b></div></div>`;
}
PAGE_HOOKS.stats = renderStats;

/* ================= ОБНОВЛЕНИЯ ================= */
const verNum = t => String(t || '').replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
function isNewer(a, b) { const x = verNum(a), y = verNum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; }

async function fetchLatest() {
  if (api()?.check_update) return await api().check_update();
  try {
    const r = await fetch('https://api.github.com/repos/L1ton47/Forumnik/releases/latest');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    return { ok: true, tag: j.tag_name, name: j.name, body: j.body || '', url: j.html_url };
  } catch (e) { return { ok: false, error: String(e.message || e) }; }
}

async function checkUpdates(manual) {
  if (manual) { const box = $('update-result'); if (box) box.innerHTML = '<p class="muted">Проверяю…</p>'; }
  const r = await fetchLatest();
  if (r.ok && r.tag) {
    updateInfo = { ...r, newer: isNewer(r.tag, APP_VERSION) };
    $('update-badge').classList.toggle('hidden', !updateInfo.newer);
    if (updateInfo.newer && !runtimeMessages.some(m => m.id === `upd-${r.tag}`)) {
      runtimeMessages.unshift({ id: `upd-${r.tag}`, title: `Доступна версия ${r.tag}`, text: 'Открой «Обновления», чтобы посмотреть, что нового, и скачать её.' });
      updateBell();
      if (!manual) showToast(`Доступна новая версия ${r.tag}`);
    }
  } else if (manual) updateInfo = { error: r.error || 'нет данных' };
  if (currentPage === 'updates') renderUpdates();
  if (currentPage === 'home') renderHome();
}

function renderUpdates() {
  const u = updateInfo;
  let resultHtml = '<p class="muted">Нажми «Проверить обновления», чтобы узнать о новой версии.</p>';
  if (u?.error) resultHtml = `<div class="notice-panel">Не удалось проверить обновления: ${esc(u.error)}. Проверь подключение к интернету.</div>`;
  else if (u?.newer) resultHtml = `<div class="update-card new"><b>Доступна версия ${esc(u.tag)}</b><p>${esc((u.body || '').slice(0, 600)) || 'Описание не указано.'}</p><button class="primary-button" type="button" data-ext-url="${esc(u.url)}">Скачать ↗</button></div>`;
  else if (u) resultHtml = `<div class="update-card"><b>У тебя последняя версия (${APP_VERSION})</b><p>Новых релизов на GitHub нет.</p></div>`;
  $('updates-body').innerHTML = `<div class="eyebrow">ЦЕНТР ОБНОВЛЕНИЙ</div><h1>Обновления</h1>
    <div class="update-top"><div class="home-version">${APP_VERSION}</div><div><b>Установленная версия</b><p class="muted">Автопроверка: ${D().settings.autoCheck ? 'включена' : 'выключена'}</p></div><button class="ghost-btn" id="check-update" type="button">🔍 Проверить обновления</button></div>
    <div id="update-result">${resultHtml}</div>
    <h2 class="sub">История версий</h2>
    <div class="timeline">${CHANGELOG.map((c, i) => `<div class="timeline-item ${i === 0 ? 'current' : ''}"><b>${c.v} · ${esc(c.title)}</b><ul>${c.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
    <a class="external-link" href="${RELEASES_URL}" data-ext>Открыть все релизы на GitHub ↗</a>`;
  $('check-update').onclick = () => checkUpdates(true);
}
PAGE_HOOKS.updates = renderUpdates;
$('updates-body').addEventListener('click', e => { const b = e.target.closest('[data-ext-url]'); if (b) openUrl(b.dataset.extUrl); });

/* ================= ИНФОРМАЦИЯ ================= */
const INFO_TABS = [['about', 'О программе'], ['news', 'Новости'], ['servers', 'Серверы'], ['guide', 'Инструкция'], ['dev', 'Разработчик'], ['links', 'Ссылки'], ['messages', 'Сообщения']];

function contactRow(name, value) {
  if (!value) return `<div class="contact"><b>${name}</b><span class="muted">не указан</span></div>`;
  const isUrl = /^(https?:\/\/|mailto:)/i.test(value);
  return `<div class="contact"><b>${name}</b><span>${esc(value)}</span><button class="ghost-btn" data-copy="${esc(value)}" type="button">Копировать</button>${isUrl ? `<button class="ghost-btn" data-open="${esc(value)}" type="button">Открыть ↗</button>` : ''}</div>`;
}

function renderInfo() {
  const panes = {
    about: `<p>Настольный помощник для подготовки жалоб на форум Radmir. Работает локально: данные не отправляются на сервер Forumnik.</p>
      <div class="about-facts"><div><span>Версия</span><b>${APP_VERSION}</b></div><div><span>Платформа</span><b>Windows</b></div><div><span>Интерфейс</span><b>Русский</b></div><div><span>Разработчик</span><b>${esc(DEVELOPER.name)}</b></div></div>
      <a class="external-link" href="${REPO_URL}" data-ext>Репозиторий проекта ↗</a>`,
    news: NEWS.map(n => `<div class="news-item"><b>${esc(n.title)}</b><small>${esc(n.date)}</small><p>${esc(n.text)}</p></div>`).join(''),
    servers: `<div class="servers-list">${SERVERS.map(n => { const basic = SCHEMES[n].verified === false; return `<div class="srv"><b>${pad2(n)}</b><span>${SCHEMES[n].categories.length} категорий</span><em class="${basic ? 'warn' : 'ok'}">${basic ? 'базовый набор' : 'готов'}</em></div>`; }).join('')}<div class="srv soon"><b>11–21</b><span>—</span><em>скоро</em></div></div>
      <p class="muted">«Базовый набор» — категории по общему образцу; сверяйте их с разделом форума вашего сервера.</p>`,
    guide: `<ol class="guide"><li><b>Выбери сервер и категорию.</b> Каждый сервер использует собственные шаблоны.</li><li><b>Заполни поля.</b> «Заполнить из профиля» подставит ник и подпись. Значок ⧉ копирует отдельное поле.</li><li><b>Сформируй жалобу</b> и при желании отредактируй текст кнопкой «Редактировать».</li><li><b>Нажми «Скопировать и открыть форум».</b> Текст попадёт в буфер, откроется страница форума — останется вставить его в тему.</li><li><b>Не потеряй работу:</b> черновики сохраняются автоматически, все жалобы лежат в «Моих записях».</li></ol>`,
    dev: `<p>Forumnik создаёт и развивает <b>${esc(DEVELOPER.name)}</b>.</p><p class="muted">Предложения и сообщения об ошибках — через контакты или GitHub.</p>
      <h3>Контакты (личные сообщения)</h3>${contactRow('Telegram', DEVELOPER.telegram)}${contactRow('Discord', DEVELOPER.discord)}${contactRow('VK', DEVELOPER.vk)}${contactRow('Email', DEVELOPER.email)}`,
    links: `<div class="links-list">${[...BUILTIN_LINKS, ...D().customLinks].map((l, i) => `<div class="link-card"><div><b>${esc(l.title)}</b><small>${esc(l.desc || l.url)}</small></div><button class="ghost-btn" data-open="${esc(l.url)}" type="button">Открыть ↗</button><button class="ghost-btn" data-copy="${esc(l.url)}" type="button">Копировать</button>${l.custom ? `<button class="ghost-btn danger" data-del-link="${l.id}" type="button">✕</button>` : ''}</div>`).join('')}</div><button class="ghost-btn" id="add-link" type="button">＋ Добавить ссылку</button>`,
    messages: allMessages().map(m => `<div class="msg ${D().readMessages.includes(m.id) ? '' : 'unread'}"><b>${esc(m.title)}</b><p>${esc(m.text)}</p></div>`).join('') || '<p class="muted">Сообщений нет.</p>'
  };
  $('info-body').innerHTML = `<div class="eyebrow">О ПРОЕКТЕ</div><h1>Информация</h1>
    <div class="tabs" id="info-tabs">${INFO_TABS.map(([id, label]) => `<button class="tab" data-tab="${id}" type="button">${label}</button>`).join('')}</div>
    <div class="tab-body">${panes[infoTab]}</div>`;
  initTabs($('info-tabs'), infoTab, t => { infoTab = t; renderInfo(); });
  if (infoTab === 'messages') { allMessages().forEach(m => { if (!D().readMessages.includes(m.id)) D().readMessages.push(m.id); }); Store.save(); updateBell(); }
  const add = $('add-link');
  if (add) add.onclick = async () => {
    const title = await uiPrompt('Новая ссылка', 'Название'); if (!title) return;
    const url = await uiPrompt('Новая ссылка', 'Адрес (https://…)'); if (!url) return;
    if (!/^https?:\/\//i.test(url)) return showToast('Адрес должен начинаться с http:// или https://');
    D().customLinks.push({ id: uid(), title, url, custom: true }); Store.save(); renderInfo();
  };
}
PAGE_HOOKS.info = renderInfo;
$('info-body').addEventListener('click', async e => {
  const o = e.target.closest('[data-open]'); if (o) return openUrl(o.dataset.open);
  const c = e.target.closest('[data-copy]'); if (c) return showToast((await copyText(c.dataset.copy)) ? 'Скопировано' : 'Не удалось скопировать');
  const d = e.target.closest('[data-del-link]');
  if (d) { D().customLinks = D().customLinks.filter(l => l.id !== d.dataset.delLink); Store.save(); renderInfo(); }
  const ext = e.target.closest('a[data-ext]'); if (ext) { e.preventDefault(); openUrl(ext.href); }
});
$('bell-button').addEventListener('click', () => { infoTab = 'messages'; openPage('info'); });

/* ================= НАСТРОЙКИ ================= */
const SETTINGS_TABS = [['look', 'Внешний вид'], ['profiles', 'Профили'], ['behavior', 'Поведение'], ['hotkeys', 'Горячие клавиши'], ['links', 'Ссылки на разделы'], ['backup', 'Резервные копии'], ['data', 'Данные']];
const PRESETS = [['Синий', '#4c8dff', '#0b1220'], ['Зелёный', '#35c58f', '#0a1512'], ['Фиолетовый', '#9a7bff', '#100d1d'], ['Красный', '#ff6b6b', '#160c0e'], ['Оранжевый', '#ff9f43', '#17110a']];
const WIDGET_NAMES = { quick: 'Быстрые действия', favorites: 'Избранное', recent: 'Последние жалобы', pinned: 'Закреплённые', stats: 'Статистика', news: 'Новости', version: 'Версия' };

async function renderSettings() {
  const s = D().settings;
  let pane = '';
  if (settingsTab === 'look') {
    pane = `<div class="panel pad"><h2>Цвета</h2><div class="color-row"><label>Акцент <input type="color" id="c-accent" value="${validHex(s.accent, '#4c8dff')}"></label><label>Фон <input type="color" id="c-bg" value="${validHex(s.bg, '#0b1220')}"></label></div>
      <div class="chip-row">${PRESETS.map((p, i) => `<button class="chip" data-preset="${i}" type="button"><i class="dot" style="background:${p[1]}"></i> ${p[0]}</button>`).join('')}</div></div>
      <div class="panel pad">${switchHtml('animations', 'Анимации интерфейса', 'Плавные переходы и появление страниц', s.animations)}${switchHtml('splash', 'Экран загрузки', 'Показывать заставку при запуске', s.splash)}</div>
      <div class="panel pad"><h2>Главная страница</h2>${s.widgets.map((w, i) => `<div class="widget-row"><label class="check"><input type="checkbox" data-widget="${w.id}" ${w.on ? 'checked' : ''}> ${WIDGET_NAMES[w.id]}</label><span><button class="ghost-btn" data-up="${i}" type="button" ${i === 0 ? 'disabled' : ''}>↑</button><button class="ghost-btn" data-down="${i}" type="button" ${i === s.widgets.length - 1 ? 'disabled' : ''}>↓</button></span></div>`).join('')}</div>`;
  } else if (settingsTab === 'profiles') {
    pane = `<div class="panel pad"><h2>Игровые профили</h2><p class="muted">Хранят ники и подпись для быстрого заполнения форм.</p>
      ${D().profiles.map(p => `<div class="profile-row ${p.id === D().activeProfile ? 'active' : ''}"><div><b>${esc(p.name)}</b><small>${esc(p.nick || '—')} · ${esc(p.realName || 'без имени и фамилии')}</small></div><span><button class="ghost-btn" data-pact="use" data-id="${p.id}" type="button">${p.id === D().activeProfile ? '✓ Активный' : 'Сделать активным'}</button><button class="ghost-btn" data-pact="edit" data-id="${p.id}" type="button">Изменить</button><button class="ghost-btn danger" data-pact="del" data-id="${p.id}" type="button">Удалить</button></span></div>`).join('') || '<p class="muted">Профилей пока нет.</p>'}
      <button class="primary-button" id="profile-add" type="button">＋ Новый профиль</button></div>`;
  } else if (settingsTab === 'behavior') {
    const auto = api()?.get_autostart ? await api().get_autostart() : { ok: false };
    const trayOk = api()?.tray_available ? await api().tray_available() : false;
    pane = `<div class="panel pad">
      ${switchHtml('confirmExit', 'Подтверждать выход', 'Спрашивать, если есть незавершённая жалоба', s.confirmExit)}
      ${switchHtml('saveNotices', 'Уведомления о сохранении', 'Небольшая подсказка «Черновик сохранён» вверху', s.saveNotices)}
      ${switchHtml('autoQuickFill', 'Автоподстановка профиля', 'Подставлять данные активного профиля в пустые формы', s.autoQuickFill)}
      ${switchHtml('autoCopyOnOpen', 'Копировать текст перед открытием форума', '', s.autoCopyOnOpen)}
      ${switchHtml('autoCheck', 'Проверять обновления при запуске', 'Нужен интернет', s.autoCheck)}
      ${switchHtml('tray', 'Сворачивать в системный трей', trayOk ? 'При сворачивании окно прячется в трей' : 'Нужны пакеты pystray и Pillow (pip install -r requirements.txt)', s.tray, trayOk ? '' : 'disabled')}
      ${switchHtml('trayOnClose', 'Кнопка закрытия тоже сворачивает в трей', '', s.trayOnClose, trayOk ? '' : 'disabled')}
      ${switchHtml('autostart', 'Автозапуск вместе с Windows', auto.ok ? '' : 'Доступно только в Windows-версии приложения', !!auto.enabled, auto.ok ? '' : 'disabled')}</div>`;
  } else if (settingsTab === 'hotkeys') {
    pane = `<div class="panel pad"><h2>Горячие клавиши</h2><p class="muted">Нажми на кнопку и затем на новую комбинацию. Esc — отмена.</p>
      ${Object.keys(HOTKEY_LABELS).map(a => `<div class="hk-row"><span>${HOTKEY_LABELS[a]}</span><button class="ghost-btn hk" data-hk="${a}" type="button">${esc(s.hotkeys[a] || '—')}</button></div>`).join('')}
      <button class="ghost-btn" id="hk-reset" type="button">Сбросить по умолчанию</button></div>`;
  } else if (settingsTab === 'links') {
    pane = `<div class="panel pad"><h2>Ссылки на создание тем</h2><p class="muted">Для каждого сервера и категории можно задать свою ссылку. Приоритет: категория → сервер → общая страница форума. Пустое поле = по умолчанию.</p>
      ${SERVERS.map(n => `<details class="srv-links"><summary>Сервер ${pad2(n)}</summary><label class="mini-label">Ссылка на сервер целиком</label><input class="field-control" data-link="${n}" value="${esc(D().links[n] || '')}" placeholder="${esc(SERVER_LINKS[n] || FORUM_ROOT)}">
        ${SCHEMES[n].categories.map(c => `<label class="mini-label">${esc(c.name)}</label><input class="field-control" data-link="${n}:${c.id}" value="${esc(D().links[`${n}:${c.id}`] || '')}" placeholder="${esc(CATEGORY_LINKS[`${n}:${c.id}`] || 'как у сервера')}">`).join('')}</details>`).join('')}</div>`;
  } else if (settingsTab === 'backup') {
    const b = s.backup;
    const list = api()?.list_backups ? await api().list_backups() : null;
    pane = `<div class="panel pad">${switchHtml('backup.onStart', 'Копия при запуске', '', b.onStart)}${switchHtml('backup.onExit', 'Копия при выходе', '', b.onExit)}
      <div class="hk-row"><span>Хранить копий</span><input class="field-control narrow" type="number" min="1" max="100" id="backup-keep" value="${b.keep}"></div></div>
      <div class="panel pad"><div class="row-gap"><h2>Копии</h2><button class="primary-button" id="backup-now" type="button">Создать копию сейчас</button><button class="ghost-btn" id="open-folder" type="button">Открыть папку</button></div>
      ${list === null ? '<p class="muted">Резервные копии доступны в установленном приложении.</p>' : (list.length ? list.map(x => `<div class="profile-row"><div><b>${esc(x.created)}</b><small>${esc(x.reason)} · ${x.size} КБ</small></div><span><button class="ghost-btn" data-bk="restore" data-name="${esc(x.name)}" type="button">Восстановить</button><button class="ghost-btn danger" data-bk="del" data-name="${esc(x.name)}" type="button">Удалить</button></span></div>`).join('') : '<p class="muted">Копий пока нет.</p>')}</div>`;
  } else {
    const info = api()?.get_data_info ? await api().get_data_info() : null;
    pane = `<div class="panel pad"><h2>Экспорт и импорт настроек</h2><p class="muted">В файл попадают оформление, профили, избранное, папки и ссылки. Записи и история сохраняются резервными копиями.</p><div class="row-gap"><button class="ghost-btn" id="export-settings" type="button">📦 Экспорт настроек</button><button class="ghost-btn" id="import-settings" type="button">Импорт настроек</button></div></div>
      <div class="panel pad"><h2>Управление данными</h2>${info ? `<p class="muted">Папка данных: ${esc(info.dir)} · ${info.size} КБ</p>` : ''}
      <div class="row-gap wrap"><button class="ghost-btn" data-clear="drafts" type="button">Очистить черновики</button><button class="ghost-btn" data-clear="history" type="button">Очистить историю</button><button class="ghost-btn" data-clear="archive" type="button">Очистить архив</button><button class="ghost-btn danger" data-clear="settings" type="button">Сбросить настройки</button></div></div>`;
  }
  $('settings-body').innerHTML = `<div class="eyebrow">ПАРАМЕТРЫ</div><h1>Настройки</h1>
    <div class="tabs" id="settings-tabs">${SETTINGS_TABS.map(([id, l]) => `<button class="tab" data-tab="${id}" type="button">${l}</button>`).join('')}</div><div class="tab-body">${pane}</div>`;
  initTabs($('settings-tabs'), settingsTab, t => { settingsTab = t; renderSettings(); });
}
PAGE_HOOKS.settings = renderSettings;

function refreshAfterDataChange() {
  applyTheme(); renderProfileSelect(); updateFavUI(); updateBell();
  if (!SERVERS.includes(selectedServer)) selectedServer = 1;
  PAGE_HOOKS[currentPage]?.();
}

function profileModal(p) {
  const data = p || { name: '', nick: '', realName: '', signature: '' };
  openModal(`<h3>${p ? 'Изменить профиль' : 'Новый профиль'}</h3>
    <label class="mini-label">Название профиля</label><input class="field-control" id="p-name" value="${esc(data.name)}" placeholder="Основной">
    <label class="mini-label">Игровой ник</label><input class="field-control" id="p-nick" value="${esc(data.nick)}" placeholder="Nick_Name">
    <label class="mini-label">Имя Фамилия (для заявлений и строки «От»)</label><input class="field-control" id="p-real" value="${esc(data.realName)}">
    <label class="mini-label">Подпись (если пусто — имя Фамилия или ник)</label><input class="field-control" id="p-sign" value="${esc(data.signature)}">
    <div class="modal-actions"><button class="ghost-btn" id="m-cancel" type="button">Отмена</button><button class="primary-button" id="m-ok" type="button">Сохранить</button></div>`, box => {
    closeModal.onCancel = () => { closeModal.onCancel = null; closeModal(); };
    box.querySelector('#m-cancel').onclick = closeModal.onCancel;
    box.querySelector('#m-ok').onclick = () => {
      const name = box.querySelector('#p-name').value.trim() || box.querySelector('#p-nick').value.trim();
      if (!name) return showToast('Укажи название или ник');
      const rec = { name, nick: box.querySelector('#p-nick').value.trim(), realName: box.querySelector('#p-real').value.trim(), signature: box.querySelector('#p-sign').value.trim() };
      if (p) Object.assign(p, rec); else { const np = { id: uid(), ...rec }; D().profiles.push(np); if (!D().activeProfile) D().activeProfile = np.id; }
      Store.save(); closeModal.onCancel = null; closeModal(); renderProfileSelect(); renderSettings();
    };
  });
}

const settingsBody = $('settings-body');
settingsBody.addEventListener('change', async e => {
  const t = e.target; const s = D().settings;
  if (t.dataset.bool) {
    const key = t.dataset.bool;
    if (key.startsWith('backup.')) s.backup[key.split('.')[1]] = t.checked;
    else if (key === 'autostart') { const r = await api()?.set_autostart(t.checked); if (!r?.ok) { t.checked = !t.checked; showToast(r?.error || 'Не удалось изменить автозапуск'); } else showToast(t.checked ? 'Автозапуск включён' : 'Автозапуск выключен'); return; }
    else s[key] = t.checked;
    if (key === 'animations') applyTheme();
    Store.save(); if (key === 'tray' || key === 'trayOnClose') Store.persistNow();
  } else if (t.id === 'c-accent') { s.accent = t.value; applyTheme(); Store.save(); }
  else if (t.id === 'c-bg') { s.bg = t.value; applyTheme(); Store.save(); }
  else if (t.dataset.widget) { s.widgets.find(w => w.id === t.dataset.widget).on = t.checked; Store.save(); }
  else if (t.id === 'backup-keep') { s.backup.keep = Math.min(100, Math.max(1, parseInt(t.value, 10) || 10)); Store.save(); }
  else if (t.dataset.link) {
    const v = t.value.trim();
    if (v && !/^https?:\/\//i.test(v)) { showToast('Ссылка должна начинаться с http:// или https://'); t.value = D().links[t.dataset.link] || ''; return; }
    if (v) D().links[t.dataset.link] = v; else delete D().links[t.dataset.link];
    Store.save(); showToast('Ссылка сохранена');
  }
});

settingsBody.addEventListener('click', async e => {
  const s = D().settings; const t = e.target;
  const preset = t.closest('[data-preset]');
  if (preset) { const p = PRESETS[preset.dataset.preset]; s.accent = p[1]; s.bg = p[2]; applyTheme(); Store.save(); return renderSettings(); }
  const up = t.closest('[data-up]'), down = t.closest('[data-down]');
  if (up || down) { const i = Number((up || down).dataset.up ?? (up || down).dataset.down); const j = up ? i - 1 : i + 1; [s.widgets[i], s.widgets[j]] = [s.widgets[j], s.widgets[i]]; Store.save(); return renderSettings(); }
  if (t.closest('#profile-add')) return profileModal(null);
  const pa = t.closest('[data-pact]');
  if (pa) {
    const p = D().profiles.find(x => x.id === pa.dataset.id); if (!p) return;
    if (pa.dataset.pact === 'use') { D().activeProfile = p.id; Store.save(); renderProfileSelect(); return renderSettings(); }
    if (pa.dataset.pact === 'edit') return profileModal(p);
    if (pa.dataset.pact === 'del') {
      if (!(await uiConfirm('Удалить профиль?', `Профиль «${p.name}» будет удалён.`, 'Удалить'))) return;
      D().profiles = D().profiles.filter(x => x.id !== p.id);
      if (D().activeProfile === p.id) D().activeProfile = D().profiles[0]?.id || null;
      Store.save(); renderProfileSelect(); return renderSettings();
    }
  }
  const hk = t.closest('[data-hk]');
  if (hk) {
    document.body.dataset.capturing = '1'; hk.textContent = 'Нажми комбинацию…';
    const handler = ev => {
      ev.preventDefault(); ev.stopPropagation();
      if (ev.key === 'Escape') { finish(null); return; }
      const combo = comboFromEvent(ev); if (!combo) return;
      if (!/^(Ctrl|Alt)\+/.test(combo) && !/^F\d+$/.test(combo)) { showToast('Добавь Ctrl или Alt, чтобы не мешать вводу текста'); return; }
      const clash = Object.keys(s.hotkeys).find(a => a !== hk.dataset.hk && s.hotkeys[a] === combo);
      if (clash) { showToast(`Уже занято: ${HOTKEY_LABELS[clash]}`); return; }
      finish(combo);
    };
    const finish = combo => { document.removeEventListener('keydown', handler, true); delete document.body.dataset.capturing; if (combo) { s.hotkeys[hk.dataset.hk] = combo; Store.save(); } renderSettings(); };
    document.addEventListener('keydown', handler, true); return;
  }
  if (t.closest('#hk-reset')) { s.hotkeys = Store.defaults().settings.hotkeys; Store.save(); return renderSettings(); }
  if (t.closest('#backup-now')) { const r = await api()?.create_backup('manual'); showToast(r?.ok ? 'Резервная копия создана' : (r?.error || 'Не удалось создать копию')); return renderSettings(); }
  if (t.closest('#open-folder')) return api()?.open_data_folder();
  const bk = t.closest('[data-bk]');
  if (bk) {
    if (bk.dataset.bk === 'del') { await api().delete_backup(bk.dataset.name); return renderSettings(); }
    if (!(await uiConfirm('Восстановить копию?', 'Текущие данные будут заменены данными из копии. Перед этим будет создана страховочная копия.', 'Восстановить'))) return;
    const r = await api().restore_backup(bk.dataset.name);
    if (!r?.ok) return showToast(r?.error || 'Не удалось восстановить');
    Store.replaceAll(JSON.parse(r.text)); showToast('Данные восстановлены'); return refreshAfterDataChange();
  }
  if (t.closest('#export-settings')) {
    const d = D();
    const payload = JSON.stringify({ app: 'Forumnik', version: APP_VERSION, kind: 'settings', settings: d.settings, profiles: d.profiles, activeProfile: d.activeProfile, favorites: d.favorites, folders: d.folders, links: d.links, customLinks: d.customLinks }, null, 2);
    const r = await api()?.save_text_file(payload, 'Forumnik_settings.json');
    if (r?.ok) showToast('Настройки экспортированы'); else if (!r?.cancelled) showToast(r?.error || 'Экспорт доступен в установленном приложении');
    return;
  }
  if (t.closest('#import-settings')) {
    const r = await api()?.open_text_file();
    if (!r?.ok) { if (!r?.cancelled) showToast(r?.error || 'Импорт доступен в установленном приложении'); return; }
    try {
      const j = JSON.parse(r.text);
      if (j.app !== 'Forumnik' || j.kind !== 'settings') throw new Error('bad');
      const d = D();
      const next = { ...d, settings: j.settings || d.settings, profiles: j.profiles || [], activeProfile: j.activeProfile || null, favorites: j.favorites || [], folders: j.folders || [], links: j.links || {}, customLinks: j.customLinks || [] };
      Store.replaceAll(next); showToast('Настройки импортированы'); refreshAfterDataChange();
    } catch (err) { showToast('Файл не похож на экспорт настроек Forumnik'); }
    return;
  }
  const clr = t.closest('[data-clear]');
  if (clr) {
    const what = clr.dataset.clear;
    const names = { drafts: 'все черновики', history: 'всю историю (кроме архива)', archive: 'весь архив', settings: 'все настройки (записи останутся)' };
    if (!(await uiConfirm('Подтверди действие', `Будут удалены: ${names[what]}. Это нельзя отменить.`, 'Удалить'))) return;
    if (what === 'drafts') D().drafts = {};
    if (what === 'history') D().history = D().history.filter(h => h.archived);
    if (what === 'archive') D().history = D().history.filter(h => !h.archived);
    if (what === 'settings') { D().settings = Store.defaults().settings; Store.persistNow(); }
    Store.save(); showToast('Готово'); refreshAfterDataChange();
  }
});

/* ================= ЗАПУСК ================= */
async function boot() {
  const started = Date.now();
  await Store.init();
  D().stats.launches++;
  applyTheme();
  selectedServer = SERVERS.includes(D().session.server) ? D().session.server : 1;
  renderServerGrid(); renderCategories(); renderProfileSelect();
  updateBell();
  Store.persistNow();
  if (api()?.create_backup && D().settings.backup.onStart) api().create_backup('start');

  openPage(location.hash.slice(1) || 'home', false);

  const wait = D().settings.splash ? Math.max(0, 900 - (Date.now() - started)) : 0;
  if (D().settings.splash) setTimeout(() => { $('splash').classList.add('gone'); setTimeout(() => $('splash').remove(), 500); }, wait);
  else $('splash').remove();

  // восстановление после сбоя / незавершённого выхода
  const ses = D().session;
  if (ses && ses.clean === false && ses.fields && SCHEMES[ses.server] && catById(ses.server, ses.cat)) {
    const has = Object.values(ses.fields).some(v => String(v || '').trim());
    if (has) {
      setTimeout(async () => {
        const ok = await uiConfirm('Продолжить работу?', `В прошлый раз осталась незавершённая жалоба (сервер ${pad2(ses.server)}, ${catTitle(ses.server, ses.cat)}). Открыть её?`, 'Открыть');
        if (ok) loadIntoForm({ server: ses.server, cat: ses.cat, fields: ses.fields, note: ses.note });
        D().session.clean = true; setDirty(false); Store.save();
      }, wait + 200);
    } else { D().session.clean = true; Store.save(); }
  }

  if (D().settings.autoCheck) setTimeout(() => checkUpdates(false), 2500);
}
boot();
