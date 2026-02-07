/**
 * Tasks Page Module
 */

const Tasks = {
    tasks: [],
    initialized: false,

    /**
     * Initialize tasks page
     */
    init() {
        this.bindEvents();
        this.initialized = true;
    },

    /**
     * Load tasks when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadTasks();
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        on('refreshTasks', 'click', () => this.loadTasks());
    },

    /**
     * Load agent tasks
     */
    async loadTasks() {
        try {
            showLoading('Loading tasks...');
            // API endpoint doesn't exist - show placeholder message
            this.tasks = [];
            this.render();
            hideLoading();
            showToast('Agent tasks endpoint not yet implemented', 'info');
        } catch (error) {
            hideLoading();
            showToast(`Failed to load tasks: ${error.message}`, 'error');
            this.tasks = [];
            this.render();
        }
    },

    /**
     * Render tasks table
     */
    render() {
        const tbody = $('tasksTableBody');
        const emptyState = $('tasksEmpty');
        const table = $('tasksTable');

        if (!tbody) return;

        if (!this.tasks || this.tasks.length === 0) {
            hide(table.parentElement);
            show(emptyState);
            return;
        }

        show(table.parentElement);
        hide(emptyState);

        tbody.innerHTML = this.tasks.map(task => {
            const duration = this.calculateDuration(task.created_at, task.completed_at);
            
            return `
                <tr>
                    <td>
                        <code style="font-size: 0.8rem;">${truncate(task.task_id || task.id || 'N/A', 12)}</code>
                    </td>
                    <td>
                        <span class="status-badge scheduled">${task.type || task.task_type || 'workflow'}</span>
                    </td>
                    <td>
                        <span class="status-badge ${getStatusClass(task.status)}">
                            <i class="fas ${getStatusIcon(task.status)}"></i>
                            ${capitalize(task.status || 'unknown')}
                        </span>
                    </td>
                    <td>${formatDateTime(task.created_at)}</td>
                    <td>${task.completed_at ? formatDateTime(task.completed_at) : '-'}</td>
                    <td>${duration}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="Tasks.viewDetails('${task.task_id || task.id}')" title="View Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Calculate task duration
     */
    calculateDuration(start, end) {
        if (!start) return '-';
        
        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();
        const diff = Math.abs(endDate - startDate) / 1000; // in seconds

        if (diff < 60) return `${Math.round(diff)}s`;
        if (diff < 3600) return `${Math.round(diff / 60)}m`;
        return `${Math.round(diff / 3600)}h ${Math.round((diff % 3600) / 60)}m`;
    },

    /**
     * View task details
     */
    viewDetails(taskId) {
        const task = this.tasks.find(t => (t.task_id || t.id) === taskId);
        
        if (!task) {
            showToast('Task not found', 'warning');
            return;
        }

        // Create a simple details modal
        const details = `
            <strong>Task ID:</strong> ${task.task_id || task.id}<br>
            <strong>Type:</strong> ${task.type || task.task_type || 'workflow'}<br>
            <strong>Status:</strong> ${task.status || 'unknown'}<br>
            <strong>Created:</strong> ${formatDateTime(task.created_at)}<br>
            <strong>Completed:</strong> ${task.completed_at ? formatDateTime(task.completed_at) : 'In progress'}<br>
            ${task.result ? `<strong>Result:</strong> <pre>${JSON.stringify(task.result, null, 2)}</pre>` : ''}
            ${task.error ? `<strong>Error:</strong> ${escapeHtml(task.error)}` : ''}
        `;

        // Use confirm modal for now
        $('confirmTitle').textContent = 'Task Details';
        $('confirmMessage').innerHTML = details;
        $('confirmAction').style.display = 'none';
        $('cancelConfirm').textContent = 'Close';
        
        openModal('confirmModal');
        
        // Reset modal on close
        on('cancelConfirm', 'click', () => {
            closeModal('confirmModal');
            $('confirmAction').style.display = '';
            $('cancelConfirm').textContent = 'Cancel';
        });
    },
};
