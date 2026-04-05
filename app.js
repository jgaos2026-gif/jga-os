/**
 * JGA-OS To-Do List — app.js
 * Vanilla JS, no dependencies.
 * Data is persisted in localStorage under the key "jga-os.todos.v1".
 */

(function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────── */
  const STORAGE_KEY = 'jga-os.todos.v1';

  /* ── State ────────────────────────────────────────────── */
  let todos = [];
  let currentFilter = 'all';

  /* ── DOM refs ─────────────────────────────────────────── */
  const form        = document.getElementById('todo-form');
  const input       = document.getElementById('todo-input');
  const errorMsg    = document.getElementById('input-error');
  const list        = document.getElementById('todo-list');
  const footer      = document.getElementById('footer');
  const itemsLeft   = document.getElementById('items-left');
  const clearBtn    = document.getElementById('clear-completed');
  const filterBtns  = document.querySelectorAll('.filter-btn');

  /* ── Storage helpers ──────────────────────────────────── */
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      todos = raw ? JSON.parse(raw) : [];
    } catch {
      todos = [];
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Storage unavailable — silently degrade
    }
  }

  /* ── Todo operations ──────────────────────────────────── */
  function addTodo(text) {
    const todo = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.unshift(todo);
    saveTodos();
    return todo;
  }

  function toggleTodo(id) {
    const todo = todos.find(function (t) { return t.id === id; });
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
    }
  }

  function deleteTodo(id) {
    todos = todos.filter(function (t) { return t.id !== id; });
    saveTodos();
  }

  function clearCompleted() {
    todos = todos.filter(function (t) { return !t.completed; });
    saveTodos();
  }

  /* ── Render ───────────────────────────────────────────── */
  function getFilteredTodos() {
    if (currentFilter === 'active') {
      return todos.filter(function (t) { return !t.completed; });
    }
    if (currentFilter === 'completed') {
      return todos.filter(function (t) { return t.completed; });
    }
    return todos;
  }

  function renderList() {
    const filtered = getFilteredTodos();

    // Clear existing items
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    filtered.forEach(function (todo) {
      const li = createTodoElement(todo);
      list.appendChild(li);
    });

    renderFooter();
  }

  function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', 'Mark "' + todo.text + '" as ' + (todo.completed ? 'incomplete' : 'complete'));
    checkbox.addEventListener('change', function () {
      toggleTodo(todo.id);
      renderList();
    });

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.setAttribute('aria-label', 'Delete "' + todo.text + '"');
    delBtn.innerHTML = '&#x2715;'; // ✕
    delBtn.addEventListener('click', function () {
      deleteTodo(todo.id);
      renderList();
      // Announce to screen readers
      list.setAttribute('aria-label', 'To-do items');
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);

    return li;
  }

  function renderFooter() {
    const activeCount = todos.filter(function (t) { return !t.completed; }).length;
    const completedCount = todos.filter(function (t) { return t.completed; }).length;

    if (todos.length === 0) {
      footer.hidden = true;
      return;
    }

    footer.hidden = false;
    itemsLeft.textContent = activeCount + ' item' + (activeCount !== 1 ? 's' : '') + ' left';
    clearBtn.hidden = completedCount === 0;
  }

  /* ── Filter buttons ───────────────────────────────────── */
  function setFilter(filter) {
    currentFilter = filter;
    filterBtns.forEach(function (btn) {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    renderList();
  }

  /* ── Event listeners ──────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const trimmed = input.value.trim();

    if (!trimmed) {
      errorMsg.textContent = 'Please enter a to-do item before adding.';
      input.focus();
      return;
    }

    errorMsg.textContent = '';
    addTodo(trimmed);
    input.value = '';
    renderList();
    // Return focus to input for quick back-to-back entry
    input.focus();
  });

  // Clear error as user types
  input.addEventListener('input', function () {
    if (errorMsg.textContent) {
      errorMsg.textContent = '';
    }
  });

  clearBtn.addEventListener('click', function () {
    clearCompleted();
    renderList();
    input.focus();
  });

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFilter(btn.dataset.filter);
    });
  });

  /* ── Keyboard: allow Delete key on focused list items ─── */
  list.addEventListener('keydown', function (e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const li = e.target.closest('.todo-item');
      if (li && e.target.tagName !== 'INPUT') {
        deleteTodo(li.dataset.id);
        renderList();
        input.focus();
      }
    }
  });

  /* ── Init ─────────────────────────────────────────────── */
  loadTodos();
  renderList();
  input.focus();
}());
