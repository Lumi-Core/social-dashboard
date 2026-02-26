
const Logs = {
    errors: [],
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadLogs();
    },

    bindEvents() {
        on('refreshLogs', 'click', () => this.loadLogs());
        on('clearLogs', 'click', () => this.clearLogs());
    },

    async loadLogs() {
        try {
            showLoading('Loading logs...');
            
            const [errors, errorLogs] = await Promise.all([
                api.getErrors().catch(() => []),
                api.getErrorLogs().catch(() => []),
            ]);

            this.errors = [...errors, ...errorLogs].sort((a, b) => {
                const dateA = new Date(a.timestamp || a.created_at || 0);
                const dateB = new Date(b.timestamp || b.created_at || 0);
                return dateB - dateA;
            });

            this.render();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load logs: ${error.message}`, 'error');
            this.errors = [];
            this.render();
        }
    },

    render() {
        const container = $('logsContainer');
        const emptyState = $('logsEmpty');

        if (!container) return;

        if (!this.errors || this.errors.length === 0) {
            hide(container);
            show(emptyState);
            return;
        }

        show(container);
        hide(emptyState);

        container.innerHTML = this.errors.map(log => {
            const level = (log.level || log.severity || 'error').toLowerCase();
            const timestamp = log.timestamp || log.created_at || new Date().toISOString();
            const message = log.message || log.error || log.details || 'Unknown error';
            
            return `
                <div class="log-entry ${level}">
                    <span class="log-timestamp">${formatDateTime(timestamp)}</span>
                    <span class="log-level">[${level.toUpperCase()}]</span>
                    <span class="log-message">${escapeHtml(message)}</span>
                    ${log.stack ? `<pre class="log-stack">${escapeHtml(log.stack)}</pre>` : ''}
                </div>
            `;
        }).join('');
    },

    clearLogs() {
        if (!confirm('Clear all logs from display? (This does not delete server logs)')) {
            return;
        }

        this.errors = [];
        this.render();
        showToast('Logs cleared from display', 'info');
    },
};
