
const App = {
    currentPage: 'dashboard',
    refreshInterval: null,

    init() {
        console.log('🚀 Initializing Social Media Agent Dashboard...');
        
        try {
            this.bindEvents();
            
            const modules = [
                { name: 'Dashboard', module: Dashboard },
                { name: 'Calendar', module: Calendar },
                { name: 'Workflow', module: Workflow },
                { name: 'Tracking', module: Tracking },
                { name: 'Metrics', module: Metrics },
                { name: 'Approvals', module: Approvals },
                { name: 'Tasks', module: Tasks },
                { name: 'Logs', module: Logs },
                { name: 'Settings', module: Settings },
                { name: 'Analytics', module: Analytics },
                ...(typeof Alerts  !== 'undefined' ? [{ name: 'Alerts',  module: Alerts  }] : []),
                ...(typeof Reports !== 'undefined' ? [{ name: 'Reports', module: Reports }] : []),
            ];
            
            modules.forEach(({ name, module }) => {
                try {
                    module.init();
                    console.log(`✓ ${name} module initialized`);
                } catch (error) {
                    console.error(`✗ Error initializing ${name} module:`, error);
                }
            });
            
            this.handleHashChange();
            
            this.startHealthMonitor();
            console.log('✓ Dashboard fully initialized');
        } catch (error) {
            console.error('Critical error during initialization:', error);
        }
    },

    bindEvents() {
        
        $$$('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateTo(page);
                    
                    if (window.innerWidth <= 768) {
                        this.closeMobileSidebar();
                    }
                }
            });
        });

        on('sidebarToggle', 'click', () => {
            if (window.innerWidth > 768) {
                $('sidebar').classList.toggle('collapsed');
            } else {
                this.toggleMobileSidebar();
            }
        });

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileSidebar();
            }
        });

        on('refreshBtn', 'click', () => this.refreshCurrentPage());

        // Notification bell → navigate to Alerts page
        on('notificationBtn', 'click', () => this.navigateTo('alerts'));

        window.addEventListener('hashchange', () => this.handleHashChange());

        document.addEventListener('keydown', (e) => {
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshCurrentPage();
            }
            
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });

        $$$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', closeAllModals);
        });

        on('closeConfirmModal', 'click', () => closeModal('confirmModal'));
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            this.closeMobileSidebar();
        } else {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    navigateTo(page) {
        console.log(`Navigating to: ${page}`);
        
        this.deactivatePage(this.currentPage);
        
        this.currentPage = page;
        window.location.hash = page;

        $$$('.nav-item').forEach(item => item.classList.remove('active'));
        const navItem = $$(`.nav-item[data-page="${page}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        $$$('.page').forEach(p => p.classList.add('hidden'));
        const pageElement = $(`page-${page}`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
            console.log(`Showing page: page-${page}`);
        } else {
            console.error(`Page element not found: page-${page}`);
        }

        this.activatePage(page);

        this.updateHeader(page);
    },

    activatePage(page) {
        const pageMap = {
            dashboard: Dashboard,
            analytics: Analytics,
            calendar: Calendar,
            workflow: Workflow,
            tracking: Tracking,
            metrics: Metrics,
            approvals: Approvals,
            tasks: Tasks,
            logs: Logs,
            settings: Settings,
            alerts: typeof Alerts !== 'undefined' ? Alerts : null,
            reports: typeof Reports !== 'undefined' ? Reports : null,
        };

        const pageModule = pageMap[page];
        if (pageModule && typeof pageModule.onPageActive === 'function') {
            try {
                console.log(`Activating ${page} page...`);
                
                setTimeout(() => {
                    try {
                        pageModule.onPageActive();
                    } catch (error) {
                        console.error(`Error in ${page}.onPageActive():`, error);
                    }
                }, 0);
            } catch (error) {
                console.error(`Error activating ${page} page:`, error);
            }
        }
    },

    deactivatePage(page) {
        const pageMap = {
            dashboard: Dashboard,
            analytics: typeof Analytics !== 'undefined' ? Analytics : null,
            calendar: Calendar,
            workflow: Workflow,
            tracking: Tracking,
            metrics: Metrics,
            approvals: Approvals,
            tasks: Tasks,
            logs: Logs,
            settings: Settings,
            alerts: typeof Alerts !== 'undefined' ? Alerts : null,
            reports: typeof Reports !== 'undefined' ? Reports : null,
        };

        const pageModule = pageMap[page];
        if (pageModule && typeof pageModule.onPageInactive === 'function') {
            try {
                pageModule.onPageInactive();
            } catch (error) {
                console.error(`Error in ${page}.onPageInactive():`, error);
            }
        }
    },

    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigateTo(hash);
    },

    updateHeader(page) {
        const titles = {
            dashboard: 'Dashboard',
            calendar: 'Content Calendar',
            workflow: 'Workflow Management',
            tracking: 'Post Tracking',
            metrics: 'Instagram Metrics',
            approvals: 'Pending Approvals',
            tasks: 'Agent Tasks',
            logs: 'Error Logs',
            settings: 'Settings',
            analytics: 'Analytics Insights',
            alerts: 'Alerts',
            reports: 'Reports',
        };

        const breadcrumbs = {
            dashboard: 'Home / Dashboard',
            calendar: 'Home / Calendar',
            workflow: 'Home / Workflow',
            tracking: 'Home / Tracking',
            metrics: 'Home / Metrics',
            approvals: 'Home / Approvals',
            tasks: 'Home / Tasks',
            logs: 'Home / Logs',
            settings: 'Home / Settings',
            analytics: 'Home / Analytics Insights',
            alerts: 'Home / Alerts',
            reports: 'Home / Reports',
        };

        $('pageTitle').textContent = titles[page] || 'Dashboard';
        $('breadcrumb').textContent = breadcrumbs[page] || 'Home';
    },

    refreshCurrentPage() {
        this.refreshAll();
        showToast('Refreshing all data...', 'info', null, 1500);
    },

    async refreshAll() {
        const jobs = [];
        jobs.push(this.checkHealth());
        jobs.push(this.refreshPage(this.currentPage));
        if (this.currentPage !== 'dashboard')  jobs.push(Dashboard.loadStats ? Dashboard.loadStats().catch(() => {}) : Promise.resolve());
        if (this.currentPage !== 'approvals')  jobs.push(Approvals.loadApprovals().catch(() => {}));
        if (this.currentPage !== 'calendar' && Calendar.loadCalendar)   jobs.push(Calendar.loadCalendar().catch(() => {}));
        await Promise.allSettled(jobs);
    },

    async refreshPage(page) {
        switch (page) {
            case 'dashboard':
                await Dashboard.loadDashboardData();
                break;
            case 'calendar':
                if (Calendar.loadCalendar) await Calendar.loadCalendar();
                break;
            case 'tracking':
                await Tracking.loadTracking();
                break;
            case 'metrics':
                await Metrics.loadMetrics();
                break;
            case 'approvals':
                await Approvals.loadApprovals();
                break;
            case 'tasks':
                await Tasks.loadTasks();
                break;
            case 'logs':
                await Logs.loadLogs();
                break;
            case 'settings':
                await Settings.loadSettings();
                break;
            case 'alerts':
                if (typeof Alerts !== 'undefined') await Alerts.loadAlerts();
                break;
            case 'reports':
                if (typeof Reports !== 'undefined') await Reports.loadReports();
                break;
        }
    },

    startHealthMonitor() {
        setTimeout(() => {
            this.checkHealth();
            if (typeof Alerts !== 'undefined') Alerts.updateBadge().catch(() => {});
        }, 2000);

        this.refreshInterval = setInterval(() => {
            this.checkHealth();
            this.refreshPage(this.currentPage).catch(() => {});
            Approvals.loadApprovals().catch(() => {});
            if (typeof Alerts !== 'undefined') Alerts.updateBadge().catch(() => {});
        }, 30000);
    },

    async checkHealth() {
        try {
            const health = await api.getHealth();
            const indicator = $('healthIndicator');
            
            if (indicator) {
                const isHealthy = health.status === 'healthy';
                indicator.querySelector('.status-dot').className = 
                    `status-dot ${isHealthy ? 'healthy' : 'unhealthy'}`;
                indicator.querySelector('.status-text').textContent = 
                    isHealthy ? 'System Healthy' : 'Issues Detected';
            }
        } catch (error) {
            const indicator = $('healthIndicator');
            if (indicator) {
                indicator.querySelector('.status-dot').className = 'status-dot unhealthy';
                indicator.querySelector('.status-text').textContent = 'Disconnected';
            }
        }
    },

    stopHealthMonitor() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

window.addEventListener('beforeunload', () => {
    App.stopHealthMonitor();
});
