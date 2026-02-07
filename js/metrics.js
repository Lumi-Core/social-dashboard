/**
 * Metrics Page Module
 */

const Metrics = {
    posts: [],
    totals: {
        views: 0,
        reach: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saved: 0,
    },
    initialized: false,

    /**
     * Initialize metrics page
     */
    init() {
        this.bindEvents();
        this.initialized = true;
    },

    /**
     * Load metrics when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadMetrics();
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        on('refreshAllMetrics', 'click', () => this.refreshAllMetrics());
    },

    /**
     * Load metrics data
     */
    async loadMetrics() {
        try {
            showLoading('Loading metrics...');
            
            const [summary, posts] = await Promise.all([
                api.getMetrics().catch(() => ({})),
                api.getMetricsPosts().catch(() => []),
            ]);

            this.posts = posts;
            this.calculateTotals();
            this.renderOverview();
            this.renderTable();
            
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load metrics: ${error.message}`, 'error');
        }
    },

    /**
     * Calculate total metrics
     */
    calculateTotals() {
        this.totals = {
            views: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saved: 0,
        };

        this.posts.forEach(post => {
            this.totals.views += post.views || post.impressions || 0;
            this.totals.reach += post.reach || 0;
            this.totals.likes += post.likes || post.like_count || 0;
            this.totals.comments += post.comments || post.comments_count || 0;
            this.totals.shares += post.shares || post.shares_count || 0;
            this.totals.saved += post.saved || post.saved_count || 0;
        });
    },

    /**
     * Render metrics overview cards
     */
    renderOverview() {
        $('totalViews').textContent = formatNumberShort(this.totals.views);
        $('totalReach').textContent = formatNumberShort(this.totals.reach);
        $('totalLikes').textContent = formatNumberShort(this.totals.likes);
        $('totalComments').textContent = formatNumberShort(this.totals.comments);
        $('totalShares').textContent = formatNumberShort(this.totals.shares);
        $('totalSaved').textContent = formatNumberShort(this.totals.saved);
    },

    /**
     * Render metrics table
     */
    renderTable() {
        const tbody = $('metricsTableBody');
        if (!tbody) return;

        if (!this.posts || this.posts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted" style="padding: 40px;">
                        <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        No metrics data available yet.<br>
                        Metrics will appear after posts are published and tracked.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.posts.map(post => `
            <tr>
                <td>
                    <code style="font-size: 0.75rem;">${truncate(post.media_id || post.instagram_media_id || 'N/A', 15)}</code>
                </td>
                <td>${truncate(post.topic || 'N/A', 25)}</td>
                <td><strong>${formatNumber(post.views || post.impressions || 0)}</strong></td>
                <td>${formatNumber(post.reach || 0)}</td>
                <td>
                    <i class="fas fa-heart text-danger"></i>
                    ${formatNumber(post.likes || post.like_count || 0)}
                </td>
                <td>
                    <i class="fas fa-comment text-info"></i>
                    ${formatNumber(post.comments || post.comments_count || 0)}
                </td>
                <td>
                    <i class="fas fa-share text-success"></i>
                    ${formatNumber(post.shares || post.shares_count || 0)}
                </td>
                <td>
                    <i class="fas fa-bookmark text-warning"></i>
                    ${formatNumber(post.saved || post.saved_count || 0)}
                </td>
                <td>
                    <small class="text-muted">${timeAgo(post.last_metrics_update || post.created_at)}</small>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Refresh all metrics from Instagram
     */
    async refreshAllMetrics() {
        try {
            showLoading('Refreshing metrics from Instagram...');
            await api.refreshMetrics();
            showToast('Metrics refresh initiated', 'success');
            
            // Wait a moment then reload
            setTimeout(() => {
                this.loadMetrics();
            }, 2000);
        } catch (error) {
            hideLoading();
            showToast(`Failed to refresh metrics: ${error.message}`, 'error');
        }
    },
};
