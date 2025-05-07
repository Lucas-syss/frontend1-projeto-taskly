let currentFilter = 'all';
let allTasks = [];
let onlineMode = true;

window.addEventListener('DOMContentLoaded', () => {
    checkOnlineStatus();
    fetchTasks();

    setInterval(updateClock, 1000);
    updateClock();

    document.getElementById('add-task-form').addEventListener('submit', handleAddTask);
    document.getElementById('edit-task-form').addEventListener('submit', handleEditTask);

    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks(allTasks);
        });
    });

    document.getElementById('searchInput').addEventListener('input', () => {
        renderTasks(allTasks);
    });

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
});

function checkOnlineStatus() {
    onlineMode = navigator.onLine;
}

async function fetchTasks() {
    if (onlineMode) {
        try {
            const response = await fetch("https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks", {
                method: 'GET',
                headers: { 'content-type': 'application/json' },
            });

            if (response.ok) {
                allTasks = await response.json();
                localStorage.setItem('tasks', JSON.stringify(allTasks));
            }
        } catch (error) {
            console.error('Error fetching tasks from MockAPI', error);
            allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        }
    } else {
        allTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    }
    renderTasks(allTasks);
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = (
            currentFilter === 'done' ? task.isDone :
                currentFilter === 'not-done' ? !task.isDone : true
        );

        const matchesSearch = (
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );

        return matchesFilter && matchesSearch;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<p class="text-center text-muted">No tasks found.</p>`;
        return;
    }

    filteredTasks.forEach(task => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        col.innerHTML = `
        <div class="card task-card border-${task.isDone ? 'success' : 'secondary'}">
            <div class="card-body d-flex flex-column">
                <h2 class="card-title d-flex justify-content-between align-items-center" ${task.isDone ? 'style=color:grey;' : ''}>
                    ${task.title}
                    <div class="form-check form-switch">
                        <input class="form-check-input task-toggle" type="checkbox" aria-label="taskToggle" data-id="${task.id}" ${task.isDone ? 'checked' : ''}>
                    </div>
                </h2>
                <p class="card-text" ${task.isDone ? 'style=color:grey;' : ''}>${task.description}</p>
        
                <div class="mt-auto">
                    <p class="text-muted"><small>Created: ${new Date(task.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}</small></p>
                <span class="w-100 badge bg-${task.isDone ? 'success' : 'warning'}">
                    ${task.isDone ? '✅ Done' : '❌ Not done'}
                </span>
                    <div class="mt-3 d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${task.id}">✏️ Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        taskList.appendChild(col);
    });

    document.querySelectorAll('.task-toggle').forEach(toggle => {
        toggle.addEventListener('change', handleToggleDone);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-id');
            const task = allTasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('editTaskId').value = task.id;
                document.getElementById('editTaskTitle').value = task.title;
                document.getElementById('editTaskDescription').value = task.description;
                new bootstrap.Modal(document.getElementById('editTaskModal')).show();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-id');
            handleDelete(taskId);
        });
    });
}

async function handleAddTask(e) {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    if (!title || !description) return;

    const newTask = {
        id: Date.now().toString(),
        title,
        description,
        isDone: false,
        createdAt: new Date().toISOString()
    };

    allTasks.push(newTask);
    saveTasks();

    if (onlineMode) {
        try {
            const response = await fetch("https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });

            if (response.ok) {
                const createdTask = await response.json();

                newTask.id = createdTask.id;
                saveTasks();
            }
        } catch (error) {
            console.error("Error adding task to MockAPI:", error);
        }
    }

    renderTasks(allTasks);

    document.getElementById('add-task-form').reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
    modal.hide();
}


function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(allTasks));
}

async function handleEditTask(e) {
    e.preventDefault();

    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();

    const task = allTasks.find(t => t.id === id);
    if (task) {
        task.title = title;
        task.description = description;
        task.updatedAt = new Date().toISOString();

        saveTasks();
        renderTasks(allTasks);

        if (onlineMode) {
            try {
                await fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                });
            } catch (error) {
                console.error("Error updating task on MockAPI:", error);
            }
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        modal.hide();
    }
}

async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    allTasks = allTasks.filter(t => t.id !== id);

    saveTasks();

    renderTasks(allTasks);

    if (onlineMode) {
        try {
            await fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${id}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error("Error deleting task from MockAPI:", error);
        }
    }
}



function handleToggleDone(e) {
    const taskId = e.target.getAttribute('data-id');
    const task = allTasks.find(t => t.id === taskId);

    if (task) {
        task.isDone = e.target.checked;
        saveTasks();
        renderTasks(allTasks);

        if (onlineMode) {
            fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            }).catch((error) => {
                console.error("Error updating task status on MockAPI:", error);
            });
        }
    }
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    document.getElementById('clock').innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}