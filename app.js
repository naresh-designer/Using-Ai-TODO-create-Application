const STORAGE_KEY = 'done-today-tasks';

// Keep the full task collection in one place; the active filter only affects rendering.
const state = {
  tasks: loadTasks(),
  filter: 'all'
};

const elements = {
  form: document.querySelector('#addForm'),
  input: document.querySelector('#taskInput'),
  list: document.querySelector('#taskList'),
  empty: document.querySelector('#emptyState'),
  emptyTitle: document.querySelector('#emptyTitle'),
  emptyMessage: document.querySelector('#emptyMessage'),
  allCount: document.querySelector('#allCount'),
  activeCount: document.querySelector('#activeCount'),
  completedCount: document.querySelector('#completedCount'),
  progress: document.querySelector('#progressPercent'),
  today: document.querySelector('#todayDate'),
  clear: document.querySelector('#clearCompleted')
};

elements.today.textContent = new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'short', day: 'numeric'
}).format(new Date());

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = elements.input.value.trim();
  if (!title) return;

  state.tasks.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    completed: false,
    createdAt: Date.now()
  });
  elements.input.value = '';
  saveAndRender();
});

document.querySelectorAll('.filter-button').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('active', item === button));
    render();
  });
});

// One listener handles current and newly rendered task controls.
elements.list.addEventListener('click', (event) => {
  const taskElement = event.target.closest('.task');
  if (!taskElement) return;
  const task = state.tasks.find((item) => item.id === taskElement.dataset.id);
  if (!task) return;

  if (event.target.closest('.check-button')) {
    task.completed = !task.completed;
    saveAndRender();
  }

  if (event.target.closest('.delete-button')) {
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    saveAndRender();
  }
});

elements.clear.addEventListener('click', () => {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveAndRender();
});

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  render();
}

// Rebuild the visible list and summary values from the current state.
function render() {
  const visibleTasks = state.tasks.filter((task) => {
    if (state.filter === 'active') return !task.completed;
    if (state.filter === 'completed') return task.completed;
    return true;
  });
  const completedCount = state.tasks.filter((task) => task.completed).length;
  const activeCount = state.tasks.length - completedCount;
  const progress = state.tasks.length ? Math.round((completedCount / state.tasks.length) * 100) : 0;

  elements.allCount.textContent = state.tasks.length;
  elements.activeCount.textContent = activeCount;
  elements.completedCount.textContent = completedCount;
  elements.progress.textContent = `${progress}%`;
  elements.clear.disabled = completedCount === 0;
  elements.clear.style.opacity = completedCount === 0 ? '.45' : '1';

  elements.list.innerHTML = visibleTasks.map(createTaskMarkup).join('');
  elements.empty.hidden = visibleTasks.length > 0;

  if (state.tasks.length === 0) {
    elements.emptyTitle.textContent = 'A clean slate.';
    elements.emptyMessage.textContent = 'Add a task and turn intention into action.';
  } else if (visibleTasks.length === 0) {
    elements.emptyTitle.textContent = 'Nothing hiding here.';
    elements.emptyMessage.textContent = 'Try another filter or add a new task.';
  }
}

function createTaskMarkup(task) {
  const createdAt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(task.createdAt);
  return `
    <article class="task ${task.completed ? 'is-complete' : ''}" data-id="${task.id}">
      <button class="check-button" type="button" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}">✓</button>
      <div class="task-content">
        <div class="task-text">${escapeHtml(task.title)}</div>
        <div class="task-time">Added at ${createdAt}</div>
      </div>
      <button class="delete-button" type="button" aria-label="Delete task">×</button>
    </article>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

render();
