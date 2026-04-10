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
  const form       = document.getElementById('todo-form');
  const input      = document.getElementById('todo-input');
  const errorMsg   = document.getElementById('input-error');
  const list       = document.getElementById('todo-list');
  const footer     = document.getElementById('footer');
  const itemsLeft  = document.getElementById('items-left');
  const clearBtn   = document.getElementById('clear-completed');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const statusEl   = document.getElementById('status');

  /* ── Storage helpers ──────────────────────────────────── */
  function isValidTodoArray(value) {
    return Array.isArray(value) && value.every(function (item) {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.completed === 'boolean'
      );
    });
  }

  function loadTodos() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        todos = [];
        return;
      }
      const parsed = JSON.parse(stored);
      if (isValidTodoArray(parsed)) {
        todos = parsed;
        return;
      }
    } catch {
      // Fall through to reset invalid or unreadable stored data.
    }
    todos = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable – silently ignore.
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Storage unavailable — silently degrade.
    }
  }

  /* ── ID generation ────────────────────────────────────── */
  function generateTodoId() {
    var maybeCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    if (maybeCrypto && typeof maybeCrypto.randomUUID === 'function') {
      return maybeCrypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ── Todo operations ──────────────────────────────────── */
  function addTodo(text) {
    const todo = {
      id: generateTodoId(),
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

  /* ── Announcements ────────────────────────────────────── */
  function announce(message) {
    // Clear first to ensure re-announcement of identical messages.
    statusEl.textContent = '';
    requestAnimationFrame(function () {
      statusEl.textContent = message;
    });
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

    // Preserve focus: record focused todo ID and which control had focus before clearing.
    const focused = document.activeElement;
    const focusedLi = focused ? focused.closest('.todo-item') : null;
    const focusedTodoId = focusedLi ? focusedLi.dataset.id : null;
    const focusedIsCheckbox = focused ? focused.classList.contains('todo-checkbox') : false;

    // Clear existing items.
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    if (filtered.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'todo-list-empty';
      emptyItem.textContent = 'No items yet \u2014 add one above!';
      list.appendChild(emptyItem);
    } else {
      filtered.forEach(function (todo) {
        list.appendChild(createTodoElement(todo));
      });

      // Restore focus to the equivalent control in the re-rendered list.
      if (focusedTodoId) {
        const restoredLi = list.querySelector('[data-id="' + focusedTodoId + '"]');
        if (restoredLi) {
          const target = focusedIsCheckbox
            ? restoredLi.querySelector('.todo-checkbox')
            : restoredLi.querySelector('.delete-btn');
          if (target) {
            target.focus();
          }
        }
      }
    }

    renderFooter();
  }

  /* ── Edit operation ──────────────────────────────────────── */
  function editTodo(id, newText) {
    const todo = todos.find(function (t) { return t.id === id; });
    if (todo) {
      todo.text = newText;
      saveTodos();
    }
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
    span.setAttribute('title', 'Double-click to edit');

    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'todo-edit-input';
    editInput.maxLength = 200;
    editInput.setAttribute('aria-label', 'Edit "' + todo.text + '"');
    editInput.hidden = true;

    let isEditing = false;

    function startEditing() {
      if (isEditing) return;
      isEditing = true;
      span.hidden = true;
      editInput.hidden = false;
      editInput.value = todo.text;
      li.classList.add('editing');
      editInput.focus();
      editInput.select();
    }

    function commitEdit() {
      if (!isEditing) return;
      isEditing = false;
      const newText = editInput.value.trim();
      li.classList.remove('editing');
      if (!newText) {
        // Empty text — cancel and keep original
        span.hidden = false;
        editInput.hidden = true;
        return;
      }
      if (newText !== todo.text) {
        editTodo(todo.id, newText);
        span.textContent = newText;
        checkbox.setAttribute('aria-label', 'Mark "' + newText + '" as ' + (todo.completed ? 'incomplete' : 'complete'));
        delBtn.setAttribute('aria-label', 'Delete "' + newText + '"');
        editInput.setAttribute('aria-label', 'Edit "' + newText + '"');
        announce('"' + newText + '" updated.');
      }
      span.hidden = false;
      editInput.hidden = true;
    }

    function cancelEdit() {
      if (!isEditing) return;
      isEditing = false;
      li.classList.remove('editing');
      span.hidden = false;
      editInput.hidden = true;
    }

    span.addEventListener('dblclick', startEditing);

    editInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        cancelEdit();
      }
    });

    editInput.addEventListener('blur', commitEdit);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn';
    delBtn.setAttribute('aria-label', 'Delete "' + todo.text + '"');
    delBtn.innerHTML = '&#x2715;'; // ✕
    delBtn.addEventListener('click', function () {
      const deletedText = todo.text;
      const currentLi = delBtn.closest('.todo-item');
      // Capture sibling IDs before DOM is rebuilt.
      const nextId = currentLi && currentLi.nextElementSibling && currentLi.nextElementSibling.dataset.id
        ? currentLi.nextElementSibling.dataset.id
        : null;
      const prevId = currentLi && currentLi.previousElementSibling && currentLi.previousElementSibling.dataset.id
        ? currentLi.previousElementSibling.dataset.id
        : null;
      const focusTargetId = nextId || prevId;

      deleteTodo(todo.id);
      renderList();
      announce('"' + deletedText + '" deleted.');

      // Move focus to next/prev item checkbox, or back to the input.
      if (focusTargetId) {
        const focusLi = list.querySelector('[data-id="' + focusTargetId + '"]');
        if (focusLi) {
          const nextCheckbox = focusLi.querySelector('.todo-checkbox');
          if (nextCheckbox) {
            nextCheckbox.focus();
            return;
          }
        }
      }
      input.focus();
    });

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editInput);
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
    input.focus();
  });

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

  /* ── Keyboard: allow Delete/Backspace on focused list items ─── */
  list.addEventListener('keydown', function (e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const li = e.target.closest('.todo-item');

      // Allow deletion when focused on the item or its checkbox; exclude text inputs and editables.
      const isTextEntryTarget =
        e.target.tagName === 'TEXTAREA' ||
        (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') ||
        e.target.isContentEditable;

      if (li && !isTextEntryTarget) {
        e.preventDefault();
        const deletedText = li.querySelector('.todo-text').textContent;
        // Capture sibling IDs before DOM is rebuilt.
        const nextId = li.nextElementSibling && li.nextElementSibling.dataset.id
          ? li.nextElementSibling.dataset.id
          : null;
        const prevId = li.previousElementSibling && li.previousElementSibling.dataset.id
          ? li.previousElementSibling.dataset.id
          : null;
        const focusTargetId = nextId || prevId;

        deleteTodo(li.dataset.id);
        renderList();
        announce('"' + deletedText + '" deleted.');

        if (focusTargetId) {
          const focusLi = list.querySelector('[data-id="' + focusTargetId + '"]');
          if (focusLi) {
            const nextCheckbox = focusLi.querySelector('.todo-checkbox');
            if (nextCheckbox) {
              nextCheckbox.focus();
              return;
            }
          }
        }
        input.focus();
      }
    }
  });

  /* ── Init ─────────────────────────────────────────────── */
  loadTodos();
  renderList();
  input.focus();
}());
