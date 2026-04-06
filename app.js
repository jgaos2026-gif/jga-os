/* jga-os — main script */
(() => {
  'use strict';

  // ── State ────────────────────────────────────────────────────────────────────
  const state = {
    clockFmt: '24',
    currentApp: null,
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function qs(sel, ctx = document) { return ctx.querySelector(sel); }
  function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }
  function setStatus(msg, ms = 1800) {
    const el = qs('#taskbar-status');
    el.textContent = msg;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.textContent = 'Ready'; }, ms);
  }

  // ── Traffic-light buttons ────────────────────────────────────────────────────
  const desktop = qs('#desktop');

  qs('#btn-close').addEventListener('click', () => {
    desktop.style.opacity = '0';
    desktop.style.transform = 'scale(0.9)';
    desktop.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => {
      desktop.style.opacity = '1';
      desktop.style.transform = '';
    }, 1200);
    setStatus('Closing…', 1200);
  });

  qs('#btn-min').addEventListener('click', () => {
    desktop.classList.add('minimised');
    setStatus('Minimised', 2000);
    setTimeout(() => desktop.classList.remove('minimised'), 2000);
  });

  qs('#btn-max').addEventListener('click', () => {
    const isMax = desktop.style.width === '100%';
    desktop.style.width = isMax ? '' : '100%';
    desktop.style.borderRadius = isMax ? '' : '0';
    setStatus(isMax ? 'Restored' : 'Maximised');
  });

  // ── Dock / panel navigation ──────────────────────────────────────────────────
  const dockBtns = qsa('.dock-icon[data-panel]');
  const panels   = qsa('.panel');

  function activatePanel(id) {
    dockBtns.forEach(b => {
      const active = b.dataset.panel === id;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active);
    });
    panels.forEach(p => {
      const show = p.id === `panel-${id}`;
      p.hidden = !show;
    });
    setStatus(id.charAt(0).toUpperCase() + id.slice(1));
  }

  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => activatePanel(btn.dataset.panel));
  });

  // ── Clock ────────────────────────────────────────────────────────────────────
  const clockEl = qs('#taskbar-clock');

  function updateClock() {
    const now = new Date();
    let h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    if (state.clockFmt === '12') {
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      clockEl.textContent = `${h}:${m}:${s} ${ampm}`;
    } else {
      clockEl.textContent = `${String(h).padStart(2, '0')}:${m}:${s}`;
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // ── Apps launcher ────────────────────────────────────────────────────────────
  const APP_MAP = {
    notes:      '#app-notes',
    calculator: '#app-calculator',
    terminal:   '#app-terminal',
    calendar:   '#app-calendar',
  };

  qsa('.app-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const app = tile.dataset.app;
      const selector = APP_MAP[app];

      // Toggle same app
      if (state.currentApp === app) {
        if (selector) qs(selector).hidden = true;
        tile.classList.remove('open');
        state.currentApp = null;
        return;
      }

      // Hide previous
      if (state.currentApp && APP_MAP[state.currentApp]) {
        qs(APP_MAP[state.currentApp]).hidden = true;
        const prev = qs(`.app-tile[data-app="${state.currentApp}"]`);
        if (prev) prev.classList.remove('open');
      }

      state.currentApp = app;
      tile.classList.add('open');

      if (selector) {
        const el = qs(selector);
        el.hidden = false;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setStatus(`Opened ${tile.querySelector('.app-label').textContent}`);
        if (app === 'calendar') renderCalendar();
        if (app === 'terminal') qs('#terminal-input').focus();
        if (app === 'notes') loadNotes();
      } else {
        setStatus(`${tile.querySelector('.app-label').textContent} — coming soon`);
      }
    });
  });

  // ── Notes ────────────────────────────────────────────────────────────────────
  const NOTES_KEY = 'jgaos-notes';

  function loadNotes() {
    qs('#notes-content').value = localStorage.getItem(NOTES_KEY) || '';
  }

  qs('#notes-save').addEventListener('click', () => {
    localStorage.setItem(NOTES_KEY, qs('#notes-content').value);
    setStatus('Notes saved ✓');
  });

  qs('#notes-clear').addEventListener('click', () => {
    qs('#notes-content').value = '';
    localStorage.removeItem(NOTES_KEY);
    setStatus('Notes cleared');
  });

  // ── Calculator ───────────────────────────────────────────────────────────────
  const calcDisplay = qs('#calc-display');
  let calcExpr = '';

  function calcUpdate(val) {
    calcDisplay.textContent = val || '0';
  }

  qs('#app-calculator').addEventListener('click', e => {
    const btn = e.target.closest('.calc-btn');
    if (!btn) return;
    const type = btn.dataset.calc;

    if (type === 'clear') { calcExpr = ''; calcUpdate('0'); return; }
    if (type === 'dot')   { if (!calcExpr.split(/[+\-*/]/).pop().includes('.')) { calcExpr += '.'; } calcUpdate(calcExpr); return; }
    if (type === 'num')   { calcExpr += btn.textContent; calcUpdate(calcExpr); return; }
    if (type === 'op')    { if (calcExpr) { calcExpr += btn.dataset.op; calcUpdate(calcExpr); } return; }
    if (type === 'eq') {
      try {
        // Safe eval: only allow digits, operators, dots, parens
        if (!/^[\d+\-*/.() ]+$/.test(calcExpr)) throw new Error('Invalid');
        // eslint-disable-next-line no-new-func
        const result = Function(`'use strict'; return (${calcExpr})`)();
        calcExpr = String(result);
        calcUpdate(calcExpr);
      } catch {
        calcUpdate('Error');
        calcExpr = '';
      }
    }
  });

  // ── Terminal ─────────────────────────────────────────────────────────────────
  const termOutput = qs('#terminal-output');
  const termInput  = qs('#terminal-input');

  const TERM_CMDS = {
    help: () => 'Available commands: help, clear, echo, date, whoami, ls, uname',
    clear: () => { termOutput.textContent = ''; return null; },
    date: () => new Date().toString(),
    whoami: () => 'jga-user',
    uname: () => 'jga-os v1.0.0 (web)',
    ls: () => 'index.html  style.css  app.js',
  };

  function termPrint(line) {
    if (line === null) return;
    termOutput.textContent += line + '\n';
    termOutput.scrollTop = termOutput.scrollHeight;
  }

  termInput.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const raw = termInput.value.trim();
    termInput.value = '';
    if (!raw) return;

    termPrint(`jga@os:~$ ${raw}`);
    const [cmd, ...args] = raw.split(' ');

    if (cmd in TERM_CMDS) {
      const out = TERM_CMDS[cmd](args);
      termPrint(out);
    } else if (cmd === 'echo') {
      termPrint(args.join(' '));
    } else {
      termPrint(`${cmd}: command not found`);
    }
  });

  termPrint('jga-os terminal — type "help" for commands');

  // ── Calendar ─────────────────────────────────────────────────────────────────
  let calDate = new Date();

  function renderCalendar() {
    const year  = calDate.getFullYear();
    const month = calDate.getMonth();
    const today = new Date();
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    qs('#cal-month-year').textContent = `${MONTHS[month]} ${year}`;

    const grid = qs('#cal-grid');
    grid.innerHTML = '';

    DAYS.forEach(d => {
      const cell = document.createElement('div');
      cell.className = 'cal-cell header';
      cell.textContent = d;
      grid.appendChild(cell);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.textContent = prevDays - i;
      grid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell';
      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        cell.classList.add('today');
      }
      cell.textContent = d;
      grid.appendChild(cell);
    }

    const total = firstDay + daysInMonth;
    const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let d = 1; d <= remaining; d++) {
      const cell = document.createElement('div');
      cell.className = 'cal-cell other-month';
      cell.textContent = d;
      grid.appendChild(cell);
    }
  }

  qs('#cal-prev').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
  qs('#cal-next').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });

  // ── Settings ─────────────────────────────────────────────────────────────────
  const root = document.documentElement;

  // Accent colour
  qsa('#accent-swatches .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      qsa('#accent-swatches .swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      const hue = sw.dataset.hue;
      root.style.setProperty('--accent', `hsl(${hue}, 90%, 60%)`);
      root.style.setProperty('--accent-dark', `hsl(${hue}, 90%, 48%)`);
      root.style.setProperty('--accent-glow', `hsla(${hue}, 90%, 60%, 0.35)`);
      setStatus('Accent updated');
    });
  });

  // Background
  qsa('#bg-toggle .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('#bg-toggle .btn').forEach(b => b.classList.replace('btn', 'btn') && b.classList.remove('active') && b.classList.add('btn-ghost'));
      btn.classList.remove('btn-ghost');
      btn.classList.add('active');
      document.body.classList.toggle('bg-darker', btn.dataset.bg === 'darker');
      setStatus('Background updated');
    });
  });

  // Clock format
  qsa('#clock-toggle .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('#clock-toggle .btn').forEach(b => { b.classList.remove('active'); b.classList.add('btn-ghost'); });
      btn.classList.remove('btn-ghost');
      btn.classList.add('active');
      state.clockFmt = btn.dataset.fmt;
      updateClock();
      setStatus('Clock format updated');
    });
  });
})();
