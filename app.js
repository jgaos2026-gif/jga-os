/* jga-os — Business in a Box
   Full interactive web-desktop engine
   ──────────────────────────────────── */

// ── State ─────────────────────────────────────────────────────────────────────
let zCounter = 20;
const windows = {};   // id → { el, tbBtn, app }

// Persistent data stored in localStorage
const store = {
  get(key, def) {
    try { const v = localStorage.getItem('jgaos_' + key); return v ? JSON.parse(v) : def; }
    catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('jgaos_' + key, JSON.stringify(val)); } catch {}
  }
};

// ── Unique IDs ─────────────────────────────────────────────────────────────────
let _uid = 0;
function uid() { return 'win_' + (++_uid); }

// ── DOM refs ──────────────────────────────────────────────────────────────────
const windowLayer = document.getElementById('window-layer');
const taskbarApps = document.getElementById('taskbar-apps');
const startMenu   = document.getElementById('start-menu');
const ctxMenu     = document.getElementById('context-menu');

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('taskbar-clock').textContent =
    now.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' }) +
    '  ' +
    now.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit' });
}
updateClock();
setInterval(updateClock, 10000);

// ── Window Manager ────────────────────────────────────────────────────────────
function createWindow(appId, title, buildContent, opts = {}) {
  const id = uid();
  const el = document.createElement('div');
  el.className = 'os-window focused';
  el.id = id;

  // Default position (cascade)
  const offset = Object.keys(windows).length * 28;
  const w = opts.width  || 520;
  const h = opts.height || 380;
  const maxL = Math.max(0, window.innerWidth  - w - 60);
  const maxT = Math.max(0, window.innerHeight - h - 80);
  const left = Math.min(140 + offset, maxL);
  const top  = Math.min(60  + offset, maxT);

  el.style.cssText = `width:${w}px;height:${h}px;left:${left}px;top:${top}px;z-index:${++zCounter}`;

  el.innerHTML = `
    <div class="win-titlebar">
      <div class="win-traffic">
        <button class="win-btn close" title="Close">✕</button>
        <button class="win-btn min"   title="Minimise">−</button>
        <button class="win-btn max"   title="Maximise">⤢</button>
      </div>
      <div class="win-title">${title}</div>
    </div>
    <div class="win-body"></div>`;

  buildContent(el.querySelector('.win-body'));
  windowLayer.appendChild(el);

  // Taskbar button
  const tbBtn = document.createElement('button');
  tbBtn.className = 'tb-app-btn active';
  tbBtn.textContent = title;
  tbBtn.title = title;
  taskbarApps.appendChild(tbBtn);

  const entry = { el, tbBtn, app: appId, minimized: false, maximized: false, savedRect: null };
  windows[id] = entry;

  // Focus on click
  el.addEventListener('mousedown', () => focusWindow(id));

  // Drag
  makeDraggable(el.querySelector('.win-titlebar'), el);

  // Traffic buttons
  el.querySelector('.win-btn.close').addEventListener('click', () => closeWindow(id));
  el.querySelector('.win-btn.min').addEventListener('click', () => minimiseWindow(id));
  el.querySelector('.win-btn.max').addEventListener('click', () => maximiseWindow(id));

  // Taskbar toggle
  tbBtn.addEventListener('click', () => {
    if (entry.minimized) {
      entry.minimized = false;
      el.classList.remove('minimized');
      focusWindow(id);
    } else if (isFocused(id)) {
      minimiseWindow(id);
    } else {
      focusWindow(id);
    }
  });

  focusWindow(id);
  return id;
}

function focusWindow(id) {
  const entry = windows[id];
  if (!entry) return;
  Object.values(windows).forEach(w => {
    w.el.classList.remove('focused');
    w.tbBtn.classList.remove('active');
  });
  entry.el.classList.add('focused');
  entry.tbBtn.classList.add('active');
  entry.el.style.zIndex = ++zCounter;
}

function isFocused(id) {
  return windows[id]?.el.classList.contains('focused');
}

function closeWindow(id) {
  const entry = windows[id];
  if (!entry) return;
  entry.el.remove();
  entry.tbBtn.remove();
  delete windows[id];
}

function minimiseWindow(id) {
  const entry = windows[id];
  if (!entry) return;
  entry.minimized = true;
  entry.el.classList.add('minimized');
  entry.tbBtn.classList.remove('active');
}

function maximiseWindow(id) {
  const entry = windows[id];
  if (!entry) return;
  if (!entry.maximized) {
    entry.savedRect = {
      left: entry.el.style.left, top: entry.el.style.top,
      width: entry.el.style.width, height: entry.el.style.height
    };
    entry.el.style.cssText += ';left:0;top:0;width:100vw;height:calc(100vh - 42px);border-radius:0';
    entry.maximized = true;
  } else {
    const r = entry.savedRect;
    entry.el.style.left = r.left; entry.el.style.top = r.top;
    entry.el.style.width = r.width; entry.el.style.height = r.height;
    entry.el.style.borderRadius = '';
    entry.maximized = false;
  }
}

// ── Drag ──────────────────────────────────────────────────────────────────────
function makeDraggable(handle, target) {
  let ox, oy, dragging = false;

  handle.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const rect = target.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    dragging = true;
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const nx = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - target.offsetWidth));
    const ny = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - target.offsetHeight - 42));
    target.style.left = nx + 'px';
    target.style.top  = ny + 'px';
  });

  document.addEventListener('mouseup', () => { dragging = false; });

  // Touch drag
  handle.addEventListener('touchstart', e => {
    const t = e.touches[0];
    const rect = target.getBoundingClientRect();
    ox = t.clientX - rect.left; oy = t.clientY - rect.top;
    dragging = true;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    const t = e.touches[0];
    target.style.left = Math.max(0, t.clientX - ox) + 'px';
    target.style.top  = Math.max(0, t.clientY - oy) + 'px';
  }, { passive: true });

  document.addEventListener('touchend', () => { dragging = false; });
}

// ── App Launcher ──────────────────────────────────────────────────────────────
const appDefs = {
  notes:      { title: '📝 Notes',      fn: buildNotes,      w: 480, h: 360 },
  todo:       { title: '✅ Todo',        fn: buildTodo,       w: 380, h: 440 },
  calendar:   { title: '📅 Calendar',   fn: buildCalendar,   w: 360, h: 340 },
  calculator: { title: '🔢 Calculator', fn: buildCalculator, w: 280, h: 380 },
  files:      { title: '📁 Files',      fn: buildFiles,      w: 480, h: 340 },
  browser:    { title: '🌐 Browser',    fn: buildBrowser,    w: 540, h: 380 },
  contacts:   { title: '👥 Contacts',   fn: buildContacts,   w: 400, h: 420 },
  settings:   { title: '⚙️ Settings',   fn: buildSettings,   w: 400, h: 360 },
  about:      { title: 'ℹ️ About',      fn: buildAbout,      w: 340, h: 280 },
};

function launchApp(appId) {
  const def = appDefs[appId];
  if (!def) return;
  // Bring to front if already open (for single-instance apps)
  const existing = Object.entries(windows).find(([,v]) => v.app === appId);
  if (existing) {
    const [id, entry] = existing;
    if (entry.minimized) { entry.minimized = false; entry.el.classList.remove('minimized'); }
    focusWindow(id);
    return;
  }
  createWindow(appId, def.title, def.fn, { width: def.w, height: def.h });
}

// ── Desktop icon double-click ──────────────────────────────────────────────────
document.querySelectorAll('.desktop-icon').forEach(icon => {
  let clicks = 0, timer;
  icon.addEventListener('click', () => {
    clicks++;
    if (clicks === 1) {
      icon.classList.add('selected');
      timer = setTimeout(() => { clicks = 0; }, 400);
    } else {
      clearTimeout(timer);
      clicks = 0;
      launchApp(icon.dataset.app);
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.desktop-icon'))
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
});

// ── Start menu ────────────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', e => {
  e.stopPropagation();
  startMenu.classList.toggle('open');
  hideContextMenu();
});

document.querySelectorAll('.start-app').forEach(btn => {
  btn.addEventListener('click', () => {
    launchApp(btn.dataset.app);
    startMenu.classList.remove('open');
  });
});

document.addEventListener('click', () => startMenu.classList.remove('open'));

// ── Context menu ──────────────────────────────────────────────────────────────
function hideContextMenu() { ctxMenu.classList.remove('visible'); }

document.getElementById('desktop').addEventListener('contextmenu', e => {
  if (e.target.closest('.os-window') || e.target.closest('#taskbar') || e.target.closest('#start-menu')) return;
  e.preventDefault();
  const x = Math.min(e.clientX, window.innerWidth  - ctxMenu.offsetWidth  - 8);
  const y = Math.min(e.clientY, window.innerHeight - ctxMenu.offsetHeight - 8);
  ctxMenu.style.left = x + 'px';
  ctxMenu.style.top  = y + 'px';
  ctxMenu.classList.add('visible');
  startMenu.classList.remove('open');
});

document.addEventListener('click', hideContextMenu);

ctxMenu.querySelectorAll('.ctx-item').forEach(item => {
  item.addEventListener('click', e => {
    e.stopPropagation();
    const a = item.dataset.action;
    if (a === 'new-note')  launchApp('notes');
    if (a === 'new-todo')  launchApp('todo');
    if (a === 'settings')  launchApp('settings');
    if (a === 'about')     launchApp('about');
    hideContextMenu();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  App Builders
// ═══════════════════════════════════════════════════════════════════════════════

// ── Notes ─────────────────────────────────────────────────────────────────────
function buildNotes(body) {
  const saved = store.get('notes', '');
  body.style.padding = '0';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.height = '100%';

  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid rgba(55,65,81,0.5);flex-shrink:0';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save';
  saveBtn.className = 'todo-add-btn';
  saveBtn.style.fontSize = '0.75rem';

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '🗑 Clear';
  clearBtn.className = 'todo-clear-btn';
  clearBtn.style.fontSize = '0.75rem';

  const statusTxt = document.createElement('span');
  statusTxt.style.cssText = 'font-size:0.72rem;color:#64748b;align-self:center;margin-left:auto';

  toolbar.append(saveBtn, clearBtn, statusTxt);
  body.appendChild(toolbar);

  const ta = document.createElement('textarea');
  ta.className = 'notes-area';
  ta.placeholder = 'Start typing your note…';
  ta.value = saved;
  ta.style.cssText = 'flex:1;padding:1rem;margin:0;border-radius:0';
  body.appendChild(ta);

  saveBtn.addEventListener('click', () => {
    store.set('notes', ta.value);
    statusTxt.textContent = 'Saved ✓';
    setTimeout(() => { statusTxt.textContent = ''; }, 1500);
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Clear all notes?')) { ta.value = ''; store.set('notes', ''); }
  });

  ta.addEventListener('input', () => {
    statusTxt.textContent = ta.value.length + ' chars';
  });

  statusTxt.textContent = saved.length ? saved.length + ' chars' : '';
}

// ── Todo ──────────────────────────────────────────────────────────────────────
function buildTodo(body) {
  let items = store.get('todos', []);

  function render() {
    store.set('todos', items);
    list.innerHTML = '';
    const filtered = items.filter(t => t.text.toLowerCase().includes(filterInput.value.toLowerCase()));
    filtered.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (item.done ? ' done' : '');
      const realIdx = items.indexOf(item);
      li.innerHTML = `
        <input type="checkbox" id="tc${realIdx}" ${item.done ? 'checked' : ''}>
        <label for="tc${realIdx}">${escHtml(item.text)}</label>
        <button class="todo-del" title="Delete">✕</button>`;
      li.querySelector('input').addEventListener('change', e => {
        items[realIdx].done = e.target.checked;
        render();
      });
      li.querySelector('.todo-del').addEventListener('click', () => {
        items.splice(realIdx, 1);
        render();
      });
      list.appendChild(li);
    });
    const done = items.filter(t => t.done).length;
    counter.textContent = `${done}/${items.length} done`;
  }

  const row = document.createElement('div');
  row.className = 'todo-input-row';
  const inp = document.createElement('input');
  inp.className = 'todo-input';
  inp.placeholder = 'Add a task…';
  const addBtn = document.createElement('button');
  addBtn.className = 'todo-add-btn';
  addBtn.textContent = '+';
  row.append(inp, addBtn);

  const filterRow = document.createElement('div');
  filterRow.style.cssText = 'display:flex;gap:6px;margin-bottom:8px';
  const filterInput = document.createElement('input');
  filterInput.className = 'todo-input';
  filterInput.placeholder = '🔍 Filter…';
  filterInput.style.fontSize = '0.78rem';
  const clearDone = document.createElement('button');
  clearDone.className = 'todo-clear-btn';
  clearDone.textContent = 'Clear done';
  clearDone.style.fontSize = '0.72rem';
  filterRow.append(filterInput, clearDone);

  const counter = document.createElement('div');
  counter.style.cssText = 'font-size:0.72rem;color:#64748b;margin-bottom:6px';

  const list = document.createElement('ul');
  list.className = 'todo-list';

  addBtn.addEventListener('click', () => {
    const t = inp.value.trim();
    if (!t) return;
    items.push({ text: t, done: false });
    inp.value = '';
    render();
  });

  inp.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

  filterInput.addEventListener('input', render);

  clearDone.addEventListener('click', () => {
    items = items.filter(t => !t.done);
    render();
  });

  body.append(row, filterRow, counter, list);
  render();
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function buildCalendar(body) {
  let cur = new Date();
  const today = new Date();

  function render() {
    body.innerHTML = '';
    const year = cur.getFullYear();
    const month = cur.getMonth();
    const label = cur.toLocaleString('default', { month: 'long', year: 'numeric' });

    const hdr = document.createElement('div');
    hdr.className = 'cal-header';
    const prev = document.createElement('button');
    prev.className = 'cal-nav'; prev.textContent = '‹';
    const next = document.createElement('button');
    next.className = 'cal-nav'; next.textContent = '›';
    const h2 = document.createElement('h2');
    h2.textContent = label;
    hdr.append(prev, h2, next);
    body.appendChild(hdr);

    prev.addEventListener('click', () => { cur = new Date(year, month - 1, 1); render(); });
    next.addEventListener('click', () => { cur = new Date(year, month + 1, 1); render(); });

    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const dn = document.createElement('div');
      dn.className = 'cal-day-name';
      dn.textContent = d;
      grid.appendChild(dn);
    });

    const first = new Date(year, month, 1).getDay();
    const days  = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    for (let i = 0; i < first; i++) {
      const d = document.createElement('div');
      d.className = 'cal-day other-month';
      d.textContent = prevDays - first + 1 + i;
      grid.appendChild(d);
    }

    for (let d = 1; d <= days; d++) {
      const el = document.createElement('div');
      el.className = 'cal-day';
      el.textContent = d;
      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear())
        el.classList.add('today');
      grid.appendChild(el);
    }

    const remaining = 42 - first - days;
    for (let d = 1; d <= remaining; d++) {
      const el = document.createElement('div');
      el.className = 'cal-day other-month';
      el.textContent = d;
      grid.appendChild(el);
    }

    body.appendChild(grid);
  }

  render();
}

// ── Calculator ────────────────────────────────────────────────────────────────
function buildCalculator(body) {
  let expr = '';
  let justEvaled = false;

  body.style.display = 'flex';
  body.style.flexDirection = 'column';

  const display = document.createElement('div');
  display.className = 'calc-display';
  display.innerHTML = '<div class="calc-expr"></div><div class="calc-val">0</div>';
  body.appendChild(display);

  const exprEl = display.querySelector('.calc-expr');
  const valEl  = display.querySelector('.calc-val');

  const btns = [
    ['C','±','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','−'],
    ['1','2','3','+'],
    ['0','.',  '⌫','='],
  ];

  const grid = document.createElement('div');
  grid.className = 'calc-grid';
  body.appendChild(grid);

  btns.forEach(row => {
    row.forEach(lbl => {
      const b = document.createElement('button');
      b.className = 'calc-btn';
      b.textContent = lbl;
      if ('÷×−+'.includes(lbl)) b.classList.add('op');
      if (lbl === '=')           b.classList.add('eq');
      if (lbl === 'C')           b.classList.add('clr');
      b.addEventListener('click', () => press(lbl));
      grid.appendChild(b);
    });
  });

  function press(k) {
    if (k === 'C') {
      expr = ''; valEl.textContent = '0'; exprEl.textContent = ''; justEvaled = false; return;
    }
    if (k === '⌫') {
      expr = expr.slice(0,-1); valEl.textContent = expr || '0'; exprEl.textContent = ''; return;
    }
    if (k === '±') {
      if (expr.startsWith('-')) expr = expr.slice(1); else expr = '-' + expr;
      valEl.textContent = expr || '0'; return;
    }
    if (k === '=') {
      try {
        const sanitized = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
        const result = Function('"use strict"; return (' + sanitized + ')')();
        exprEl.textContent = expr + ' =';
        expr = String(parseFloat(result.toFixed(10)));
        valEl.textContent = expr;
        justEvaled = true;
      } catch { valEl.textContent = 'Error'; expr = ''; }
      return;
    }
    if (k === '%') {
      try {
        const sanitized = expr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
        const result = Function('"use strict"; return (' + sanitized + ')')();
        expr = String(result / 100);
        valEl.textContent = expr;
      } catch {}
      return;
    }
    if (justEvaled && !'÷×−+'.includes(k)) { expr = ''; justEvaled = false; }
    else justEvaled = false;
    expr += k;
    valEl.textContent = expr;
  }
}

// ── Files ─────────────────────────────────────────────────────────────────────
function buildFiles(body) {
  const fs = {
    '/': [
      { name: 'Documents', type: 'folder' },
      { name: 'Downloads', type: 'folder' },
      { name: 'Projects',  type: 'folder' },
      { name: 'readme.txt', type: 'file', ext: 'txt' },
      { name: 'logo.png',   type: 'file', ext: 'img' },
    ],
    '/Documents': [
      { name: 'Report Q1.docx',  type: 'file', ext: 'doc' },
      { name: 'Budget 2026.xlsx', type: 'file', ext: 'xls' },
      { name: 'Proposal.pdf',    type: 'file', ext: 'pdf' },
    ],
    '/Downloads': [
      { name: 'installer.dmg', type: 'file', ext: 'pkg' },
      { name: 'photo.jpg',     type: 'file', ext: 'img' },
    ],
    '/Projects': [
      { name: 'jga-os', type: 'folder' },
      { name: 'website', type: 'folder' },
    ],
  };

  let cwd = '/';

  const extIcons = { txt:'📄', doc:'📝', xls:'📊', pdf:'📕', img:'🖼', pkg:'📦' };

  function render() {
    body.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'file-toolbar';

    const backBtn = document.createElement('button');
    backBtn.className = 'cal-nav';
    backBtn.textContent = '‹';
    backBtn.disabled = cwd === '/';

    const pathEl = document.createElement('div');
    pathEl.className = 'file-path';
    pathEl.textContent = cwd;

    toolbar.append(backBtn, pathEl);
    body.appendChild(toolbar);

    backBtn.addEventListener('click', () => {
      if (cwd === '/') return;
      cwd = cwd.split('/').slice(0, -1).join('/') || '/';
      render();
    });

    const grid = document.createElement('div');
    grid.className = 'file-grid';

    const entries = fs[cwd] || [];
    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'file-item';
      const icon = entry.type === 'folder' ? '📁' : (extIcons[entry.ext] || '📄');
      item.innerHTML = `<div class="file-icon">${icon}</div><span>${escHtml(entry.name)}</span>`;
      item.addEventListener('dblclick', () => {
        if (entry.type === 'folder') {
          cwd = (cwd === '/' ? '' : cwd) + '/' + entry.name;
          render();
        }
      });
      item.addEventListener('click', () => {
        grid.querySelectorAll('.file-item').forEach(i => i.style.background = '');
        item.style.background = 'rgba(59,130,246,0.22)';
      });
      grid.appendChild(item);
    });

    body.appendChild(grid);
  }

  render();
}

// ── Browser ───────────────────────────────────────────────────────────────────
function buildBrowser(body) {
  const sites = {
    'jga-os':     { title: 'jga-os Home', html: `<div class="about-content"><div class="about-logo">🖥️</div><h1>jga-os</h1><p>Business in a Box — running in your browser.</p><span class="about-version">v1.0.0</span></div>` },
    'news':       { title: 'News', html: `<h3 style="color:#e2e8f0;margin-bottom:8px">Today's Highlights</h3><p>• Tech stocks surge as AI adoption grows<br>• Open-source projects hit record contributions<br>• New browser APIs enable richer web apps</p>` },
    'weather':    { title: 'Weather', html: `<div style="text-align:center"><div style="font-size:3rem">🌤️</div><h2 style="color:#e2e8f0">Partly Cloudy</h2><p style="font-size:1.6rem;color:#60a5fa;margin-top:8px">72°F / 22°C</p><p style="color:#64748b;margin-top:4px">Humidity 58% · Wind 8 mph</p></div>` },
    'calculator': { title: 'Quick Calc', html: `<p>Open the Calculator app from the dock!</p>` },
  };

  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.padding = '0';

  const bar = document.createElement('div');
  bar.className = 'browser-bar';
  bar.style.padding = '0.6rem 0.8rem 0';

  const urlInput = document.createElement('input');
  urlInput.className = 'browser-url';
  urlInput.placeholder = 'Type: jga-os, news, weather…';

  const goBtn = document.createElement('button');
  goBtn.className = 'browser-go';
  goBtn.textContent = '→';

  bar.append(urlInput, goBtn);
  body.appendChild(bar);

  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:4px;padding:4px 0.8rem 0;flex-shrink:0';
  body.appendChild(tabs);

  const content = document.createElement('div');
  content.className = 'browser-content';
  content.style.cssText = 'flex:1;overflow:auto;margin:0.6rem 0.8rem 0.8rem;text-align:left';
  body.appendChild(content);

  const openTabs = [];

  function navigate(q) {
    const key = q.trim().toLowerCase();
    const site = sites[key];
    if (site) {
      content.innerHTML = site.html;
      // Add tab if not exists
      if (!openTabs.includes(key)) {
        openTabs.push(key);
        const tab = document.createElement('button');
        tab.style.cssText = 'background:rgba(30,41,59,0.8);border:1px solid rgba(55,65,81,0.5);border-radius:5px 5px 0 0;color:#cbd5e1;font-size:0.72rem;padding:3px 10px;cursor:pointer';
        tab.textContent = site.title;
        tab.addEventListener('click', () => { urlInput.value = key; navigate(key); });
        tabs.appendChild(tab);
      }
    } else if (q.startsWith('http')) {
      content.innerHTML = `<p style="color:#64748b">External links aren't accessible in this sandbox environment.<br><br><code style="color:#60a5fa">${escHtml(q)}</code></p>`;
    } else {
      content.innerHTML = `<p style="color:#64748b">Type a shortcut: <strong style="color:#94a3b8">jga-os</strong>, <strong style="color:#94a3b8">news</strong>, <strong style="color:#94a3b8">weather</strong></p>`;
    }
  }

  goBtn.addEventListener('click', () => navigate(urlInput.value));
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') navigate(urlInput.value); });

  navigate('jga-os');
  urlInput.value = 'jga-os';
}

// ── Contacts ──────────────────────────────────────────────────────────────────
function buildContacts(body) {
  let contacts = store.get('contacts', [
    { name: 'Alex Rivera',     email: 'alex@example.com',   phone: '+1 555 0101' },
    { name: 'Jordan Smith',    email: 'jordan@example.com', phone: '+1 555 0142' },
    { name: 'Morgan Chen',     email: 'morgan@example.com', phone: '+1 555 0189' },
    { name: 'Taylor Brooks',   email: 'taylor@example.com', phone: '+1 555 0214' },
  ]);

  function save() { store.set('contacts', contacts); }

  function render(filter = '') {
    list.innerHTML = '';
    const lf = filter.toLowerCase();
    contacts
      .filter(c => c.name.toLowerCase().includes(lf) || c.email.toLowerCase().includes(lf))
      .forEach((c, i) => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        card.innerHTML = `
          <div class="contact-avatar">${initials}</div>
          <div class="contact-info">
            <div class="contact-name">${escHtml(c.name)}</div>
            <div class="contact-email">${escHtml(c.email)} · ${escHtml(c.phone)}</div>
          </div>
          <button class="todo-del" title="Delete">✕</button>`;
        card.querySelector('.todo-del').addEventListener('click', () => {
          contacts.splice(contacts.indexOf(c), 1);
          save(); render(searchInput.value);
        });
        list.appendChild(card);
      });
  }

  const toolbar = document.createElement('div');
  toolbar.className = 'contacts-toolbar';
  const searchInput = document.createElement('input');
  searchInput.className = 'contacts-search';
  searchInput.placeholder = '🔍 Search contacts…';
  const addBtn = document.createElement('button');
  addBtn.className = 'contacts-add';
  addBtn.textContent = '+ Add';
  toolbar.append(searchInput, addBtn);
  body.appendChild(toolbar);

  const list = document.createElement('div');
  list.className = 'contact-list';
  body.appendChild(list);

  searchInput.addEventListener('input', () => render(searchInput.value));

  addBtn.addEventListener('click', () => {
    const name  = prompt('Name:');
    if (!name) return;
    const email = prompt('Email:') || '';
    const phone = prompt('Phone:') || '';
    contacts.push({ name: name.trim(), email: email.trim(), phone: phone.trim() });
    save(); render(searchInput.value);
  });

  render();
}

// ── Settings ──────────────────────────────────────────────────────────────────
function buildSettings(body) {
  const saved = store.get('settings', { wallpaper: 'default', animations: true, fontSize: 14 });

  body.innerHTML = `
    <div class="settings-section">
      <h3>Appearance</h3>
      <div class="settings-row">
        <span>Wallpaper</span>
        <select id="s-wall">
          <option value="default" ${saved.wallpaper==='default'?'selected':''}>Dark Blue</option>
          <option value="purple"  ${saved.wallpaper==='purple' ?'selected':''}>Deep Purple</option>
          <option value="green"   ${saved.wallpaper==='green'  ?'selected':''}>Forest</option>
          <option value="night"   ${saved.wallpaper==='night'  ?'selected':''}>Midnight</option>
        </select>
      </div>
      <div class="settings-row">
        <span>Font size</span>
        <input type="range" id="s-font" min="12" max="18" value="${saved.fontSize}" style="width:100px">
      </div>
    </div>
    <div class="settings-section">
      <h3>System</h3>
      <div class="settings-row">
        <span>Animations</span>
        <label class="toggle-switch">
          <input type="checkbox" id="s-anim" ${saved.animations?'checked':''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
    <div class="settings-section">
      <h3>Data</h3>
      <div class="settings-row">
        <span>Clear all saved data</span>
        <button class="todo-clear-btn" id="s-clear" style="font-size:0.75rem">Reset</button>
      </div>
    </div>`;

  const wallpapers = {
    default: 'radial-gradient(ellipse at 20% 30%, #1e3a5f 0%, #020617 60%)',
    purple:  'radial-gradient(ellipse at 30% 20%, #2e1a5f 0%, #050008 60%)',
    green:   'radial-gradient(ellipse at 60% 40%, #0a2e1a 0%, #020a05 60%)',
    night:   'radial-gradient(ellipse at 50% 50%, #0a0a1a 0%, #000005 60%)',
  };

  body.querySelector('#s-wall').addEventListener('change', e => {
    saved.wallpaper = e.target.value;
    document.body.style.background = wallpapers[e.target.value];
    store.set('settings', saved);
  });

  body.querySelector('#s-font').addEventListener('input', e => {
    saved.fontSize = +e.target.value;
    document.documentElement.style.fontSize = saved.fontSize + 'px';
    store.set('settings', saved);
  });

  body.querySelector('#s-anim').addEventListener('change', e => {
    saved.animations = e.target.checked;
    store.set('settings', saved);
  });

  body.querySelector('#s-clear').addEventListener('click', () => {
    if (confirm('Reset all data?')) {
      localStorage.clear();
      location.reload();
    }
  });

  // Apply saved settings on load
  document.body.style.background = wallpapers[saved.wallpaper] || wallpapers.default;
  document.documentElement.style.fontSize = saved.fontSize + 'px';
}

// ── About ─────────────────────────────────────────────────────────────────────
function buildAbout(body) {
  body.innerHTML = `
    <div class="about-content">
      <div class="about-logo">🖥️</div>
      <h1>jga-os</h1>
      <p>Business in a Box</p>
      <p>A fully interactive web desktop by<br><strong style="color:#60a5fa">jaysgraphicarts-ai</strong></p>
      <p style="margin-top:0.75rem">
        Notes · Todo · Calendar · Calculator<br>
        Files · Browser · Contacts · Settings
      </p>
      <span class="about-version">v1.0.0 · GitHub Pages</span>
    </div>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Boot: apply saved settings ─────────────────────────────────────────────────
(function applySettings() {
  const s = store.get('settings', {});
  const wallpapers = {
    default: 'radial-gradient(ellipse at 20% 30%, #1e3a5f 0%, #020617 60%)',
    purple:  'radial-gradient(ellipse at 30% 20%, #2e1a5f 0%, #050008 60%)',
    green:   'radial-gradient(ellipse at 60% 40%, #0a2e1a 0%, #020a05 60%)',
    night:   'radial-gradient(ellipse at 50% 50%, #0a0a1a 0%, #000005 60%)',
  };
  if (s.wallpaper) document.body.style.background = wallpapers[s.wallpaper];
  if (s.fontSize)  document.documentElement.style.fontSize = s.fontSize + 'px';
})();

// ── Welcome splash (first visit) ──────────────────────────────────────────────
if (!store.get('visited', false)) {
  store.set('visited', true);
  setTimeout(() => launchApp('about'), 300);
}
