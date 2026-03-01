
const Workflow = {
    initialized: false,
    fileUploader: null,
    
    init() {
        this.bindEvents();
        this.initFileUpload();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
    },

    initFileUpload() {
        this.fileUploader = initFileUpload({
            inputId: 'workflowMediaFile',
            areaId: 'workflowMediaUpload',
            previewId: 'workflowMediaPreview',
            urlInputId: 'workflowMediaUrl',
            onUploadComplete: (result) => {
                console.log('Workflow media uploaded:', result.media_url);
            },
            onError: (error) => {
                console.error('Workflow media upload error:', error);
            }
        });
    },

    bindEvents() {
        
        on('workflowForm', 'submit', (e) => {
            e.preventDefault();
            this.startWorkflow();
        });

        on('runDailyBtn',          'click', () => this.runDaily());
        on('runByDateBtn',         'click', () => this.runByDate());
        on('runByIdBtn',           'click', () => this.runByEntryId());
        on('checkStatusBtn',       'click', () => this.checkStatus());

        // New controls
        on('generateVariantsBtn',  'click', () => this.generateVariants());
        on('openSuggestionsBtn',   'click', () => openModal('suggestionsModal'));
        on('openRescheduleBtn',    'click', () => openModal('rescheduleModal'));
        on('getHookSuggestionsBtn',   'click', () => this.fetchSuggestions('hooks'));
        on('getHashtagSuggestionsBtn','click', () => this.fetchSuggestions('hashtags'));
        on('checkRescheduleBtn',   'click', () => this.checkReschedule());

        // Close modals
        on('closeVariantsModal',    'click', () => closeModal('variantsModal'));
        on('closeSuggestionsModal', 'click', () => closeModal('suggestionsModal'));
        on('closeRescheduleModal',  'click', () => closeModal('rescheduleModal'));

        document.querySelectorAll('#variantsModal .modal-overlay, #suggestionsModal .modal-overlay, #rescheduleModal .modal-overlay').forEach(el => {
            el.addEventListener('click', () => closeAllModals());
        });
    },

    async startWorkflow() {
        const data = getFormData('workflowForm');

        // Validate all required fields
        const missing = [];
        if (!data.scheduled_date) missing.push('Scheduled Date');
        if (!data.topic)          missing.push('Topic');
        if (!data.product)        missing.push('Product');
        if (!data.audience)       missing.push('Target Audience');
        if (!data.cta)            missing.push('Call to Action');
        if (!data.media_link && !data.media_url) missing.push('Media File');

        if (missing.length > 0) {
            showToast(`Please fill in: ${missing.join(', ')}`, 'warning');
            return;
        }

        // Ensure media_link is set (from file upload or manual)
        if (!data.media_link && data.media_url) {
            data.media_link = data.media_url;
        }

        try {
            showBlockingLoader('Starting workflow...');
            const result = await api.startWorkflow(data);
            hideBlockingLoader();
            
            showToast('Workflow started successfully!', 'success');
            
            if (result.session_id) {
                $('sessionIdInput').value = result.session_id;
                this.displayStatus(result);
            }
            
            resetForm('workflowForm');
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    async runDaily() {
        try {
            showBlockingLoader('Running daily workflow...');
            const result = await api.runDailyWorkflow();
            hideBlockingLoader();
            
            showToast('Daily workflow started!', 'success');
            this.displayStatus(result);
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to run daily workflow: ${error.message}`, 'error');
        }
    },

    async runByDate() {
        const date = $('workflowDate').value;
        
        if (!date) {
            showToast('Please select a date', 'warning');
            return;
        }

        try {
            showBlockingLoader(`Running workflow for ${date}...`);
            const result = await api.runWorkflowByDate(date);
            hideBlockingLoader();
            
            showToast(`Workflow for ${date} started!`, 'success');
            this.displayStatus(result);
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to run workflow: ${error.message}`, 'error');
        }
    },

    async runByEntryId() {
        const entryId = $('workflowEntryId').value;
        
        if (!entryId) {
            showToast('Please enter an entry ID', 'warning');
            return;
        }

        try {
            showBlockingLoader(`Starting workflow for entry #${entryId}...`);
            const result = await api.startWorkflowById(entryId);
            hideBlockingLoader();
            
            showToast(`Workflow for entry #${entryId} started!`, 'success');
            
            if (result.session_id) {
                $('sessionIdInput').value = result.session_id;
            }
            
            this.displayStatus(result);
        } catch (error) {
            hideBlockingLoader();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    async checkStatus() {
        const sessionId = $('sessionIdInput').value.trim();
        
        if (!sessionId) {
            showToast('Please enter a session ID', 'warning');
            return;
        }

        try {
            showLoading('Checking status...');
            const result = await api.getWorkflowStatus(sessionId);
            hideLoading();
            
            this.displayStatus(result);
        } catch (error) {
            hideLoading();
            showToast(`Failed to get status: ${error.message}`, 'error');
            this.displayError(error.message);
        }
    },

    displayStatus(data) {
        const container = $('workflowStatus');
        if (!container) return;

        if (!data) {
            container.innerHTML = '<p class="text-muted">No status data available</p>';
            return;
        }

        const steps = [
            { id: 'init', name: 'Initialize', icon: 'fa-rocket' },
            { id: 'media', name: 'Process Media', icon: 'fa-image' },
            { id: 'research', name: 'Research Trends', icon: 'fa-search' },
            { id: 'generate', name: 'Generate Content', icon: 'fa-magic' },
            { id: 'evaluate', name: 'Evaluate Content', icon: 'fa-check-double' },
            { id: 'approval', name: 'Send for Approval', icon: 'fa-envelope' },
            { id: 'publish', name: 'Publish', icon: 'fa-paper-plane' },
        ];

        const currentStep = data.current_step || data.status || 'init';
        const status = data.status || 'unknown';
        const isCompleted = status === 'completed' || status === 'success';
        const isFailed = status === 'failed' || status === 'error';

        let html = `
            <div class="status-header" style="margin-bottom: 20px;">
                <h4>Session: ${data.session_id || 'N/A'}</h4>
                <span class="status-badge ${getStatusClass(status)}">${capitalize(status)}</span>
            </div>
        `;

        if (data.message) {
            html += `<p style="margin-bottom: 20px;">${escapeHtml(data.message)}</p>`;
        }

        html += '<div class="workflow-steps">';
        
        let reachedCurrent = false;
        steps.forEach((step, index) => {
            let stepStatus = 'pending';
            
            if (isCompleted) {
                stepStatus = 'completed';
            } else if (isFailed && step.id === currentStep) {
                stepStatus = 'error';
                reachedCurrent = true;
            } else if (step.id === currentStep) {
                stepStatus = 'current';
                reachedCurrent = true;
            } else if (!reachedCurrent) {
                stepStatus = 'completed';
            }

            html += `
                <div class="status-step">
                    <div class="step-icon ${stepStatus}">
                        <i class="fas ${stepStatus === 'current' ? 'fa-spinner fa-spin' : 
                            stepStatus === 'completed' ? 'fa-check' : 
                            stepStatus === 'error' ? 'fa-times' : step.icon}"></i>
                    </div>
                    <div class="step-info">
                        <strong>${step.name}</strong>
                        <small class="text-muted">${stepStatus === 'current' ? 'In Progress...' : 
                            stepStatus === 'completed' ? 'Completed' : 
                            stepStatus === 'error' ? 'Failed' : 'Pending'}</small>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';

        if (data.result || data.data) {
            const resultData = data.result || data.data;
            html += `
                <div style="margin-top: 20px; padding: 16px; background: var(--gray-50); border-radius: var(--border-radius);">
                    <h5 style="margin-bottom: 10px;">Result Data:</h5>
                    <pre style="font-size: 0.85rem; white-space: pre-wrap;">${JSON.stringify(resultData, null, 2)}</pre>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    displayError(message) {
        const container = $('workflowStatus');
        if (!container) return;

        container.innerHTML = `
            <div class="alert alert-danger" style="padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: var(--border-radius); color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Error:</strong> ${escapeHtml(message)}
            </div>
        `;
    },

    // ── Caption Variants ──────────────────────────────────────
    async generateVariants(entryIdOverride) {
        const rawId = entryIdOverride || ($('variantsEntryId') ? $('variantsEntryId').value : '');
        const entryId = parseInt(rawId);
        if (!entryId) { showToast('Please enter an Entry ID', 'warning'); return; }

        const body = $('variantsModalBody');
        if (body) body.innerHTML = '<div class="text-center" style="padding:30px;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:10px;"></i>Generating variants...</div>';
        openModal('variantsModal');

        try {
            // Prefer cached variants first; if none, generate then load
            let data;
            try {
                data = await api.getCaptionVariants(entryId);
                if (!data || !data.variants || !data.variants.length) throw new Error('No variants');
            } catch (_) {
                await api.generateCaptionVariants(entryId);
                data = await api.getCaptionVariants(entryId);
            }
            if (body) body.innerHTML = this._renderVariants(entryId, data.variants || []);
        } catch (e) {
            if (body) body.innerHTML = `<div class="text-danger" style="padding:20px;"><i class="fas fa-times-circle"></i> ${escapeHtml(e.message)}</div>`;
        }
    },

    _renderVariants(entryId, variants) {
        if (!variants.length) return '<div class="analytics-empty-state"><p>No variants found</p></div>';
        return `
        <div style="display:flex;flex-direction:column;gap:16px;">
            ${variants.map((v, i) => `
            <div style="background:rgba(30,41,59,0.8);border-radius:10px;padding:16px;border:1px solid rgba(255,255,255,0.07);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:var(--primary);">Variant ${i + 1}</strong>
                    <button class="btn btn-sm btn-success" onclick="Workflow.selectVariant(${entryId}, ${i})">
                        <i class="fas fa-check"></i> Select
                    </button>
                </div>
                <div style="font-size:0.9rem;line-height:1.6;white-space:pre-wrap;color:var(--text-primary);">${escapeHtml(v.caption || v.text || v)}</div>
                ${v.hashtags ? `<div style="margin-top:8px;color:var(--primary);font-size:0.82rem;">${escapeHtml(v.hashtags)}</div>` : ''}
            </div>`).join('')}
        </div>`;
    },

    async selectVariant(entryId, variantIndex) {
        try {
            showBlockingLoader('Selecting variant...');
            await api.selectCaptionVariant(entryId, variantIndex);
            hideBlockingLoader();
            showToast(`Variant ${variantIndex + 1} selected as caption!`, 'success');
            closeModal('variantsModal');
        } catch (e) {
            hideBlockingLoader();
            showToast(`Failed to select variant: ${e.message}`, 'error');
        }
    },

    // ── Suggestions ───────────────────────────────────────────
    async fetchSuggestions(type) {
        const topic    = $('suggTopic')    ? $('suggTopic').value.trim()    : '';
        const product  = $('suggProduct')  ? $('suggProduct').value.trim()  : '';
        const audience = $('suggAudience') ? $('suggAudience').value.trim() : '';

        const result = $('suggestionsResult');
        if (result) result.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Getting suggestions...</div>';

        try {
            const data = type === 'hooks'
                ? await api.getHookSuggestions(topic, product, audience)
                : await api.getHashtagSuggestions(topic, product, audience);

            const items = data.hooks || data.hashtags || data.suggestions || data || [];
            if (!result) return;
            if (!items.length) {
                result.innerHTML = '<div class="analytics-empty-state"><p>No suggestions returned</p></div>';
                return;
            }
            result.innerHTML = `
            <div style="margin-top:16px;">
                <h4 style="color:var(--primary);margin-bottom:12px;">
                    <i class="fas ${type === 'hooks' ? 'fa-bolt' : 'fa-hashtag'}"></i> 
                    ${type === 'hooks' ? 'Hook Ideas' : 'Hashtag Suggestions'}
                </h4>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${items.map((item, i) => {
                        const text = typeof item === 'string' ? item : (item.text || item.hook || item.hashtag || JSON.stringify(item));
                        return `
                        <div style="background:rgba(30,41,59,0.8);border-radius:8px;padding:12px 16px;border-left:3px solid var(--primary);display:flex;justify-content:space-between;align-items:center;gap:12px;">
                            <span style="font-size:0.9rem;">${i+1}. ${escapeHtml(text)}</span>
                            <button class="btn btn-sm btn-secondary" style="min-width:70px;" onclick="navigator.clipboard.writeText(${JSON.stringify(text)}).then(()=>showToast('Copied!','success'))">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        } catch (e) {
            if (result) result.innerHTML = `<div class="text-danger"><i class="fas fa-times-circle"></i> ${escapeHtml(e.message)}</div>`;
        }
    },

    // ── Reschedule Optimizer ──────────────────────────────────
    async checkReschedule() {
        const entryId      = $('rescheduleEntryId')    ? $('rescheduleEntryId').value.trim()    : '';
        const proposedTime = $('rescheduleProposedTime') ? $('rescheduleProposedTime').value : '';
        const result = $('rescheduleResult');

        if (!entryId || !proposedTime) {
            showToast('Please fill in both Entry ID and proposed time', 'warning');
            return;
        }
        if (result) result.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Analyzing...</div>';
        try {
            const data = await api.suggestReschedule(parseInt(entryId), proposedTime);
            if (!result) return;
            const isOptimal = data.is_optimal !== false;
            result.innerHTML = `
            <div style="padding:16px;background:${isOptimal ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'};border-radius:8px;border-left:4px solid ${isOptimal ? 'var(--success)' : 'var(--warning)'};">
                <div style="font-weight:700;font-size:1rem;color:${isOptimal ? 'var(--success)' : 'var(--warning)'};margin-bottom:8px;">
                    <i class="fas fa-${isOptimal ? 'check-circle' : 'exclamation-triangle'}"></i>
                    ${isOptimal ? 'Good Time!' : 'Consider Rescheduling'}
                </div>
                <p style="font-size:0.9rem;color:var(--text-secondary);">${escapeHtml(data.message || data.reason || '')}</p>
                ${data.suggested_time ? `<div style="margin-top:10px;font-size:0.88rem;color:var(--primary);"><strong>Suggested better time:</strong> ${escapeHtml(data.suggested_time)}</div>` : ''}
                ${data.best_hours ? `<div style="margin-top:8px;font-size:0.82rem;color:var(--text-muted);">Top hours: ${data.best_hours.join(', ')}</div>` : ''}
            </div>`;
        } catch (e) {
            if (result) result.innerHTML = `<div class="text-danger"><i class="fas fa-times-circle"></i> ${escapeHtml(e.message)}</div>`;
        }
    },
};
