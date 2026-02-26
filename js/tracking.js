
const Tracking = {
    posts: [],
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadTracking();
    },

    bindEvents() {
        on('refreshTracking', 'click', () => App.refreshAll());
        on('exportTracking', 'click', () => this.exportData());
    },

    async loadTracking() {
        try {
            showLoading('Loading tracking data...');
            this.posts = await api.getTracking();
            this.renderTable();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load tracking: ${error.message}`, 'error');
            this.posts = [];
            this.renderTable();
        }
    },

    renderTable() {
        const tbody = $('trackingTableBody');
        const emptyState = $('trackingEmpty');
        const table = $('trackingTable');

        if (!tbody) return;

        if (!this.posts || this.posts.length === 0) {
            hide(table.parentElement);
            show(emptyState);
            return;
        }

        show(table.parentElement);
        hide(emptyState);

        tbody.innerHTML = this.posts.map(post => `
            <tr>
                <td><strong>#${post.id || 'N/A'}</strong></td>
                <td>
                    <code style="font-size: 0.8rem;">${truncate(post.media_id || post.instagram_media_id || 'N/A', 20)}</code>
                </td>
                <td>${formatDateTime(post.published_at)}</td>
                <td>${truncate(post.topic || 'N/A', 35)}</td>
                <td>
                    <span class="status-badge scheduled">${post.post_kind || 'image'}</span>
                </td>
                <td>
                    <span class="status-badge ${getStatusClass(post.tracking_status || 'tracked')}">
                        ${post.tracking_status || 'Tracked'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="Tracking.viewMetrics('${post.media_id || post.instagram_media_id}')" title="View Metrics">
                        <i class="fas fa-chart-line"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async viewMetrics(mediaId) {
        if (!mediaId || mediaId === 'N/A') {
            showToast('No media ID available for this post', 'warning');
            return;
        }

        try {
            showLoading('Loading metrics...');
            const metrics = await api.getMetricsForPost(mediaId);
            hideLoading();
            
            App.navigateTo('metrics');
            
            setTimeout(() => {
                showToast(`Metrics loaded for media ID: ${truncate(mediaId, 15)}`, 'info');
            }, 300);
        } catch (error) {
            hideLoading();
            showToast(`Failed to load metrics: ${error.message}`, 'error');
        }
    },

    exportData() {
        if (!this.posts || this.posts.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const exportData = this.posts.map(post => ({
            ID: post.id,
            'Media ID': post.media_id || post.instagram_media_id,
            'Published At': post.published_at,
            Topic: post.topic,
            'Post Kind': post.post_kind,
            Status: post.tracking_status,
        }));

        exportToCSV(exportData, `tracking_export_${getToday()}.csv`);
    },
};
