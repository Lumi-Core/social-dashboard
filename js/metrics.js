
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
    retentionChart: null,
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
            this.renderRetentionGraph();
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
        const type = (p.media_type || p.post_kind || '').toLowerCase();
        if (['video', 'reel', 'reels'].includes(type)) return true;
        
        if (p.plays || p.total_plays || p.avg_watch_time) return true;
        return false;
    },

    _getPlays(p) {
        return p.plays || p.total_plays || p.ig_reels_aggregated_all_plays_count || 0;
    },

    renderRetentionGraph() {
        const canvas = $('retentionChart');
        const emptyMsg = $('retentionEmpty');
        if (!canvas) return;

        const videoPosts = this.posts.filter(p => {
            return this._isVideoPost(p) &&
                   (p.views || this._getPlays(p) || p.reach || p.impressions);
        });

        if (videoPosts.length === 0) {
            canvas.style.display = 'none';
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }

        canvas.style.display = 'block';
        if (emptyMsg) emptyMsg.classList.add('hidden');

        const labels = videoPosts.map(p => truncate(p.topic || `#${p.id}`, 20));
        const viewsData = videoPosts.map(p => p.views || p.impressions || 0);
        const reachData = videoPosts.map(p => p.reach || 0);
        const playsData = videoPosts.map(p => this._getPlays(p));
        const retentionRate = videoPosts.map(p => {
            const views = p.views || p.impressions || 1;
            const reach = p.reach || 0;
            return reach > 0 ? Math.round((reach / views) * 100) : 0;
        });

        if (this.retentionChart) {
            this.retentionChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.retentionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Views',
                        data: viewsData,
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Reach',
                        data: reachData,
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Plays',
                        data: playsData,
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: 'rgba(245, 158, 11, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                    },
                    {
                        label: 'Retention %',
                        data: retentionRate,
                        type: 'line',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                        yAxisID: 'percentage',
                        fill: true,
                        tension: 0.3,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#94a3b8', font: { size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#e2e8f0',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 11 } },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    y: {
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        title: { display: true, text: 'Count', color: '#94a3b8' }
                    },
                    percentage: {
                        position: 'right',
                        min: 0,
                        max: 100,
                        ticks: { color: '#ef4444', callback: v => v + '%' },
                        grid: { display: false },
                        title: { display: true, text: 'Retention %', color: '#ef4444' }
                    }
                }
            }
        });
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
            const kindRaw = (post.media_type || post.post_kind || '').toLowerCase();
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
