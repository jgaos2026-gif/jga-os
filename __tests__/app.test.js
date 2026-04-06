/**
 * jga-os — comprehensive test suite
 * Covers: DockManager, WindowManager, AppRegistry,
 *         TaskbarManager, NotificationManager, JgaOS
 */

'use strict';

const {
  DockManager,
  WindowManager,
  AppRegistry,
  TaskbarManager,
  NotificationManager,
  JgaOS,
  bootJgaOS,
} = require('../app.js');

/* ─────────────────────────────────────── helpers ── */

function makeDock(tabs = ['home', 'about', 'apps']) {
  const dock = document.createElement('section');
  dock.className = 'dock';
  tabs.forEach((id) => {
    const btn = document.createElement('button');
    btn.className = 'dock-icon';
    btn.dataset.tab = id;
    btn.textContent = id;
    dock.appendChild(btn);
  });
  return dock;
}

function makeWindow() {
  const win = document.createElement('section');
  win.className = 'window';
  return win;
}

function makeStatus() {
  const el = document.createElement('span');
  el.className = 'taskbar-status';
  return el;
}

function makeClock() {
  const el = document.createElement('span');
  el.className = 'taskbar-clock';
  return el;
}

function makeNotifContainer() {
  const el = document.createElement('div');
  el.className = 'notifications';
  return el;
}

/* ════════════════════════════════════════════════════════ DockManager ══ */

describe('DockManager', () => {
  describe('constructor', () => {
    it('throws when dockEl is missing', () => {
      expect(() => new DockManager(null)).toThrow('DockManager: dockEl is required');
    });

    it('creates without throwing when given a valid element', () => {
      expect(() => new DockManager(makeDock())).not.toThrow();
    });

    it('uses a no-op onChange when none is provided', () => {
      const dm = new DockManager(makeDock());
      expect(() => dm.setActiveTab('home')).not.toThrow();
    });
  });

  describe('registerButton', () => {
    it('registers a button and includes it in getButtons()', () => {
      const dock = makeDock();
      const dm = new DockManager(dock);
      const btn = dock.querySelector('[data-tab="home"]');
      dm.registerButton('home', btn);
      expect(dm.getButtons()).toHaveProperty('home', btn);
    });

    it('ignores calls with missing tabId or element', () => {
      const dm = new DockManager(makeDock());
      dm.registerButton(null, document.createElement('button'));
      dm.registerButton('home', null);
      expect(dm.getButtons()).toEqual({});
    });
  });

  describe('setActiveTab', () => {
    let dock, dm, onChange;

    beforeEach(() => {
      onChange = jest.fn();
      dock = makeDock();
      dm = new DockManager(dock, onChange);
      dock.querySelectorAll('[data-tab]').forEach((btn) => {
        dm.registerButton(btn.dataset.tab, btn);
      });
    });

    it('calls onChange with the new tabId', () => {
      dm.setActiveTab('about');
      expect(onChange).toHaveBeenCalledWith('about');
    });

    it('adds the "active" class to the selected button', () => {
      dm.setActiveTab('about');
      expect(dock.querySelector('[data-tab="about"]').classList.contains('active')).toBe(true);
    });

    it('removes the "active" class from previously active button', () => {
      dm.setActiveTab('home');
      dm.setActiveTab('about');
      expect(dock.querySelector('[data-tab="home"]').classList.contains('active')).toBe(false);
    });

    it('does not call onChange when activating the already-active tab', () => {
      dm.setActiveTab('home');
      onChange.mockClear();
      dm.setActiveTab('home');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('getActiveTab', () => {
    it('returns null before any tab is set', () => {
      const dm = new DockManager(makeDock());
      expect(dm.getActiveTab()).toBeNull();
    });

    it('returns the most recently set tab', () => {
      const dock = makeDock();
      const dm = new DockManager(dock);
      dock.querySelectorAll('[data-tab]').forEach((btn) => dm.registerButton(btn.dataset.tab, btn));
      dm.setActiveTab('apps');
      expect(dm.getActiveTab()).toBe('apps');
    });
  });

  describe('click delegation', () => {
    it('activates a tab when its button is clicked', () => {
      const onChange = jest.fn();
      const dock = makeDock();
      const dm = new DockManager(dock, onChange);
      dock.querySelectorAll('[data-tab]').forEach((btn) => dm.registerButton(btn.dataset.tab, btn));

      dock.querySelector('[data-tab="about"]').click();
      expect(onChange).toHaveBeenCalledWith('about');
    });

    it('ignores clicks on elements without data-tab', () => {
      const onChange = jest.fn();
      const dock = makeDock();
      new DockManager(dock, onChange);
      dock.click(); // click on dock itself
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('getButtons', () => {
    it('returns a shallow copy (not the internal reference)', () => {
      const dock = makeDock();
      const dm = new DockManager(dock);
      const btn = dock.querySelector('[data-tab="home"]');
      dm.registerButton('home', btn);
      const copy = dm.getButtons();
      copy.extra = 'injected';
      expect(dm.getButtons()).not.toHaveProperty('extra');
    });
  });
});

/* ═══════════════════════════════════════════════════ WindowManager ══ */

describe('WindowManager', () => {
  describe('constructor', () => {
    it('throws when windowEl is missing', () => {
      expect(() => new WindowManager(null)).toThrow('WindowManager: windowEl is required');
    });
  });

  describe('render', () => {
    it('sets innerHTML of the window element', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<h1>Hello</h1>');
      expect(win.innerHTML).toBe('<h1>Hello</h1>');
    });

    it('replaces prior content on subsequent renders', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<p>First</p>');
      wm.render('<p>Second</p>');
      expect(win.innerHTML).toBe('<p>Second</p>');
    });

    it('increments historyLength on each call', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<p>A</p>');
      wm.render('<p>B</p>');
      wm.render('<p>C</p>');
      expect(wm.historyLength()).toBe(3);
    });
  });

  describe('getContent', () => {
    it('returns the current innerHTML', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<span>test</span>');
      expect(wm.getContent()).toBe('<span>test</span>');
    });
  });

  describe('clear', () => {
    it('empties the window element', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<h2>Content</h2>');
      wm.clear();
      expect(win.innerHTML).toBe('');
    });

    it('does not affect the history', () => {
      const win = makeWindow();
      const wm = new WindowManager(win);
      wm.render('<p>x</p>');
      wm.clear();
      expect(wm.historyLength()).toBe(1);
    });
  });
});

/* ═════════════════════════════════════════════════════ AppRegistry ══ */

describe('AppRegistry', () => {
  let reg;
  beforeEach(() => { reg = new AppRegistry(); });

  describe('register', () => {
    it('throws when id is missing', () => {
      expect(() => reg.register('', { render: () => '' })).toThrow('AppRegistry: id is required');
    });

    it('throws when config.render is not a function', () => {
      expect(() => reg.register('foo', { render: 'nope' })).toThrow('render() function');
    });

    it('registers a valid app', () => {
      reg.register('notes', { label: 'Notes', render: () => '<p>notes</p>' });
      expect(reg.has('notes')).toBe(true);
    });

    it('stores the label and render function', () => {
      const render = () => '<p>hi</p>';
      reg.register('test', { label: 'Test App', render });
      expect(reg.get('test').label).toBe('Test App');
      expect(reg.get('test').render).toBe(render);
    });

    it('uses the id as label when label is omitted', () => {
      reg.register('calc', { render: () => '' });
      expect(reg.get('calc').label).toBe('calc');
    });
  });

  describe('has / get / list', () => {
    beforeEach(() => {
      reg.register('a', { render: () => 'a' });
      reg.register('b', { render: () => 'b' });
    });

    it('has() returns true for registered ids', () => {
      expect(reg.has('a')).toBe(true);
    });

    it('has() returns false for unknown ids', () => {
      expect(reg.has('z')).toBe(false);
    });

    it('get() returns undefined for unknown ids', () => {
      expect(reg.get('z')).toBeUndefined();
    });

    it('list() returns all registered ids', () => {
      expect(reg.list()).toEqual(expect.arrayContaining(['a', 'b']));
    });
  });

  describe('unregister', () => {
    it('removes the app so has() returns false', () => {
      reg.register('tmp', { render: () => '' });
      reg.unregister('tmp');
      expect(reg.has('tmp')).toBe(false);
    });

    it('is idempotent for unknown ids', () => {
      expect(() => reg.unregister('nonexistent')).not.toThrow();
    });
  });
});

/* ══════════════════════════════════════════════════ TaskbarManager ══ */

describe('TaskbarManager', () => {
  describe('constructor', () => {
    it('throws when statusEl is missing', () => {
      expect(() => new TaskbarManager(null)).toThrow('TaskbarManager: statusEl is required');
    });
  });

  describe('setStatus / getStatus', () => {
    it('updates and retrieves the status text', () => {
      const tm = new TaskbarManager(makeStatus());
      tm.setStatus('Ready');
      expect(tm.getStatus()).toBe('Ready');
    });

    it('overwrites previous status', () => {
      const el = makeStatus();
      const tm = new TaskbarManager(el);
      tm.setStatus('Loading');
      tm.setStatus('Done');
      expect(el.textContent).toBe('Done');
    });
  });

  describe('clock', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('isClockRunning() is false before startClock()', () => {
      const tm = new TaskbarManager(makeStatus(), makeClock());
      expect(tm.isClockRunning()).toBe(false);
    });

    it('isClockRunning() is true after startClock()', () => {
      const tm = new TaskbarManager(makeStatus(), makeClock());
      tm.startClock();
      expect(tm.isClockRunning()).toBe(true);
      tm.stopClock();
    });

    it('sets initial clock text immediately on startClock()', () => {
      const clockEl = makeClock();
      const tm = new TaskbarManager(makeStatus(), clockEl);
      tm.startClock();
      expect(clockEl.textContent).not.toBe('');
      tm.stopClock();
    });

    it('updates clock text after one second', () => {
      const clockEl = makeClock();
      const tm = new TaskbarManager(makeStatus(), clockEl);

      // Fix Date to a known time, then advance past a minute boundary
      const baseTime = new Date('2026-01-01T00:00:50.000Z').getTime();
      jest.spyOn(Date, 'now').mockReturnValue(baseTime);
      const RealDate = global.Date;
      jest.spyOn(global, 'Date').mockImplementation((arg) =>
        arg === undefined ? new RealDate(baseTime) : new RealDate(arg),
      );

      tm.startClock();
      const before = clockEl.textContent;

      // Advance 15 s so the minute rolls over (50s → 05s of next minute)
      const laterTime = baseTime + 15_000;
      global.Date.mockImplementation((arg) =>
        arg === undefined ? new RealDate(laterTime) : new RealDate(arg),
      );
      jest.advanceTimersByTime(15_000);

      expect(clockEl.textContent).toBeDefined();
      expect(typeof clockEl.textContent).toBe('string');
      expect(clockEl.textContent).not.toBe(before);

      tm.stopClock();
      jest.restoreAllMocks();
    });

    it('does not start a second interval if already running', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const tm = new TaskbarManager(makeStatus(), makeClock());
      tm.startClock();
      tm.startClock(); // second call should be ignored
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      tm.stopClock();
      setIntervalSpy.mockRestore();
    });

    it('isClockRunning() is false after stopClock()', () => {
      const tm = new TaskbarManager(makeStatus(), makeClock());
      tm.startClock();
      tm.stopClock();
      expect(tm.isClockRunning()).toBe(false);
    });

    it('stopClock() is safe to call when clock is not running', () => {
      const tm = new TaskbarManager(makeStatus());
      expect(() => tm.stopClock()).not.toThrow();
    });

    it('does not throw when clockEl is absent', () => {
      const tm = new TaskbarManager(makeStatus()); // no clockEl
      tm.startClock();
      jest.advanceTimersByTime(1000);
      expect(() => tm.stopClock()).not.toThrow();
      tm.stopClock();
    });
  });
});

/* ══════════════════════════════════════════════ NotificationManager ══ */

describe('NotificationManager', () => {
  let container, nm;

  beforeEach(() => {
    container = makeNotifContainer();
    nm = new NotificationManager(container);
  });

  describe('constructor', () => {
    it('throws when containerEl is missing', () => {
      expect(() => new NotificationManager(null)).toThrow(
        'NotificationManager: containerEl is required',
      );
    });
  });

  describe('show', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('appends a toast to the container', () => {
      nm.show('Hello');
      expect(container.children.length).toBe(1);
    });

    it('returns the toast element', () => {
      const toast = nm.show('Hi');
      expect(toast).toBeInstanceOf(HTMLElement);
    });

    it('applies the correct type class', () => {
      const toast = nm.show('Oops', 'error');
      expect(toast.classList.contains('notification--error')).toBe(true);
    });

    it('defaults to "info" type', () => {
      const toast = nm.show('FYI');
      expect(toast.classList.contains('notification--info')).toBe(true);
    });

    it('sets the message as textContent', () => {
      const toast = nm.show('Test message', 'success');
      expect(toast.textContent).toBe('Test message');
    });

    it('sets role="alert" for accessibility', () => {
      const toast = nm.show('Accessible');
      expect(toast.getAttribute('role')).toBe('alert');
    });

    it('auto-dismisses after the duration', () => {
      nm.show('Bye', 'info', 500);
      expect(nm.count()).toBe(1);
      jest.advanceTimersByTime(500);
      expect(nm.count()).toBe(0);
    });

    it('does NOT auto-dismiss when duration is 0', () => {
      nm.show('Persistent', 'warning', 0);
      jest.advanceTimersByTime(60000);
      expect(nm.count()).toBe(1);
    });

    it('ignores empty message', () => {
      const result = nm.show('');
      expect(result).toBeUndefined();
      expect(nm.count()).toBe(0);
    });

    it('stacks multiple toasts', () => {
      nm.show('A');
      nm.show('B');
      nm.show('C');
      expect(nm.count()).toBe(3);
    });
  });

  describe('dismiss', () => {
    it('removes the specified toast', () => {
      const toast = nm.show('Remove me', 'info', 0);
      nm.dismiss(toast);
      expect(nm.count()).toBe(0);
      expect(container.children.length).toBe(0);
    });

    it('is safe to call on an already-dismissed toast', () => {
      const toast = nm.show('Once', 'info', 0);
      nm.dismiss(toast);
      expect(() => nm.dismiss(toast)).not.toThrow();
    });

    it('only removes the target toast, leaving others', () => {
      const t1 = nm.show('Keep', 'info', 0);
      const t2 = nm.show('Remove', 'info', 0);
      nm.dismiss(t2);
      expect(nm.count()).toBe(1);
      expect(container.contains(t1)).toBe(true);
    });
  });

  describe('dismissAll', () => {
    it('removes all active toasts', () => {
      nm.show('A', 'info', 0);
      nm.show('B', 'info', 0);
      nm.show('C', 'info', 0);
      nm.dismissAll();
      expect(nm.count()).toBe(0);
      expect(container.children.length).toBe(0);
    });

    it('is safe to call when no toasts are active', () => {
      expect(() => nm.dismissAll()).not.toThrow();
    });
  });

  describe('count', () => {
    it('returns 0 initially', () => {
      expect(nm.count()).toBe(0);
    });

    it('increments with each show()', () => {
      nm.show('1', 'info', 0);
      nm.show('2', 'info', 0);
      expect(nm.count()).toBe(2);
    });
  });
});

/* ════════════════════════════════════════════════════════════ JgaOS ══ */

describe('JgaOS', () => {
  let dockEl, windowEl, statusEl, clockEl, notifEl;

  beforeEach(() => {
    jest.useFakeTimers();
    dockEl = makeDock();
    windowEl = makeWindow();
    statusEl = makeStatus();
    clockEl = makeClock();
    notifEl = makeNotifContainer();
    document.body.append(dockEl, windowEl, statusEl, clockEl, notifEl);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.useRealTimers();
  });

  function makeOS() {
    return new JgaOS({ dockEl, windowEl, statusEl, clockEl, notifEl });
  }

  describe('construction', () => {
    it('creates without errors', () => {
      expect(() => makeOS()).not.toThrow();
    });

    it('registers the three built-in apps', () => {
      const os = makeOS();
      expect(os.appRegistry.list()).toEqual(expect.arrayContaining(['home', 'about', 'apps']));
    });

    it('starts the clock on construction', () => {
      const os = makeOS();
      expect(os.taskbarManager.isClockRunning()).toBe(true);
      os.shutdown();
    });
  });

  describe('launch()', () => {
    it('renders the home app content into the window', () => {
      const os = makeOS();
      os.launch('home');
      expect(windowEl.innerHTML).toContain('Welcome to jga-os');
    });

    it('renders the about app content', () => {
      const os = makeOS();
      os.launch('about');
      expect(windowEl.innerHTML).toContain('About jga-os');
    });

    it('renders the apps list content', () => {
      const os = makeOS();
      os.launch('apps');
      expect(windowEl.innerHTML).toContain('Installed Apps');
    });

    it('updates taskbar status to the app label', () => {
      const os = makeOS();
      os.launch('about');
      expect(statusEl.textContent).toBe('About');
    });

    it('shows a notification when launching an app', () => {
      const os = makeOS();
      os.launch('home');
      expect(notifEl.children.length).toBeGreaterThan(0);
      os.shutdown();
    });

    it('sets the "active" class on the dock button', () => {
      const os = makeOS();
      os.launch('apps');
      expect(dockEl.querySelector('[data-tab="apps"]').classList.contains('active')).toBe(true);
      os.shutdown();
    });

    it('sets status to "Unknown app: …" for an unregistered id', () => {
      const os = makeOS();
      os.launch('nonexistent');
      expect(statusEl.textContent).toBe('Unknown app: nonexistent');
      os.shutdown();
    });
  });

  describe('appRegistry integration', () => {
    it('can register and launch a custom app', () => {
      const os = makeOS();
      os.appRegistry.register('calc', {
        label: 'Calculator',
        render: () => '<p>calc app</p>',
      });
      os.launch('calc');
      expect(windowEl.innerHTML).toContain('calc app');
      expect(statusEl.textContent).toBe('Calculator');
      os.shutdown();
    });

    it('lists custom app in apps view after registration', () => {
      const os = makeOS();
      os.appRegistry.register('notes', { label: 'Notes', render: () => '' });
      os.launch('apps');
      expect(windowEl.innerHTML).toContain('notes');
      os.shutdown();
    });
  });

  describe('shutdown()', () => {
    it('stops the clock', () => {
      const os = makeOS();
      os.shutdown();
      expect(os.taskbarManager.isClockRunning()).toBe(false);
    });

    it('sets the status to "Shut down"', () => {
      const os = makeOS();
      os.shutdown();
      expect(statusEl.textContent).toBe('Shut down');
    });

    it('dismisses all notifications', () => {
      const os = makeOS();
      os.launch('home');
      os.shutdown();
      expect(notifEl.children.length).toBe(0);
    });
  });
});
