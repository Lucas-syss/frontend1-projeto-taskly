let currentFilter = 'all';
let allTasks = [];

window.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    setInterval(updateClock, 1000);
    updateClock();

    document.getElementById('add-task-form').addEventListener('submit', handleAddTask);

    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks(allTasks);
        });
    });
});

document.getElementById('searchInput').addEventListener('input', () => {
    renderTasks(allTasks);
});


function updateClock() {
    const clock = document.getElementById("clock");
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clock.textContent = `${hours}:${minutes}`;
}

async function handleAddTask(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    if (!title || !description) return;

    try {
        const response = await fetch("https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks", {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title, description, isDone: false, createdAt: new Date().toISOString() })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            modal.hide();
            e.target.reset();
            fetchTasks();
        }
    } catch (error) {
        console.error("Error adding task:", error);
    }
}

document.getElementById('edit-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();

    try {
        const response = await fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            modal.hide();
            fetchTasks();
        }
    } catch (error) {
        console.error("Error updating task:", error);
    }
});


async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            fetchTasks();
        }
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}


async function fetchTasks() {
    try {
        const response = await fetch("https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks", {
            method: 'GET',
            headers: { 'content-type': 'application/json' },
        });

        if (response.ok) {
            allTasks = await response.json();
            renderTasks(allTasks);
        } else {
            console.error("Error fetching tasks:", response.statusText);
        }
    } catch (error) {
        console.error("Error fetching tasks:", error);
    }
}

async function handleToggleDone(event) {
    const taskId = event.target.getAttribute('data-id');
    const isDone = event.target.checked;

    if (isDone) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
    

    try {
        const response = await fetch(`https://6819044b5a4b07b9d1d1b272.mockapi.io/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDone })
        });

        if (response.ok) {
            fetchTasks();
        } else {
            console.error("Failed to update task.");
        }
    } catch (error) {
        console.error("Error updating task status:", error);
    }
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
                <div class="card-body">
                    <h5 class="card-title d-flex justify-content-between align-items-center">
                        ${task.title}
                        <div class="form-check form-switch">
                            <input class="form-check-input task-toggle" type="checkbox" 
                                   data-id="${task.id}" ${task.isDone ? 'checked' : ''}>
                        </div>
                    </h5>
                    <p class="card-text">${task.description}</p>
                    <p class="text-muted"><small>Created: ${new Date(task.createdAt).toLocaleString()}</small></p>
                    <span class="badge bg-${task.isDone ? 'success' : 'warning'}">
                        ${task.isDone ? '✅ Done' : '❌ Not done'}
                    </span>
                    <div class="mt-3 d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${task.id}">✏️ Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
        taskList.appendChild(col);
    });

    document.querySelectorAll('.task-toggle').forEach(toggle => {
        toggle.addEventListener('change', handleToggleDone);
    });

    // Edit button
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

    // Delete button
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-id');
            handleDelete(taskId);
        });
    });

}

    