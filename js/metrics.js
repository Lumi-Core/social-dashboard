
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

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadMetrics();
    },

    bindEvents() {
        on('refreshAllMetrics', 'click', () => this.refreshAllMetrics());
    },

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

    calculateTotals() {
        this.totals = {
            views: 0,
            reach: 0,
            likes: 0,
            comments: 0,
            shares: 0,
            saved: 0,
            plays: 0,
        };

        this.posts.forEach(post => {
            this.totals.views += post.views || post.impressions || 0;
            this.totals.reach += post.reach || 0;
            this.totals.likes += post.likes || post.like_count || 0;
            this.totals.comments += post.comments || post.comments_count || 0;
            this.totals.shares += post.shares || post.shares_count || 0;
            this.totals.saved += post.saved || post.saved_count || 0;
            if (this._isVideoPost(post)) {
                this.totals.plays += this._getPlays(post);
            }
        });
    },

    renderOverview() {
        $('totalViews').textContent = formatNumberShort(this.totals.views);
        $('totalReach').textContent = formatNumberShort(this.totals.reach);
        $('totalLikes').textContent = formatNumberShort(this.totals.likes);
        $('totalComments').textContent = formatNumberShort(this.totals.comments);
        $('totalShares').textContent = formatNumberShort(this.totals.shares);
        $('totalSaved').textContent = formatNumberShort(this.totals.saved);
        const playsEl = $('totalPlays');
        if (playsEl) playsEl.textContent = formatNumberShort(this.totals.plays);
    },

    _isVideoPost(p) {
        const type = (p.post_kind || p.media_type || '').toLowerCase();
        if (['video', 'reel', 'reels'].includes(type)) return true;
        return false;
    },

    _getPlays(p) {
        return p.plays || p.total_plays || p.ig_reels_aggregated_all_plays_count || 0;
    },

    renderTable() {
        const tbody = $('metricsTableBody');
        if (!tbody) return;

        if (!this.posts || this.posts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-center text-muted" style="padding: 40px;">
                        <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                        No metrics data available yet.<br>
                        Metrics will appear after posts are published and tracked.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.posts.map(post => {
            const kindRaw = (post.post_kind || post.media_type || '').toLowerCase();
            const isVideo = this._isVideoPost(post);
            const isCarousel = kindRaw === 'carousel' && !isVideo;

            let typeBadge;
            if (isVideo) {
                typeBadge = '<span class="status-badge" style="background:rgba(245,158,11,0.15);color:#f59e0b;"><i class="fas fa-film"></i> Reel</span>';
            } else if (isCarousel) {
                typeBadge = '<span class="status-badge" style="background:rgba(99,102,241,0.15);color:#818cf8;"><i class="fas fa-images"></i> Carousel</span>';
            } else {
                typeBadge = '<span class="status-badge" style="background:rgba(16,185,129,0.15);color:#34d399;"><i class="fas fa-image"></i> Image</span>';
            }

            let avgWatch = '-';
            if (isVideo && post.avg_watch_time) {
                const ms = Number(post.avg_watch_time);
                avgWatch = ms > 1000 ? (ms / 1000).toFixed(1) + 's' : ms.toFixed(0) + 'ms';
            }

            const viewCount = post.views || post.impressions || 0;

            let statusCell;
            if (post.metrics_error) {
                statusCell = `<span title="${post.metrics_error.substring(0, 120)}" style="cursor:help;color:#f87171;">
                    <i class="fas fa-exclamation-circle"></i> Error
                </span>`;
            } else if (post.last_metrics_update) {
                statusCell = `<span style="color:#34d399;"><i class="fas fa-check-circle"></i> OK</span>`;
            } else {
                statusCell = `<span style="color:#94a3b8;"><i class="fas fa-clock"></i> Pending</span>`;
            }

            return `
            <tr>
                <td>${typeBadge}</td>
                <td>
                    <code style="font-size: 0.75rem;">${truncate(post.media_id || post.instagram_media_id || 'N/A', 15)}</code>
                </td>
                <td>${truncate(post.topic || 'N/A', 25)}</td>
                <td><strong>${formatNumber(viewCount)}</strong></td>
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
                    <i class="fas fa-user-plus" style="color:var(--primary);"></i>
                    ${formatNumber(post.follows || 0)}
                </td>
                <td>
                    <i class="fas fa-id-card" style="color:#8b5cf6;"></i>
                    ${formatNumber(post.profile_visits || 0)}
                </td>
                <td>
                    ${isVideo ? '<i class="fas fa-play-circle" style="color:#f59e0b;"></i> ' + formatNumber(this._getPlays(post)) : '<span class="text-muted">-</span>'}
                </td>
                <td>${isVideo ? avgWatch : '<span class="text-muted">-</span>'}</td>
                <td>${statusCell}</td>
            </tr>
        `}).join('');
    },

    async refreshAllMetrics() {
        try {
            showLoading('Refreshing metrics from Instagram...');
            await api.refreshMetrics();
            showToast('Metrics refresh initiated', 'success');
            
            setTimeout(() => {
                this.loadMetrics();
            }, 2000);
        } catch (error) {
            hideLoading();
            showToast(`Failed to refresh metrics: ${error.message}`, 'error');
        }
    },
};
