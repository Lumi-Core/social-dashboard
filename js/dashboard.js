
const Dashboard = {
    initialized: false,
    healthInterval: null,
    
    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadDashboardData();
        this.startHealthPolling();
    },

    onPageInactive() {
        this.stopHealthPolling();
    },

    startHealthPolling() {
        this.stopHealthPolling();
        this.healthInterval = setInterval(() => {
            this.loadHealthStatus();
        }, 30000);
    },

    stopHealthPolling() {
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
            this.healthInterval = null;
        }
    },

    bindEvents() {
        on('refreshHealthBtn', 'click', () => this.loadHealthStatus());
        on('runDailyWorkflow', 'click', () => this.runDailyWorkflow());
        on('addNewPost', 'click', () => Calendar.openAddModal());
        on('refreshMetrics', 'click', () => this.refreshMetrics());
        on('viewPendingApprovals', 'click', () => App.navigateTo('approvals'));
        on('triggerScheduler', 'click', () => this.triggerScheduler());
    },

    async loadDashboardData() {
        console.log('Loading dashboard data...');
        try {
            
            const results = await Promise.allSettled([
                this.loadStats(),
                this.loadHealthStatus(),
                this.loadSchedulerInfo(),
                this.loadTodayPosts(),
            ]);
            
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const names = ['stats', 'health', 'scheduler', 'today posts'];
                    console.error(`Failed to load ${names[index]}:`, result.reason);
                }
            });
            
            console.log('Dashboard data loaded');
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    },

    async loadStats() {
        try {
            const [calendar, tracking, pending, metrics] = await Promise.all([
                api.getCalendarToday().catch(() => []),
                api.getTracking().catch(() => []),
                api.getPendingApprovals().catch(() => []),
                api.getMetrics().catch(() => ({})),
            ]);

            $('stat-scheduled').textContent = calendar.length || 0;
            $('stat-published').textContent = tracking.length || 0;
            $('stat-pending').textContent = pending.length || 0;
            $('stat-workflows').textContent = metrics.total_workflows || 0;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    },

    async loadHealthStatus() {
        const grid = $('healthGrid');
        if (!grid) return;

        try {
            const health = await api.getHealthReady();
            const checks = health.checks || {};
            const details = health.details || {};

            grid.innerHTML = Object.keys(checks).map(service => {
                const isHealthy = checks[service];
                const detail = details[service] || '';
                
                return `
                    <div class="health-item ${isHealthy ? 'healthy' : 'unhealthy'}">
                        <i class="fas ${isHealthy ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        <div class="health-item-info">
                            <h4>${snakeToTitle(service)}</h4>
                            <p>${truncate(detail, 40)}</p>
                        </div>
                        <span class="health-pulse ${isHealthy ? 'pulse-green' : 'pulse-red'}"></span>
                    </div>
                `;
            }).join('');

            const indicator = $('healthIndicator');
            if (indicator) {
                const allHealthy = Object.values(checks).every(v => v);
                indicator.querySelector('.status-dot').className = 
                    `status-dot ${allHealthy ? 'healthy' : 'unhealthy'}`;
                indicator.querySelector('.status-text').textContent = 
                    allHealthy ? 'All Systems Healthy' : 'Issues Detected';
            }
        } catch (error) {
            grid.innerHTML = `
                <div class="health-item unhealthy">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div class="health-item-info">
                        <h4>Connection Error</h4>
                        <p>Unable to reach API</p>
                    </div>
                </div>
            `;
            
            const indicator = $('healthIndicator');
            if (indicator) {
                indicator.querySelector('.status-dot').className = 'status-dot unhealthy';
                indicator.querySelector('.status-text').textContent = 'Connection Failed';
            }
        }
    },

    async loadSchedulerInfo() {
        const container = $('schedulerInfo');
        if (!container) return;

        try {
            const [status, todayPosts] = await Promise.all([
                api.getSchedulerStatus(),
                api.getCalendarToday().catch(() => []),
            ]);
            
            const upcomingTimes = todayPosts
                .filter(p => p.scheduled_time && p.status !== 'Posted')
                .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
                .slice(0, 3);
            
            let upcomingHtml = '';
            if (upcomingTimes.length > 0) {
                upcomingHtml = `
                <div class="scheduler-row" style="flex-direction:column; align-items:flex-start; gap:4px;">
                    <span class="scheduler-label">Upcoming Post Times</span>
                    ${upcomingTimes.map(p => `
                        <span class="scheduler-value" style="font-size:0.85rem;">
                            <i class="fas fa-clock" style="color:var(--primary);margin-right:4px;"></i>
                            ${p.scheduled_time} — ${truncate(p.topic || 'Untitled', 22)}
                        </span>
                    `).join('')}
                </div>`;
            }
            
            container.innerHTML = `
                <div class="scheduler-row">
                    <span class="scheduler-label">Status</span>
                    <span class="scheduler-value ${status.running ? 'running' : ''}">
                        ${status.running ? '● Running' : '○ Stopped'}
                    </span>
                </div>
                <div class="scheduler-row">
                    <span class="scheduler-label">Enabled</span>
                    <span class="scheduler-value">${status.enabled ? 'Yes' : 'No'}</span>
                </div>
                <div class="scheduler-row">
                    <span class="scheduler-label">Daily Run Time</span>
                    <span class="scheduler-value">${status.scheduled_time || 'N/A'}</span>
                </div>
                <div class="scheduler-row">
                    <span class="scheduler-label">Timezone</span>
                    <span class="scheduler-value">${status.timezone || 'N/A'}</span>
                </div>
                <div class="scheduler-row">
                    <span class="scheduler-label">Next Run</span>
                    <span class="scheduler-value">${status.next_run ? formatDateTime(status.next_run) : 'N/A'}</span>
                </div>
                <div class="scheduler-row">
                    <span class="scheduler-label">Jobs Count</span>
                    <span class="scheduler-value">${status.job_count || 0}</span>
                </div>
                ${upcomingHtml}
            `;
        } catch (error) {
            container.innerHTML = '<p class="text-muted">Failed to load scheduler info</p>';
        }
    },

    async loadTodayPosts() {
        const container = $('todayPosts');
        if (!container) return;

        try {
            const posts = await api.getCalendarToday();
            
            if (!posts || posts.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">No posts scheduled for today</p>';
                return;
            }

            container.innerHTML = posts.slice(0, 5).map(post => `
                <div class="post-item">
                    <div class="post-icon">
                        <i class="fas fa-${post.media_type === 'video' ? 'video' : 
                            post.media_type === 'carousel' ? 'images' : 'image'}"></i>
                    </div>
                    <div class="post-info">
                        <h4>${truncate(post.topic || 'Untitled', 30)}</h4>
                        <p>${post.product || 'No product'}${post.scheduled_time ? ' <span style="color:var(--primary);font-weight:600;">at ' + post.scheduled_time + '</span>' : ''}</p>
                    </div>
                    <span class="post-status ${getStatusClass(post.status)}">${post.status || 'Pending'}</span>
                </div>
            `).join('');
        } catch (error) {
            container.innerHTML = '<p class="text-muted text-center">Failed to load posts</p>';
        }
    },

    async runDailyWorkflow() {
        try {
            showBlockingLoader('Starting daily workflow...');
            const result = await api.runDailyWorkflow();
            hideBlockingLoader();
            showToast('Daily workflow started successfully', 'success');
            this.loadStats();
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    async refreshMetrics() {
        try {
            showLoading('Refreshing Instagram metrics...');
            await api.refreshMetrics();
            hideLoading();
            showToast('Metrics refresh initiated', 'success');
        } catch (error) {
            hideLoading();
            showToast(`Failed to refresh metrics: ${error.message}`, 'error');
        }
    },

    async triggerScheduler() {
        try {
            showBlockingLoader('Triggering scheduler...');
            await api.triggerScheduler();
            hideBlockingLoader();
            showToast('Scheduler triggered successfully', 'success');
            this.loadSchedulerInfo();
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to trigger scheduler: ${error.message}`, 'error');
        }
    },
};
