/**
 * Main Application Module
 * Handles navigation, initialization, and global functionality
 */

const App = {
    currentPage: 'dashboard',
    refreshInterval: null,

    /**
     * Initialize the application
     */
    init() {
        console.log('🚀 Initializing Social Media Agent Dashboard...');
        
        try {
            this.bindEvents();
            
            // Initialize all page modules with error handling
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
            ];
            
            modules.forEach(({ name, module }) => {
                try {
                    module.init();
                    console.log(`✓ ${name} module initialized`);
                } catch (error) {
                    console.error(`✗ Error initializing ${name} module:`, error);
                }
            });
            
            // Handle initial page after modules are ready
            this.handleHashChange();
            
            this.startHealthMonitor();
            console.log('✓ Dashboard fully initialized');
        } catch (error) {
            console.error('Critical error during initialization:', error);
        }
    },

    /**
     * Bind global event handlers
     */
    bindEvents() {
        // Navigation - use $$$ for querySelectorAll
        $$$('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.navigateTo(page);
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth <= 768) {
                        this.closeMobileSidebar();
                    }
                }
            });
        });

        // Sidebar toggle (desktop collapse)
        on('sidebarToggle', 'click', () => {
            if (window.innerWidth > 768) {
                $('sidebar').classList.toggle('collapsed');
            } else {
                this.toggleMobileSidebar();
            }
        });

        // Mobile hamburger menu button
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMobileSidebar();
            });
        }

        // Sidebar overlay click to close
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                this.closeMobileSidebar();
            });
        }

        // Close sidebar on window resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileSidebar();
            }
        });

        // Global refresh button
        on('refreshBtn', 'click', () => this.refreshCurrentPage());

        // Hash change for browser navigation
        window.addEventListener('hashchange', () => this.handleHashChange());

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R to refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshCurrentPage();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });

        // Close modal on overlay click
        $$$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', closeAllModals);
        });

        // Close confirm modal
        on('closeConfirmModal', 'click', () => closeModal('confirmModal'));
    },

    /**
     * Toggle mobile sidebar
     */
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

    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    /**
     * Navigate to a page
     */
    navigateTo(page) {
        console.log(`Navigating to: ${page}`);
        this.currentPage = page;
        window.location.hash = page;

        // Update navigation - remove active from all nav items
        $$$('.nav-item').forEach(item => item.classList.remove('active'));
        const navItem = $$(`.nav-item[data-page="${page}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Update page visibility - hide all pages first
        $$$('.page').forEach(p => p.classList.add('hidden'));
        const pageElement = $(`page-${page}`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
            console.log(`Showing page: page-${page}`);
        } else {
            console.error(`Page element not found: page-${page}`);
        }

        // Trigger page activation to load data
        this.activatePage(page);

        // Update header
        this.updateHeader(page);
    },

    /**
     * Activate page and load its data
     */
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
        };

        const pageModule = pageMap[page];
        if (pageModule && typeof pageModule.onPageActive === 'function') {
            try {
                console.log(`Activating ${page} page...`);
                // Use setTimeout to prevent blocking UI
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

    /**
     * Handle hash change
     */
    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigateTo(hash);
    },

    /**
     * Update header for current page
     */
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
        };


        $('pageTitle').textContent = titles[page] || 'Dashboard';
        $('breadcrumb').textContent = breadcrumbs[page] || 'Home';
    },

    /**
     * Refresh current page data
     */
    refreshCurrentPage() {
        this.refreshPage(this.currentPage);
        showToast('Refreshing...', 'info', null, 1500);
    },

    /**
     * Refresh specific page
     */
    refreshPage(page) {
        switch (page) {
            case 'dashboard':
                Dashboard.loadDashboardData();
                break;
            case 'calendar':
                Calendar.loadCalendar();
                break;
            case 'tracking':
                Tracking.loadTracking();
                break;
            case 'metrics':
                Metrics.loadMetrics();
                break;
            case 'approvals':
                Approvals.loadApprovals();
                break;
            case 'tasks':
                Tasks.loadTasks();
                break;
            case 'logs':
                Logs.loadLogs();
                break;
            case 'settings':
                Settings.loadSettings();
                break;
        }
    },

    /**
     * Start health monitoring
     */
    startHealthMonitor() {
        // Delay initial check to let page load first
        setTimeout(() => {
            this.checkHealth();
        }, 2000);

        // Check every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.checkHealth();
        }, 30000);
    },

    /**
     * Check system health
     */
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

    /**
     * Stop health monitoring
     */
    stopHealthMonitor() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    App.stopHealthMonitor();
});
