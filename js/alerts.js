
const Alerts = {
    alerts: [],
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) this.init();
        this.loadAlerts();
    },

    bindEvents() {
        on('refreshAlerts',      'click', () => this.loadAlerts());
        on('dismissAllAlertsBtn','click', () => this.dismissAll());
        on('alertTypeFilter',    'change', () => this.loadAlerts());
        on('alertStatusFilter',  'change', () => this.loadAlerts());
    },

    buildParams() {
        const type   = $('alertTypeFilter')   ? $('alertTypeFilter').value   : '';
        const status = $('alertStatusFilter') ? $('alertStatusFilter').value : 'active';
        const params = {};
        if (type)   params.alert_type     = type;
        if (status) params.status         = status;
        return params;
    },

    async loadAlerts() {
        try {
            showLoading('Loading alerts...');
            const response = await api.getAlerts(this.buildParams());
            // Normalise: API may return an array directly, or wrap it
            if (Array.isArray(response)) {
                this.alerts = response;
            } else if (response && Array.isArray(response.alerts)) {
                this.alerts = response.alerts;
            } else if (response && Array.isArray(response.data)) {
                this.alerts = response.data;
            } else {
                this.alerts = [];
            }
            this.updateBadge();
            this.render();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load alerts: ${error.message}`, 'error');
            this.alerts = [];
            this.render();
        }
    },

    async updateBadge() {
        try {
            const data = await api.getAlertCount();
            const count = data.active_count || 0;

            // Header bell badge
            const badge = $('notificationBadge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'inline' : 'none';
            }
            // Sidebar nav badge
            const navBadge = $('alertsNavBadge');
            if (navBadge) {
                navBadge.textContent = count;
                navBadge.classList.toggle('hidden', count === 0);
            }
        } catch (e) { /* silent */ }
    },

    async dismissAll() {
        if (!confirm('Dismiss all active alerts?')) return;
        try {
            showLoading('Dismissing all alerts...');
            await api.dismissAllAlerts();
            hideLoading();
            showToast('All alerts dismissed', 'success');
            await this.loadAlerts();
        } catch (error) {
            hideLoading();
            showToast(`Failed to dismiss: ${error.message}`, 'error');
        }
    },

    async dismissOne(id) {
        try {
            await api.dismissAlert(id);
            showToast('Alert dismissed', 'info');
            await this.loadAlerts();
        } catch (error) {
            showToast(`Failed to dismiss: ${error.message}`, 'error');
        }
    },

    render() {
        const list   = $('alertsList');
        const empty  = $('alertsEmpty');
        if (!list) return;

        if (!this.alerts || this.alerts.length === 0) {
            list.innerHTML = '';
            show(empty);
            return;
        }

        hide(empty);
        list.innerHTML = this.alerts.map(a => this._renderCard(a)).join('');
    },

    _renderCard(a) {
        const typeIcons = {
            error:   'fa-times-circle',
            warning: 'fa-exclamation-triangle',
            info:    'fa-info-circle',
            success: 'fa-check-circle',
        };
        const typeColors = {
            error:   'var(--danger)',
            warning: 'var(--warning)',
            info:    'var(--info, #06b6d4)',
            success: 'var(--success)',
        };
        const icon  = typeIcons[a.alert_type]  || 'fa-bell';
        const color = typeColors[a.alert_type] || 'var(--text-secondary)';
        const isDismissed = a.status === 'dismissed';

        return `
        <div class="alert-card ${isDismissed ? 'alert-dismissed' : ''}" style="
            background: rgba(30,41,59,0.7);
            border: 1px solid rgba(255,255,255,0.08);
            border-left: 4px solid ${color};
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 10px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            opacity: ${isDismissed ? '0.5' : '1'};
        ">
            <div style="color:${color};font-size:1.4rem;min-width:24px;margin-top:2px;">
                <i class="fas ${icon}"></i>
            </div>
            <div style="flex:1;">
                <div style="font-weight:600;color:var(--text-primary);margin-bottom:4px;">${escapeHtml(a.title || a.alert_type || 'Alert')}</div>
                <div style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(a.message || '')}</div>
                ${a.created_at ? `<div style="margin-top:6px;font-size:0.78rem;color:var(--text-muted);">${formatDateTime(a.created_at)}</div>` : ''}
                ${a.related_entry_id ? `<div style="margin-top:4px;font-size:0.8rem;color:var(--primary);">Entry #${a.related_entry_id}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;min-width:80px;align-items:flex-end;">
                <span class="status-badge" style="background:${isDismissed ? 'rgba(148,163,184,0.15)' : 'rgba(99,102,241,0.15)'};color:${isDismissed ? 'var(--text-muted)' : color};border-radius:6px;padding:2px 8px;font-size:0.75rem;">
                    ${isDismissed ? 'Dismissed' : capitalize(a.alert_type || 'info')}
                </span>
                ${!isDismissed ? `
                <button class="btn btn-sm btn-secondary" onclick="Alerts.dismissOne(${a.id})" style="font-size:0.78rem;padding:4px 10px;">
                    <i class="fas fa-times"></i> Dismiss
                </button>` : ''}
            </div>
        </div>`;
    },
};
