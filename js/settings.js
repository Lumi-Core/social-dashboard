
const Settings = {
    config: null,
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadSettings();
        this.loadDbStats();
    },

    bindEvents() {
        on('saveApiSettings', 'click', () => this.saveApiSettings());
        on('refreshConfig', 'click', () => this.loadConfig());
        on('triggerSchedulerBtn', 'click', () => this.triggerScheduler());
        on('saveGenerationInstructions', 'click', () => this.saveGenerationInstructions());
        on('cleanDbBtn', 'click', () => this.cleanDatabase('all'));
        on('refreshDbStats', 'click', () => this.loadDbStats());
        on('savePlatformInstructions', 'click', () => this.savePlatformInstructions());

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-clean-table]');
            if (btn) {
                const table = btn.getAttribute('data-clean-table');
                this.cleanDatabase(table);
            }
            const ptab = e.target.closest('[data-platform-tab]');
            if (ptab) {
                this.selectPlatformTab(ptab.getAttribute('data-platform-tab'));
            }
        });
    },

    async loadSettings() {
        
        $('apiBaseUrl').value = api.baseUrl;
        $('apiKey').value = api.apiKey;

        await this.loadConfig();
        await this.loadSystemInfo();
        await this.loadSchedulerStatus();
        await this.loadGenerationInstructions();
        await this.loadPlatformInstructions();
    },

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
        
        this.loadConfig();
    },

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
                { key: 'Generation Instructions', value: this.config.generation_instructions ? 'Configured ✓' : 'Not set' },
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

    async loadGenerationInstructions() {
        const textarea = $('generationInstructions');
        if (!textarea) return;

        try {
            const data = await api.getGenerationInstructions();
            textarea.value = data.instructions || '';
        } catch (error) {
            console.error('Failed to load generation instructions:', error);
        }
    },

    async saveGenerationInstructions() {
        const textarea = $('generationInstructions');
        if (!textarea) return;

        try {
            showLoading('Saving instructions...');
            await api.updateGenerationInstructions(textarea.value);
            hideLoading();
            showToast('Generation instructions saved!', 'success');
        } catch (error) {
            hideLoading();
            showToast(`Failed to save instructions: ${error.message}`, 'error');
        }
    },

    async loadDbStats() {
        try {
            const stats = await api.getDbStats();
            
            const calEl = $('dbCalendarCount');
            const trkEl = $('dbTrackingCount');
            if (calEl) calEl.textContent = `${stats.calendar?.total ?? '—'} rows`;
            if (trkEl) trkEl.textContent = `${stats.tracking?.total_published ?? '—'} rows`;

            const breakdownEl = $('dbStatusBreakdown');
            if (breakdownEl && stats.calendar?.status_breakdown) {
                const badges = Object.entries(stats.calendar.status_breakdown)
                    .map(([status, count]) => {
                        let color = '#94a3b8';
                        if (status === 'Posted') color = '#34d399';
                        else if (status === 'Pending') color = '#f59e0b';
                        else if (status === 'Failed') color = '#f87171';
                        else if (status === 'Awaiting Approval') color = '#818cf8';
                        return `<span style="display:inline-block;padding:4px 10px;margin:3px;border-radius:6px;background:rgba(0,0,0,0.2);color:${color};font-size:0.8rem;">${escapeHtml(status)}: <strong>${count}</strong></span>`;
                    }).join('');
                breakdownEl.innerHTML = `<div style="margin-bottom:4px;color:var(--text-secondary);font-weight:600;font-size:0.8rem;">Calendar Status Breakdown</div>${badges || '<span class="text-muted">No entries</span>'}`;
            }
        } catch (e) {
            
        }
    },

    async cleanDatabase(tables = 'all') {
        const tableLabel = tables === 'all' ? 'ALL tables (Calendar + Tracking)'
                         : tables === 'calendar' ? 'social_media_calendar' : 'published_posts_tracking';

        if (!confirm(`⚠️ WARNING: This will permanently delete ALL data from ${tableLabel}.\n\nThis CANNOT be undone. Are you sure?`)) return;
        if (!confirm('Final confirmation: Delete ALL selected data?')) return;

        const resultDiv = $('cleanDbResult');
        try {
            showLoading(`Cleaning ${tableLabel}...`);
            const result = await api.cleanDatabase(tables);
            hideLoading();
            if (result.success) {
                const summary = Object.entries(result.deleted || {})
                    .map(([t, c]) => `${t}: ${c} rows`).join(', ');
                showToast(`Database cleaned! ${summary}`, 'success');
                if (resultDiv) resultDiv.innerHTML = `<div style="padding:10px;background:rgba(16,185,129,0.1);border-radius:8px;color:var(--success);margin-top:8px;"><i class="fas fa-check-circle"></i> ${escapeHtml(result.message || summary)}</div>`;
                await this.loadDbStats();
                await App.refreshAll();
            }
        } catch (error) {
            hideLoading();
            showToast(`Failed to clean database: ${error.message}`, 'error');
            if (resultDiv) resultDiv.innerHTML = `<div style="padding:10px;background:rgba(239,68,68,0.1);border-radius:8px;color:var(--danger);margin-top:8px;"><i class="fas fa-times-circle"></i> Error: ${escapeHtml(error.message)}</div>`;
        }
    },

    // ── Platform-Specific Instructions ────────────────────────
    _platformData: {},
    _selectedPlatform: null,

    async loadPlatformInstructions() {
        const tabsEl = $('platformTabs');
        if (!tabsEl) return;
        try {
            const data = await api.getAllPlatformInstructions();
            // data is either an array or object keyed by platform
            let platforms = [];
            if (Array.isArray(data)) {
                platforms = data;
            } else if (data && typeof data === 'object') {
                platforms = Object.keys(data).map(k => ({
                    platform: k,
                    instructions: typeof data[k] === 'string' ? data[k] : (data[k].instructions || ''),
                }));
            }

            // Fallback known platforms if none returned
            const knownPlatforms = ['instagram', 'tiktok', 'twitter', 'facebook', 'linkedin'];
            if (!platforms.length) {
                platforms = knownPlatforms.map(p => ({ platform: p, instructions: '' }));
            }

            // Store for later
            this._platformData = {};
            platforms.forEach(p => { this._platformData[p.platform] = p.instructions || ''; });

            // Build tabs
            tabsEl.innerHTML = platforms.map(p => `
                <button class="btn btn-sm btn-secondary" data-platform-tab="${escapeHtml(p.platform)}" style="text-transform:capitalize;">
                    <i class="fas fa-${p.platform === 'instagram' ? 'instagram' : p.platform === 'tiktok' ? 'music' : p.platform === 'twitter' ? 'twitter' : p.platform === 'facebook' ? 'facebook' : 'linkedin'} fa-brands"></i>
                    ${capitalize(p.platform)}
                </button>
            `).join('');

            // Select first
            if (platforms.length) this.selectPlatformTab(platforms[0].platform);
        } catch (e) {
            if (tabsEl) tabsEl.innerHTML = '<span class="text-muted" style="font-size:0.85rem;">Platform instructions not available</span>';
        }
    },

    selectPlatformTab(platform) {
        this._selectedPlatform = platform;

        // Highlight active tab
        document.querySelectorAll('[data-platform-tab]').forEach(btn => {
            btn.classList.toggle('btn-primary', btn.getAttribute('data-platform-tab') === platform);
            btn.classList.toggle('btn-secondary', btn.getAttribute('data-platform-tab') !== platform);
        });

        const label = $('platformInstructionsLabel');
        if (label) label.textContent = `${capitalize(platform)} Instructions`;

        const textarea = $('platformInstructionsText');
        if (textarea) textarea.value = this._platformData[platform] || '';

        const saveBtn = $('savePlatformInstructions');
        if (saveBtn) {
            saveBtn.disabled = false;
            const nameSpan = $('currentPlatformName');
            if (nameSpan) nameSpan.setAttribute('data-platform', platform);
        }
    },

    async savePlatformInstructions() {
        const platform = this._selectedPlatform;
        if (!platform) { showToast('Select a platform first', 'warning'); return; }
        const text = $('platformInstructionsText');
        if (!text) return;
        try {
            showLoading(`Saving ${platform} instructions...`);
            await api.updatePlatformInstructions(platform, text.value);
            this._platformData[platform] = text.value;
            hideLoading();
            showToast(`${capitalize(platform)} instructions saved!`, 'success');
        } catch (e) {
            hideLoading();
            showToast(`Failed to save: ${e.message}`, 'error');
        }
    },
};
