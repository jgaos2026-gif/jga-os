/* app.js – To-Do List with localStorage persistence */

(function () {
  'use strict';

  const STORAGE_KEY = 'jga_os_tasks';

  /* ── State ─────────────────────────────────────────────────── */
  let tasks = [];
  let currentFilter = 'all';
  let editingId = null;

  /* ── DOM references ─────────────────────────────────────────── */
  const taskForm       = document.getElementById('task-form');
  const taskInput      = document.getElementById('task-input');
  const taskList       = document.getElementById('task-list');
  const taskCount      = document.getElementById('task-count');
  const filterBtns     = document.querySelectorAll('.filter-btn');
  const clearBtn       = document.getElementById('clear-completed-btn');

  const editModal      = document.getElementById('edit-modal');
  const modalOverlay   = document.getElementById('modal-overlay');
  const editInput      = document.getElementById('edit-input');
  const saveEditBtn    = document.getElementById('save-edit-btn');
  const cancelEditBtn  = document.getElementById('cancel-edit-btn');

  /* ── localStorage helpers ───────────────────────────────────── */
  function loadTasks() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      tasks = stored ? JSON.parse(stored) : [];
    } catch {
      tasks = [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // localStorage unavailable (e.g. private mode quota exceeded) – silently ignore
    }
  }

  /* ── Task helpers ───────────────────────────────────────────── */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getFilteredTasks() {
    if (currentFilter === 'active')    return tasks.filter(t => !t.completed);
    if (currentFilter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }

  /* ── Render ─────────────────────────────────────────────────── */
  function renderTasks() {
    const filtered = getFilteredTasks();
    taskList.innerHTML = '';

    if (filtered.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = currentFilter === 'completed'
        ? 'No completed tasks yet.'
        : currentFilter === 'active'
          ? 'No active tasks. Great job!'
          : 'Add a task above to get started!';
      taskList.appendChild(li);
    } else {
      filtered.forEach(task => {
        taskList.appendChild(createTaskElement(task));
      });
    }

    updateFooter();
  }

  function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleComplete(task.id));

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = '✏️ Edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.addEventListener('click', () => openEditModal(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '🗑 Delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    return li;
  }

  function updateFooter() {
    const activeCount = tasks.filter(t => !t.completed).length;
    taskCount.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
  }

  /* ── CRUD operations ────────────────────────────────────────── */
  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    tasks.push({ id: generateId(), text: trimmed, completed: false });
    saveTasks();
    renderTasks();
  }

  function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
  }

  function saveEdit() {
    const trimmed = editInput.value.trim();
    if (!trimmed) return;

    const task = tasks.find(t => t.id === editingId);
    if (task) {
      task.text = trimmed;
      saveTasks();
      renderTasks();
    }
    closeEditModal();
  }

  /* ── Edit modal ─────────────────────────────────────────────── */
  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingId = id;
    editInput.value = task.text;

    editModal.hidden = false;
    modalOverlay.hidden = false;
    editInput.focus();
    editInput.select();
  }

  function closeEditModal() {
    editModal.hidden = true;
    modalOverlay.hidden = true;
    editingId = null;
  }

  /* ── Event listeners ────────────────────────────────────────── */
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
    taskInput.focus();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  clearBtn.addEventListener('click', clearCompleted);

  saveEditBtn.addEventListener('click', saveEdit);
  cancelEditBtn.addEventListener('click', closeEditModal);
  modalOverlay.addEventListener('click', closeEditModal);

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') closeEditModal();
  });

  /* ── Init ───────────────────────────────────────────────────── */
  loadTasks();
  renderTasks();
})();
