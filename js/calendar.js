
const Calendar = {
    entries: [],
    filteredEntries: [],
    currentFilter: 'all',
    currentPage: 1,
    itemsPerPage: 10,
    initialized: false,
    fileUploader: null,
    _tagsStore: [],       // tags for current modal
    _allTags: [],         // all available tags from server

    init() {
        this.bindEvents();
        this.initFileUpload();
        this.initialized = true;
    },

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

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadCalendar();
    },

    bindEvents() {
        
        on('addCalendarEntry', 'click', () => this.openAddModal());
        
        on('bulkAddPosts', 'click', () => openModal('bulkModal'));
        
        on('filterByDate', 'click', () => this.filterByDate());
        on('clearDateFilter', 'click', () => this.clearDateFilter());
        on('filterByTag', 'click', () => this.filterByTag());
        
        $$$('.calendar-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                removeClassFromAll('.calendar-tabs .tab-btn', 'active');
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.applyFilter();
            });
        });
        
        on('closePostModal', 'click', () => closeModal('postModal'));
        on('cancelPostModal', 'click', () => closeModal('postModal'));
        on('savePost', 'click', () => this.savePost());
        
        on('closeBulkModal', 'click', () => closeModal('bulkModal'));
        on('cancelBulkModal', 'click', () => closeModal('bulkModal'));
        on('submitBulkAdd', 'click', () => this.submitBulkAdd());
        
        on('exportExcel', 'click', () => this.exportExcel());
        on('importExcelBtn', 'click', () => $('importExcelFile').click());
        on('importExcelFile', 'change', (e) => this.importExcel(e));
        on('downloadTemplate', 'click', () => this.downloadTemplate());
        
        on('bulkFileInput', 'change', (e) => this.handleBulkFile(e));

        // Tags chip input
        const tagsInput = $('tagsTextInput');
        if (tagsInput) {
            tagsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = tagsInput.value.trim().replace(/,/g, '');
                    if (val) { this._addTag(val); tagsInput.value = ''; }
                }
            });
        }
        
        $$$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => closeAllModals());
        });
    },

    async loadCalendar() {
        try {
            showLoading('Loading calendar...');
            this.entries = await api.getCalendar();
            this.applyFilter();
            hideLoading();
            // Populate tag filter dropdown
            this._loadTagsDropdown();
        } catch (error) {
            hideLoading();
            showToast(`Failed to load calendar: ${error.message}`, 'error');
            this.entries = [];
            this.renderTable([]);
        }
    },

    async _loadTagsDropdown() {
        try {
            const data = await api.getAllTags();
            this._allTags = Array.isArray(data) ? data : (data.tags || []);
            const select = $('calendarTagFilter');
            if (!select) return;
            const current = select.value;
            select.innerHTML = '<option value="">All Tags</option>' +
                this._allTags.map(t => `<option value="${escapeHtml(t)}" ${t === current ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
        } catch (e) { /* silent */ }
    },

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

    async filterByDate() {
        const dateInput = $('calendarDateFilter');
        const date = dateInput.value;
        
        if (!date) {
            showToast('Please select a date', 'warning');
            return;
        }

        try {
            showLoading('Filtering...');
            const entries = await api.getCalendarByDate(date);
            this.filteredEntries = entries;
            this.currentPage = 1;
            this.renderTable(entries);
            hideLoading();
        } catch (error) {
            hideLoading();
            showToast(`Failed to filter: ${error.message}`, 'error');
        }
    },

    clearDateFilter() {
        $('calendarDateFilter').value = '';
        this.applyFilter();
    },

    renderTable(entries) {
        const tbody = $('calendarTableBody');
        const showingInfo = $('calendarShowingInfo');
        
        if (!tbody) return;

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
                <td>${formatDateReadable(entry.scheduled_date)}${entry.scheduled_time ? ' <small style=\"color:var(--primary);font-weight:600;\">' + entry.scheduled_time + '</small>' : ''}</td>
                <td>${truncate(entry.topic || 'Untitled', 40)}</td>
                <td>${truncate(entry.product || '-', 25)}</td>
                <td>
                    <i class="fas fa-${entry.media_type === 'video' ? 'video' : 
                        entry.media_type === 'carousel' ? 'images' : 'image'}"></i>
                    ${capitalize(entry.media_type || 'image')}
                </td>
                <td>
                    ${this._renderTagChips(entry.tags)}
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

    renderPagination(totalItems) {
        const container = $('calendarPagination');
        if (!container) return;

        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        
        html += `<button ${this.currentPage === 1 ? 'disabled' : ''} onclick="Calendar.goToPage(${this.currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="Calendar.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += '<button disabled>...</button>';
            }
        }
        
        html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="Calendar.goToPage(${this.currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        container.innerHTML = html;
    },

    goToPage(page) {
        this.currentPage = page;
        this.renderTable(this.filteredEntries);
    },

    openAddModal() {
        $('postModalTitle').textContent = 'Add New Post';
        $('postId').value = '';
        resetForm('postForm');
        
        clearFileUpload('postMediaUpload', 'postMediaPreview');
        
        const dateInput = $('postForm').querySelector('[name="scheduled_date"]');
        if (dateInput) {
            dateInput.value = getToday();
        }
        
        // Clear tags
        this._tagsStore = [];
        this._renderTagsChips();

        openModal('postModal');
    },

    async viewEntry(id) {
        try {
            showLoading('Loading entry...');
            const entry = await api.getCalendarEntry(id);
            hideLoading();
            
            $('postModalTitle').textContent = 'Edit Post';
            $('postId').value = id;
            populateForm('postForm', entry);

            clearFileUpload('postMediaUpload', 'postMediaPreview');

            // Populate tags
            this._tagsStore = Array.isArray(entry.tags) ? [...entry.tags] : [];
            this._renderTagsChips();
            
            openModal('postModal');
        } catch (error) {
            hideLoading();
            showToast(`Failed to load entry: ${error.message}`, 'error');
        }
    },

    async savePost() {
        const data = getFormData('postForm');
        const id = $('postId').value;

        if (!data.scheduled_date || !data.topic) {
            showToast('Please fill in required fields (date, time, topic)', 'warning');
            return;
        }

        if (!data.scheduled_time) {
            showToast('Please set a publish time', 'warning');
            return;
        }

        // Attach tags
        data.tags = [...this._tagsStore];

        try {
            showLoading('Saving...');
            
            if (id) {
                // Update existing via PUT
                await api.updateCalendarEntry(id, data);
                showToast('Post updated successfully', 'success');
            } else {
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

    async runWorkflow(id) {
        try {
            showLoading('Starting workflow...');
            const result = await api.startWorkflowById(id);
            hideLoading();
            showToast('⚙️ Workflow started! Processing in background...', 'success');
            this.loadCalendar();
            
            this.pollEntryStatus(id, 0);
        } catch (error) {
            hideLoading();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    pollEntryStatus(entryId, attempts) {
        if (attempts > 36) return; 
        setTimeout(async () => {
            try {
                const entry = await api.getCalendarEntry(entryId);
                const status = (entry.status || '').toLowerCase();
                if (status === 'awaiting approval') {
                    showToast('✅ Content ready! Check the Approvals tab.', 'success', '', 8000);
                    this.loadCalendar();
                    
                    const badge = $('notificationBadge');
                    if (badge) { badge.textContent = parseInt(badge.textContent || '0') + 1; badge.style.display = 'inline'; }
                } else if (status === 'failed') {
                    showToast('❌ Workflow failed. Check server logs.', 'error', '', 8000);
                    this.loadCalendar();
                } else if (status === 'processing') {
                    this.pollEntryStatus(entryId, attempts + 1);
                }
                
            } catch (e) {
                this.pollEntryStatus(entryId, attempts + 1); 
            }
        }, 10000);
    },

    handleBulkFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            $('bulkJsonInput').value = e.target.result;
        };
        reader.readAsText(file);
    },

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

    async exportExcel() {
        try {
            showLoading('Exporting to Excel...');
            const blob = await api.exportCalendarExcel();
            hideLoading();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content_calendar_${new Date().toISOString().slice(0,10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Calendar exported successfully', 'success');
        } catch (error) {
            hideLoading();
            showToast(`Export failed: ${error.message}`, 'error');
        }
    },

    async importExcel(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            showToast('Please select an Excel file (.xlsx or .xls)', 'warning');
            event.target.value = '';
            return;
        }

        if (!confirm(`Import entries from "${file.name}"?\nThis will add new entries to your calendar.`)) {
            event.target.value = '';
            return;
        }

        try {
            showLoading(`Importing from ${file.name}...`);
            const result = await api.importCalendarExcel(file);
            hideLoading();
            
            let msg = `Imported ${result.created_ids?.length || 0} entries`;
            if (result.failed?.length > 0) {
                msg += `, ${result.failed.length} failed`;
            }
            showToast(msg, result.failed?.length > 0 ? 'warning' : 'success');
            
            this.loadCalendar();
        } catch (error) {
            hideLoading();
            showToast(`Import failed: ${error.message}`, 'error');
        }
        
        event.target.value = '';
    },

    async downloadTemplate() {
        try {
            showLoading('Downloading template...');
            const blob = await api.downloadCalendarTemplate();
            hideLoading();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'calendar_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Template downloaded', 'success');
        } catch (error) {
            hideLoading();
            showToast(`Download failed: ${error.message}`, 'error');
        }
    },

    // ── Tag Filter ────────────────────────────────────────────
    async filterByTag() {
        const tag = $('calendarTagFilter') ? $('calendarTagFilter').value : '';
        if (!tag) {
            this.applyFilter();
            return;
        }
        try {
            showLoading('Filtering by tag...');
            const entries = await api.getEntriesByTag(tag);
            this.filteredEntries = Array.isArray(entries) ? entries : (entries.entries || []);
            this.currentPage = 1;
            this.renderTable(this.filteredEntries);
            hideLoading();
        } catch (e) {
            hideLoading();
            showToast(`Failed to filter by tag: ${e.message}`, 'error');
        }
    },

    // ── Tags Chip Input helpers ────────────────────────────────
    _addTag(tag) {
        tag = tag.trim().toLowerCase().replace(/\s+/g, '-');
        if (!tag || this._tagsStore.includes(tag)) return;
        this._tagsStore.push(tag);
        this._renderTagsChips();
    },

    _removeTag(tag) {
        this._tagsStore = this._tagsStore.filter(t => t !== tag);
        this._renderTagsChips();
    },

    _renderTagsChips() {
        const chipsEl = $('tagsChips');
        const hiddenEl = $('postTagsHidden');
        if (!chipsEl) return;
        chipsEl.innerHTML = this._tagsStore.map(t => `
            <span class="tag-chip" style="display:inline-flex;align-items:center;background:rgba(99,102,241,0.15);color:var(--primary);border-radius:20px;padding:3px 10px;font-size:0.8rem;margin:2px;gap:6px;">
                ${escapeHtml(t)}
                <span style="cursor:pointer;font-size:0.9rem;opacity:0.7;" onclick="Calendar._removeTag('${escapeHtml(t)}')">&times;</span>
            </span>
        `).join('');
        if (hiddenEl) hiddenEl.value = JSON.stringify(this._tagsStore);
    },

    _renderTagChips(tags) {
        if (!tags || !tags.length) return '<span class="text-muted" style="font-size:0.8rem;">—</span>';
        const list = Array.isArray(tags) ? tags : (typeof tags === 'string' ? JSON.parse(tags) : []);
        return list.map(t => `<span style="background:rgba(99,102,241,0.12);color:var(--primary);border-radius:10px;padding:2px 8px;font-size:0.75rem;margin:1px;display:inline-block;">${escapeHtml(t)}</span>`).join('');
    },
};
