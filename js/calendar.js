/**
 * Calendar Page Module
 */

const Calendar = {
    entries: [],
    filteredEntries: [],
    currentFilter: 'all',
    currentPage: 1,
    itemsPerPage: 10,
    initialized: false,
    fileUploader: null,

    /**
     * Initialize calendar
     */
    init() {
        this.bindEvents();
        this.initFileUpload();
        this.initialized = true;
    },

    /**
     * Initialize file upload for post modal
     */
    initFileUpload() {
        this.fileUploader = initFileUpload({
            inputId: 'postMediaFile',
            areaId: 'postMediaUpload',
            previewId: 'postMediaPreview',
            urlInputId: 'postMediaUrl',
            onUploadComplete: (result) => {
                console.log('Post media uploaded:', result.media_url);
            },
            onError: (error) => {
                console.error('Post media upload error:', error);
            }
        });
    },

    /**
     * Load calendar when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadCalendar();
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Add post button
        on('addCalendarEntry', 'click', () => this.openAddModal());
        
        // Bulk add button
        on('bulkAddPosts', 'click', () => openModal('bulkModal'));
        
        // Date filter
        on('filterByDate', 'click', () => this.filterByDate());
        on('clearDateFilter', 'click', () => this.clearDateFilter());
        
        // Tab filters
        $$$('.calendar-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeClassFromAll('.calendar-tabs .tab-btn', 'active');
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilter();
            });
        });
        
        // Post modal handlers
        on('closePostModal', 'click', () => closeModal('postModal'));
        on('cancelPostModal', 'click', () => closeModal('postModal'));
        on('savePost', 'click', () => this.savePost());
        
        // Bulk modal handlers
        on('closeBulkModal', 'click', () => closeModal('bulkModal'));
        on('cancelBulkModal', 'click', () => closeModal('bulkModal'));
        on('submitBulkAdd', 'click', () => this.submitBulkAdd());
        
        // File input for bulk add
        on('bulkFileInput', 'change', (e) => this.handleBulkFile(e));
        
        // Modal overlay click to close
        $$$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => closeAllModals());
        });
    },

    /**
     * Load calendar entries
     */
    async loadCalendar() {
        try {
            showLoading('Loading calendar...');
            this.entries = await api.getCalendar();
            this.applyFilter();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load calendar: ${error.message}`, 'error');
            this.entries = [];
            this.renderTable([]);
        }
    },

    /**
     * Apply current filter
     */
    applyFilter() {
        if (this.currentFilter === 'all') {
            this.filteredEntries = [...this.entries];
        } else {
            this.filteredEntries = this.entries.filter(entry => {
                const status = (entry.status || 'pending').toLowerCase();
                return status === this.currentFilter;
            });
        }
        this.currentPage = 1;
        this.renderTable(this.filteredEntries);
    },

    /**
     * Filter by date
     */
    async filterByDate() {
        const dateInput = $('calendarDateFilter');
        const date = dateInput.value;
        
        if (!date) {
            showToast('Please select a date', 'warning');
            return;
        }

        try {
            showLoading('Filtering...');
            // Filter locally instead of API call (endpoint doesn't exist)
            this.filteredEntries = this.entries.filter(entry => {
                const entryDate = formatDate(entry.scheduled_date);
                return entryDate === date;
            });
            this.currentPage = 1;
            this.renderTable(this.filteredEntries);
            hideLoading();
            
            if (this.filteredEntries.length === 0) {
                showToast(`No entries found for ${date}`, 'info');
            }
        } catch (error) {
            hideLoading();
            showToast(`Failed to filter: ${error.message}`, 'error');
        }
    },

    /**
     * Clear date filter
     */
    clearDateFilter() {
        $('calendarDateFilter').value = '';
        this.applyFilter();
    },

    /**
     * Render calendar table
     */
    renderTable(entries) {
        const tbody = $('calendarTableBody');
        const showingInfo = $('calendarShowingInfo');
        
        if (!tbody) return;

        // Calculate pagination
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageEntries = entries.slice(start, end);

        if (pageEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 40px;">
                        No calendar entries found
                    </td>
                </tr>
            `;
            showingInfo.textContent = 'Showing 0 entries';
            this.renderPagination(0);
            return;
        }

        tbody.innerHTML = pageEntries.map(entry => `
            <tr>
                <td><strong>#${entry.id || 'N/A'}</strong></td>
                <td>${formatDateReadable(entry.scheduled_date)}</td>
                <td>${truncate(entry.topic || 'Untitled', 40)}</td>
                <td>${truncate(entry.product || '-', 25)}</td>
                <td>
                    <i class="fas fa-${entry.media_type === 'video' ? 'video' : 
                        entry.media_type === 'carousel' ? 'images' : 'image'}"></i>
                    ${capitalize(entry.media_type || 'image')}
                </td>
                <td>
                    <span class="status-badge ${getStatusClass(entry.status)}">
                        ${entry.status || 'Pending'}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-secondary" onclick="Calendar.viewEntry(${entry.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="Calendar.runWorkflow(${entry.id})" title="Run Workflow">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="Calendar.deleteEntry(${entry.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        showingInfo.textContent = `Showing ${start + 1}-${Math.min(end, entries.length)} of ${entries.length} entries`;
        this.renderPagination(entries.length);
    },

    /**
     * Render pagination
     */
    renderPagination(totalItems) {
        const container = $('calendarPagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        // Previous button
        html += `<button ${this.currentPage === 1 ? 'disabled' : ''} onclick="Calendar.goToPage(${this.currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="Calendar.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<button disabled>...</button>';
            }
        }
        
        // Next button
        html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="Calendar.goToPage(${this.currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        container.innerHTML = html;
    },

    /**
     * Go to specific page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderTable(this.filteredEntries);
    },

    /**
     * Open add post modal
     */
    openAddModal() {
        $('postModalTitle').textContent = 'Add New Post';
        $('postId').value = '';
        resetForm('postForm');
        
        // Clear file upload
        clearFileUpload('postMediaUpload', 'postMediaPreview');
        
        // Set default date to today
        const dateInput = $('postForm').querySelector('[name="scheduled_date"]');
        if (dateInput) {
            dateInput.value = getToday();
        }
        
        openModal('postModal');
    },

    /**
     * View entry details
     */
    async viewEntry(id) {
        try {
            showLoading('Loading entry...');
            const entry = await api.getCalendarEntry(id);
            hideLoading();
            
            $('postModalTitle').textContent = 'Edit Post';
            $('postId').value = id;
            populateForm('postForm', entry);
            
            // Clear file upload when editing (existing media will be kept if no new file uploaded)
            clearFileUpload('postMediaUpload', 'postMediaPreview');
            
            openModal('postModal');
        } catch (error) {
            hideLoading();
            showToast(`Failed to load entry: ${error.message}`, 'error');
        }
    },

    /**
     * Save post (add or edit)
     */
    async savePost() {
        const data = getFormData('postForm');
        const id = $('postId').value;

        if (!data.scheduled_date || !data.topic) {
            showToast('Please fill in required fields', 'warning');
            return;
        }

        try {
            showLoading('Saving...');
            
            if (id) {
                // Edit mode - would need update endpoint
                showToast('Edit functionality coming soon', 'info');
            } else {
                // Add mode
                await api.addCalendarEntry(data);
                showToast('Post added successfully', 'success');
            }
            
            closeModal('postModal');
            this.loadCalendar();
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    /**
     * Delete entry
     */
    async deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            showLoading('Deleting...');
            await api.deleteCalendarEntry(id);
            hideLoading();
            showToast('Entry deleted successfully', 'success');
            this.loadCalendar();
        } catch (error) {
            hideLoading();
            showToast(`Failed to delete: ${error.message}`, 'error');
        }
    },

    /**
     * Run workflow for entry
     */
    async runWorkflow(id) {
        try {
            showLoading('Starting workflow...');
            const result = await api.startWorkflowById(id);
            hideLoading();
            showToast('Workflow started successfully', 'success');
            
            if (result.session_id) {
                showToast(`Session ID: ${result.session_id}`, 'info', 'Workflow Info', 10000);
            }
            
            this.loadCalendar();
        } catch (error) {
            hideLoading();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    /**
     * Handle bulk file upload
     */
    handleBulkFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            $('bulkJsonInput').value = e.target.result;
        };
        reader.readAsText(file);
    },

    /**
     * Submit bulk add
     */
    async submitBulkAdd() {
        const jsonInput = $('bulkJsonInput').value.trim();
        
        if (!jsonInput) {
            showToast('Please enter JSON data', 'warning');
            return;
        }

        try {
            const entries = JSON.parse(jsonInput);
            
            if (!Array.isArray(entries)) {
                showToast('JSON must be an array of entries', 'error');
                return;
            }

            showLoading(`Adding ${entries.length} entries...`);
            await api.bulkAddCalendarEntries(entries);
            hideLoading();
            
            closeModal('bulkModal');
            $('bulkJsonInput').value = '';
            showToast(`Successfully added ${entries.length} entries`, 'success');
            this.loadCalendar();
        } catch (error) {
            hideLoading();
            if (error instanceof SyntaxError) {
                showToast('Invalid JSON format', 'error');
            } else {
                showToast(`Failed to add entries: ${error.message}`, 'error');
            }
        }
    },
};
