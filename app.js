/**
 * jga-os — core system module
 * Provides: DockManager, WindowManager, AppRegistry,
 *           TaskbarManager, NotificationManager, JgaOS (orchestrator)
 */

/* ─────────────────────────────────────────────────────── DockManager ── */

class DockManager {
  /**
   * @param {HTMLElement} dockEl   – the .dock container
   * @param {Function}    onChange – called with (tabId) when the active tab changes
   */
  constructor(dockEl, onChange) {
    if (!dockEl) throw new Error('DockManager: dockEl is required');
    this._dock = dockEl;
    this._onChange = typeof onChange === 'function' ? onChange : () => {};
    this._activeTab = null;
    this._buttons = {};

    this._dock.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (btn) this.setActiveTab(btn.dataset.tab);
    });
  }

  /** Register a dock button element keyed by tabId. */
  registerButton(tabId, buttonEl) {
    if (!tabId || !buttonEl) return;
    this._buttons[tabId] = buttonEl;
  }

  /** Activate a tab, update button classes, and fire onChange. */
  setActiveTab(tabId) {
    if (this._activeTab === tabId) return;
    this._activeTab = tabId;

    Object.entries(this._buttons).forEach(([id, btn]) => {
      btn.classList.toggle('active', id === tabId);
    });

    this._onChange(tabId);
  }

  getActiveTab() {
    return this._activeTab;
  }

  /** Returns a copy of the registered buttons map. */
  getButtons() {
    return { ...this._buttons };
  }
}

/* ──────────────────────────────────────────────────── WindowManager ── */

class WindowManager {
  /**
   * @param {HTMLElement} windowEl – the .window container
   */
  constructor(windowEl) {
    if (!windowEl) throw new Error('WindowManager: windowEl is required');
    this._window = windowEl;
    this._history = [];
  }

  /** Render an app view inside the window. */
  render(html) {
    this._window.innerHTML = html;
    this._history.push(html);
  }

  /** Return the raw innerHTML of the window. */
  getContent() {
    return this._window.innerHTML;
  }

  /** Number of renders in the history. */
  historyLength() {
    return this._history.length;
  }

  /** Clear window content. */
  clear() {
    this._window.innerHTML = '';
  }
}

/* ──────────────────────────────────────────────────── AppRegistry ── */

class AppRegistry {
  constructor() {
    this._apps = {};
  }

  /**
   * Register an app.
   * @param {string}   id      – unique app identifier
   * @param {object}   config  – { label, icon, render }
   */
  register(id, config) {
    if (!id) throw new Error('AppRegistry: id is required');
    if (!config || typeof config.render !== 'function') {
      throw new Error(`AppRegistry: app "${id}" must have a render() function`);
    }
    this._apps[id] = { label: config.label || id, icon: config.icon || '', render: config.render };
  }

  /** Get an app config by id. Returns undefined when not found. */
  get(id) {
    return this._apps[id];
  }

  /** Returns an array of all registered app ids. */
  list() {
    return Object.keys(this._apps);
  }

  /** True when an app with the given id is registered. */
  has(id) {
    return Object.prototype.hasOwnProperty.call(this._apps, id);
  }

  /** Remove a registered app. */
  unregister(id) {
    delete this._apps[id];
  }
}

/* ────────────────────────────────────────────────── TaskbarManager ── */

class TaskbarManager {
  /**
   * @param {HTMLElement} statusEl – element to display status text in
   * @param {HTMLElement} clockEl  – element to display current time in (optional)
   */
  constructor(statusEl, clockEl) {
    if (!statusEl) throw new Error('TaskbarManager: statusEl is required');
    this._statusEl = statusEl;
    this._clockEl = clockEl || null;
    this._clockInterval = null;
  }

  /** Update the status text. */
  setStatus(text) {
    this._statusEl.textContent = text;
  }

  getStatus() {
    return this._statusEl.textContent;
  }

  /** Start a live clock that ticks every second. */
  startClock() {
    if (this._clockInterval) return; // already running
    this._tick();
    this._clockInterval = setInterval(() => this._tick(), 1000);
  }

  /** Stop the live clock. */
  stopClock() {
    if (this._clockInterval) {
      clearInterval(this._clockInterval);
      this._clockInterval = null;
    }
  }

  /** Returns true when the clock is running. */
  isClockRunning() {
    return this._clockInterval !== null;
  }

  _tick() {
    if (!this._clockEl) return;
    const now = new Date();
    this._clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/* ──────────────────────────────────────────────── NotificationManager ── */

class NotificationManager {
  /**
   * @param {HTMLElement} containerEl – element where toast notifications appear
   */
  constructor(containerEl) {
    if (!containerEl) throw new Error('NotificationManager: containerEl is required');
    this._container = containerEl;
    this._queue = [];
  }

  /**
   * Show a notification toast.
   * @param {string} message
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {number} [duration=3000] – auto-dismiss after ms (0 = never)
   */
  show(message, type = 'info', duration = 3000) {
    if (!message) return;
    const toast = this._createToast(message, type);
    this._container.appendChild(toast);
    this._queue.push(toast);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }
    return toast;
  }

  /** Dismiss a specific toast element. */
  dismiss(toast) {
    if (toast && toast.parentElement === this._container) {
      this._container.removeChild(toast);
      this._queue = this._queue.filter((t) => t !== toast);
    }
  }

  /** Dismiss all active toasts. */
  dismissAll() {
    [...this._queue].forEach((t) => this.dismiss(t));
  }

  /** Number of visible notifications. */
  count() {
    return this._queue.length;
  }

  _createToast(message, type) {
    const el = document.createElement('div');
    el.className = `notification notification--${type}`;
    el.textContent = message;
    el.setAttribute('role', 'alert');
    return el;
  }
}

/* ─────────────────────────────────────────────────────────── JgaOS ── */

/**
 * JgaOS — top-level orchestrator.
 * Wires together all managers and bootstraps the built-in apps.
 */
class JgaOS {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.dockEl
   * @param {HTMLElement} opts.windowEl
   * @param {HTMLElement} opts.statusEl
   * @param {HTMLElement} [opts.clockEl]
   * @param {HTMLElement} [opts.notifEl]
   */
  constructor({ dockEl, windowEl, statusEl, clockEl, notifEl } = {}) {
    this.appRegistry = new AppRegistry();
    this.windowManager = new WindowManager(windowEl);
    this.taskbarManager = new TaskbarManager(statusEl, clockEl);
    this.notificationManager = notifEl ? new NotificationManager(notifEl) : null;

    this.dockManager = new DockManager(dockEl, (tabId) => this._launch(tabId));

    // Register dock buttons
    dockEl.querySelectorAll('[data-tab]').forEach((btn) => {
      this.dockManager.registerButton(btn.dataset.tab, btn);
    });

    this._registerBuiltinApps();
    this.taskbarManager.startClock();
  }

  _registerBuiltinApps() {
    this.appRegistry.register('home', {
      label: 'Home',
      render: () => `
        <h1>Welcome to jga-os</h1>
        <p>A minimal web desktop by jaysgraphicarts-ai.</p>
        <p>Click a dock icon to explore.</p>`,
    });

    this.appRegistry.register('about', {
      label: 'About',
      render: () => `
        <h2>About jga-os</h2>
        <p>Version 1.0.0 — built with vanilla HTML, CSS &amp; JS.</p>
        <p>Open-source. MIT licensed.</p>`,
    });

    this.appRegistry.register('apps', {
      label: 'Apps',
      render: () => {
        const list = this.appRegistry
          .list()
          .map((id) => {
            const app = this.appRegistry.get(id);
            return `<li><strong>${app.label}</strong> <code>${id}</code></li>`;
          })
          .join('');
        return `<h2>Installed Apps</h2><ul>${list}</ul>`;
      },
    });
  }

  /** Launch an app by id. */
  _launch(appId) {
    const app = this.appRegistry.get(appId);
    if (!app) {
      this.taskbarManager.setStatus(`Unknown app: ${appId}`);
      return;
    }
    this.windowManager.render(app.render());
    this.taskbarManager.setStatus(app.label);
    if (this.notificationManager) {
      this.notificationManager.show(`Opened ${app.label}`, 'info', 2000);
    }
  }

  /** Public method to launch an app and activate its dock button. */
  launch(appId) {
    this.dockManager.setActiveTab(appId);
    // setActiveTab fires the onChange -> _launch; but if no button exists, call directly.
    if (!this.dockManager.getButtons()[appId]) {
      this._launch(appId);
    }
  }

  /** Shut down the OS (stop clock, clear notifications). */
  shutdown() {
    this.taskbarManager.stopClock();
    if (this.notificationManager) this.notificationManager.dismissAll();
    this.taskbarManager.setStatus('Shut down');
  }
}

/* ─────────────────────────────────────────────── browser boot ── */

/**
 * Boot the OS when running in a real browser.
 * Exported separately so tests can import modules without triggering boot.
 */
function bootJgaOS() {
  const os = new JgaOS({
    dockEl: document.querySelector('.dock'),
    windowEl: document.querySelector('.window'),
    statusEl: document.querySelector('.taskbar-status'),
    clockEl: document.querySelector('.taskbar-clock'),
    notifEl: document.querySelector('.notifications'),
  });

  // Boot to Home
  os.launch('home');
  window.__jgaos = os;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bootJgaOS);
}

/* ─────────────────────────────────────────────────── exports ── */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DockManager, WindowManager, AppRegistry, TaskbarManager, NotificationManager, JgaOS, bootJgaOS };
}
