/**
 * Settings Page Module
 */

const Settings = {
    config: null,
    initialized: false,

    /**
     * Initialize settings page
     */
    init() {
        this.bindEvents();
        this.initialized = true;
    },

    /**
     * Load settings when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadSettings();
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        on('saveApiSettings', 'click', () => this.saveApiSettings());
        on('refreshConfig', 'click', () => this.loadConfig());
        on('triggerSchedulerBtn', 'click', () => this.triggerScheduler());
    },

    /**
     * Load all settings
     */
    async loadSettings() {
        // Load saved API settings
        $('apiBaseUrl').value = api.baseUrl;
        $('apiKey').value = api.apiKey;

        // Load config from server
        await this.loadConfig();
        await this.loadSystemInfo();
        await this.loadSchedulerStatus();
    },

    /**
     * Save API settings
     */
    saveApiSettings() {
        const baseUrl = $('apiBaseUrl').value.trim();
        const apiKey = $('apiKey').value.trim();

        if (!baseUrl) {
            showToast('Please enter API Base URL', 'warning');
            return;
        }

        if (!isValidUrl(baseUrl)) {
            showToast('Please enter a valid URL', 'warning');
            return;
        }

        api.setBaseUrl(baseUrl);
        api.setApiKey(apiKey);

        showToast('API settings saved successfully!', 'success');
        
        // Reload config to test connection
        this.loadConfig();
    },

    /**
     * Load configuration from server
     */
    async loadConfig() {
        const container = $('configDisplay');
        if (!container) return;

        try {
            this.config = await api.getConfig();
            
            const configItems = [
                { key: 'Environment', value: this.config.environment },
                { key: 'Debug', value: this.config.debug ? 'Enabled' : 'Disabled' },
                { key: 'Host', value: this.config.host },
                { key: 'Port', value: this.config.port },
                { key: 'Base URL', value: this.config.base_url },
                { key: 'OpenAI Content Model', value: this.config.openai_model_content },
                { key: 'OpenAI Eval Model', value: this.config.openai_model_evaluation },
                { key: 'Scheduler Enabled', value: this.config.scheduler_enabled ? 'Yes' : 'No' },
                { key: 'Scheduler Time', value: this.config.scheduler_time },
                { key: 'Timezone', value: this.config.scheduler_timezone },
                { key: 'Min Eval Score', value: this.config.min_evaluation_score },
                { key: 'Max Revisions', value: this.config.max_revision_attempts },
                { key: 'SerpAPI', value: this.config.enable_serpapi ? 'Enabled' : 'Disabled' },
                { key: 'Gmail API', value: this.config.use_gmail_api ? 'Enabled' : 'Disabled' },
                { key: 'Company', value: this.config.company_name },
            ];

            container.innerHTML = configItems.map(item => `
                <div class="config-item">
                    <span class="config-key">${item.key}</span>
                    <span class="config-value">${item.value || 'N/A'}</span>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = `
                <div class="alert" style="padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: var(--border-radius); color: var(--danger);">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load configuration. Check API connection.
                </div>
            `;
        }
    },

    /**
     * Load system information
     */
    async loadSystemInfo() {
        const container = $('systemInfo');
        if (!container) return;

        try {
            const [root, healthLive] = await Promise.all([
                api.getRoot().catch(() => ({})),
                api.getHealthLive().catch(() => ({})),
            ]);

            const infoItems = [
                { key: 'Service Name', value: root.name || 'Social Media Agent' },
                { key: 'Version', value: root.version || '1.0.0' },
                { key: 'Status', value: root.status || 'running' },
                { key: 'Uptime', value: healthLive.uptime_seconds ? `${Math.round(healthLive.uptime_seconds / 60)} minutes` : 'N/A' },
                { key: 'Last Check', value: formatDateTime(healthLive.timestamp) },
            ];

            container.innerHTML = infoItems.map(item => `
                <div class="info-row">
                    <span class="config-key">${item.key}</span>
                    <span class="config-value">${item.value}</span>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<p class="text-muted">Failed to load system info</p>';
        }
    },

    /**
     * Load scheduler status
     */
    async loadSchedulerStatus() {
        const container = $('schedulerStatus');
        if (!container) return;

        try {
            const status = await api.getSchedulerStatus();

            container.innerHTML = `
                <div class="info-row">
                    <span class="config-key">Status</span>
                    <span class="config-value ${status.running ? 'text-success' : 'text-danger'}">
                        ${status.running ? '● Running' : '○ Stopped'}
                    </span>
                </div>
                <div class="info-row">
                    <span class="config-key">Enabled</span>
                    <span class="config-value">${status.enabled ? 'Yes' : 'No'}</span>
                </div>
                <div class="info-row">
                    <span class="config-key">Schedule</span>
                    <span class="config-value">${status.scheduled_time || 'N/A'} ${status.timezone || ''}</span>
                </div>
                <div class="info-row">
                    <span class="config-key">Next Run</span>
                    <span class="config-value">${status.next_run ? formatDateTime(status.next_run) : 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="config-key">Active Jobs</span>
                    <span class="config-value">${status.job_count || 0}</span>
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<p class="text-muted">Failed to load scheduler status</p>';
        }
    },

    /**
     * Trigger scheduler manually
     */
    async triggerScheduler() {
        try {
            showLoading('Triggering scheduler...');
            await api.triggerScheduler();
            hideLoading();
            showToast('Scheduler triggered successfully!', 'success');
            this.loadSchedulerStatus();
        } catch (error) {
            hideLoading();
            showToast(`Failed to trigger scheduler: ${error.message}`, 'error');
        }
    },
};
