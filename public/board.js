const summary = document.getElementById('summary');
const list = document.getElementById('tasks');

async function loadTasks() {
  const response = await fetch('/api/tasks');
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  const { tasks } = await response.json();
  list.replaceChildren(
    ...tasks.map((task) => {
      const item = document.createElement('li');
      item.textContent = `${task.done ? '✓' : '○'} ${task.title} (${task.owner})`;
      return item;
    }),
  );
  const open = tasks.filter((task) => !task.done).length;
  summary.textContent = `${open} open of ${tasks.length}`;
}

loadTasks().catch((error) => {
  summary.textContent = `Could not load tasks: ${error.message}`;
});
