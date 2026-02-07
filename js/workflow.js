/**
 * Workflow Page Module
 */

const Workflow = {
    initialized: false,
    fileUploader: null,
    
    /**
     * Initialize workflow page
     */
    init() {
        this.bindEvents();
        this.initFileUpload();
        this.initialized = true;
    },

    /**
     * Load workflow when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
    },

    /**
     * Initialize file upload
     */
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

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Workflow form submission
        on('workflowForm', 'submit', (e) => {
            e.preventDefault();
            this.startWorkflow();
        });

        // Run daily workflow
        on('runDailyBtn', 'click', () => this.runDaily());

        // Run by date
        on('runByDateBtn', 'click', () => this.runByDate());

        // Run by entry ID
        on('runByIdBtn', 'click', () => this.runByEntryId());

        // Check workflow status
        on('checkStatusBtn', 'click', () => this.checkStatus());
    },

    /**
     * Start new workflow from form
     */
    async startWorkflow() {
        const data = getFormData('workflowForm');

        if (!data.scheduled_date || !data.topic) {
            showToast('Please fill in required fields (Scheduled Date and Topic)', 'warning');
            return;
        }

        try {
            showLoading('Starting workflow...');
            const result = await api.startWorkflow(data);
            hideLoading();
            
            showToast('Workflow started successfully!', 'success');
            
            if (result.session_id) {
                $('sessionIdInput').value = result.session_id;
                this.displayStatus(result);
            }
            
            resetForm('workflowForm');
        } catch (error) {
            hideLoading();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    /**
     * Run daily workflow
     */
    async runDaily() {
        try {
            showLoading('Running daily workflow...');
            const result = await api.runDailyWorkflow();
            hideLoading();
            
            showToast('Daily workflow started!', 'success');
            this.displayStatus(result);
        } catch (error) {
            hideLoading();
            showToast(`Failed to run daily workflow: ${error.message}`, 'error');
        }
    },

    /**
     * Run workflow by date
     */
    async runByDate() {
        const date = $('workflowDate').value;
        
        if (!date) {
            showToast('Please select a date', 'warning');
            return;
        }

        try {
            showLoading(`Running workflow for ${date}...`);
            // Use daily workflow endpoint instead (run-by-date doesn't exist)
            const result = await api.runDailyWorkflow();
            hideLoading();
            
            showToast(`Daily workflow started! (Note: runs all pending posts)`, 'success');
            this.displayStatus(result);
        } catch (error) {
            hideLoading();
            showToast(`Failed to run workflow: ${error.message}`, 'error');
        }
    },

    /**
     * Run workflow by entry ID
     */
    async runByEntryId() {
        const entryId = $('workflowEntryId').value;
        
        if (!entryId) {
            showToast('Please enter an entry ID', 'warning');
            return;
        }

        try {
            showLoading(`Starting workflow for entry #${entryId}...`);
            // Fetch entry data first, then start workflow
            const entry = await api.getCalendarEntry(entryId);
            
            if (!entry) {
                throw new Error(`Entry #${entryId} not found`);
            }
            
            // Start workflow with entry data
            const workflowData = {
                scheduled_date: entry.scheduled_date,
                topic: entry.topic,
                product: entry.product,
                audience: entry.audience,
                cta: entry.cta,
                nationality: entry.nationality,
                age_group: entry.age_group,
                media_link: entry.media_link || entry.media_url,
                media_type: entry.media_type
            };
            
            const result = await api.startWorkflow(workflowData);
            hideLoading();
            
            showToast(`Workflow for entry #${entryId} started!`, 'success');
            
            if (result.session_id) {
                $('sessionIdInput').value = result.session_id;
            }
            
            this.displayStatus(result);
        } catch (error) {
            hideLoading();
            showToast(`Failed to start workflow: ${error.message}`, 'error');
        }
    },

    /**
     * Check workflow status
     */
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

    /**
     * Display workflow status
     */
    displayStatus(data) {
        const container = $('workflowStatus');
        if (!container) return;

        if (!data) {
            container.innerHTML = '<p class="text-muted">No status data available</p>';
            return;
        }

        // Define workflow steps
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

        // Step progress
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

        // Additional data
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

    /**
     * Display error in status container
     */
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
};
