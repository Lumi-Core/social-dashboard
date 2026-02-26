
const Reports = {
    reports: [],
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) this.init();
        this.loadReports();
    },

    bindEvents() {
        on('refreshReports',    'click', () => this.loadReports());
        on('generateReportBtn', 'click', () => this.toggleGenerateForm(true));
        on('cancelReportForm',  'click', () => this.toggleGenerateForm(false));
        on('submitReportBtn',   'click', () => this.generateReport());
        on('closeReportModal',  'click', () => closeModal('reportModal'));

        // Close modal on overlay click
        const modal = document.getElementById('reportModal');
        if (modal) {
            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => closeModal('reportModal'));
        }
    },

    toggleGenerateForm(show) {
        const card = $('reportGenerateCard');
        if (!card) return;
        card.style.display = show ? 'block' : 'none';
        if (show) {
            // Default date range: last 30 days
            const today      = new Date();
            const monthAgo   = new Date();
            monthAgo.setDate(today.getDate() - 30);
            const fmt = d => d.toISOString().substring(0, 10);
            const startEl = $('reportStartDate');
            const endEl   = $('reportEndDate');
            if (startEl && !startEl.value) startEl.value = fmt(monthAgo);
            if (endEl   && !endEl.value)   endEl.value   = fmt(today);
        }
    },

    async generateReport() {
        const type      = $('reportType')      ? $('reportType').value      : 'performance';
        const startDate = $('reportStartDate') ? $('reportStartDate').value : '';
        const endDate   = $('reportEndDate')   ? $('reportEndDate').value   : '';
        const notes     = $('reportNotes')     ? $('reportNotes').value     : '';

        if (!startDate || !endDate) {
            showToast('Please select a date range', 'warning');
            return;
        }

        try {
            showLoading('Generating report...');
            const result = await api.generateReport({
                report_type: type,
                start_date: startDate,
                end_date: endDate,
                notes: notes || undefined,
            });
            hideLoading();
            showToast('Report generated successfully!', 'success');
            this.toggleGenerateForm(false);
            await this.loadReports();
            // Auto-open the new report
            if (result && result.id) {
                await this.viewReport(result.id);
            }
        } catch (error) {
            hideLoading();
            showToast(`Failed to generate report: ${error.message}`, 'error');
        }
    },

    async loadReports() {
        try {
            showLoading('Loading reports...');
            this.reports = await api.listReports();
            if (!Array.isArray(this.reports)) this.reports = this.reports.reports || [];
            this.render();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load reports: ${error.message}`, 'error');
            this.reports = [];
            this.render();
        }
    },

    render() {
        const tbody = $('reportsTableBody');
        const empty = $('reportsEmpty');
        if (!tbody) return;

        if (!this.reports || this.reports.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">No reports yet</td></tr>`;
            show(empty);
            return;
        }

        hide(empty);
        tbody.innerHTML = this.reports.map(r => `
            <tr>
                <td><strong>#${r.id}</strong></td>
                <td><span class="status-badge" style="background:rgba(99,102,241,0.15);color:var(--primary);">${capitalize(r.report_type || 'performance')}</span></td>
                <td style="font-size:0.85rem;">${r.start_date || '—'} → ${r.end_date || '—'}</td>
                <td style="font-size:0.85rem;">${formatDateTime(r.created_at)}</td>
                <td><span class="status-badge ${getStatusClass(r.status || 'completed')}">${capitalize(r.status || 'completed')}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="Reports.viewReport(${r.id})" title="View Report">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async viewReport(id) {
        try {
            showLoading('Loading report...');
            const report = await api.getReport(id);
            hideLoading();

            const title = `Report #${id} — ${capitalize(report.report_type || 'performance')} (${report.start_date} → ${report.end_date})`;
            $('reportModalTitle').textContent = title;
            $('reportModalBody').innerHTML = this._renderReportBody(report);
            openModal('reportModal');
        } catch (error) {
            hideLoading();
            showToast(`Failed to load report: ${error.message}`, 'error');
        }
    },

    _renderReportBody(r) {
        const data = r.data || r.report_data || r;

        // If backend returned a nested summary/metrics object, render it nicely
        const sections = [];

        if (data.summary) {
            sections.push(`
                <div style="margin-bottom:20px;">
                    <h4 style="color:var(--primary);margin-bottom:10px;"><i class="fas fa-chart-pie"></i> Summary</h4>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
                        ${Object.entries(data.summary).map(([k, v]) => `
                            <div style="background:rgba(30,41,59,0.8);border-radius:8px;padding:12px;text-align:center;">
                                <div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">${typeof v === 'number' ? formatNumber(v) : v}</div>
                                <div style="font-size:0.8rem;color:var(--text-muted);">${k.replace(/_/g,' ')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>`);
        }

        if (data.top_posts && data.top_posts.length) {
            sections.push(`
                <div style="margin-bottom:20px;">
                    <h4 style="color:var(--primary);margin-bottom:10px;"><i class="fas fa-trophy"></i> Top Posts</h4>
                    <table class="data-table">
                        <thead><tr><th>Topic</th><th>Engagement</th><th>Reach</th><th>Views</th></tr></thead>
                        <tbody>
                            ${data.top_posts.map(p => `
                                <tr>
                                    <td>${truncate(p.topic || 'N/A', 35)}</td>
                                    <td>${p.engagement_score || p.engagement_rate || '—'}%</td>
                                    <td>${formatNumberShort(p.reach || 0)}</td>
                                    <td>${formatNumberShort(p.views || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`);
        }

        if (data.recommendations && data.recommendations.length) {
            sections.push(`
                <div style="margin-bottom:20px;">
                    <h4 style="color:var(--primary);margin-bottom:10px;"><i class="fas fa-lightbulb"></i> Recommendations</h4>
                    <ul style="list-style:none;padding:0;">
                        ${data.recommendations.map(rec => `
                            <li style="padding:8px 12px;margin-bottom:6px;background:rgba(99,102,241,0.08);border-left:3px solid var(--primary);border-radius:6px;font-size:0.9rem;">
                                ${escapeHtml(typeof rec === 'string' ? rec : rec.text || JSON.stringify(rec))}
                            </li>
                        `).join('')}
                    </ul>
                </div>`);
        }

        if (!sections.length) {
            // Fallback: pretty-print raw JSON
            sections.push(`
                <pre style="background:rgba(30,41,59,0.8);padding:16px;border-radius:8px;overflow-x:auto;font-size:0.82rem;line-height:1.5;color:var(--text-secondary);">
${escapeHtml(JSON.stringify(r, null, 2))}
                </pre>`);
        }

        if (r.notes) {
            sections.unshift(`<div style="padding:10px 14px;background:rgba(245,158,11,0.08);border-left:3px solid var(--warning);border-radius:6px;margin-bottom:16px;font-size:0.88rem;color:var(--text-secondary);">${escapeHtml(r.notes)}</div>`);
        }

        return sections.join('');
    },
};
