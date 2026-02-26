
const Approvals = {
    pending: [],
    initialized: false,

    init() {
        this.bindEvents();
        this.initialized = true;
    },

    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadApprovals();
    },

    bindEvents() {
        on('refreshApprovals', 'click', () => App.refreshAll());
    },

    async loadApprovals() {
        try {
            showLoading('Loading approvals...');
            this.pending = await api.getPendingApprovals();
            this.render();
            hideLoading();
            
            const badge = $('notificationBadge');
            if (badge) {
                badge.textContent = this.pending.length || 0;
                badge.style.display = this.pending.length > 0 ? 'inline' : 'none';
            }
        } catch (error) {
            hideLoading();
            showToast(`Failed to load approvals: ${error.message}`, 'error');
            this.pending = [];
            this.render();
        }
    },

    render() {
        const grid = $('approvalsGrid');
        const emptyState = $('approvalsEmpty');

        if (!grid) return;

        if (!this.pending || this.pending.length === 0) {
            hide(grid);
            show(emptyState);
            return;
        }

        show(grid);
        hide(emptyState);

        grid.innerHTML = this.pending.map(item => `
            <div class="approval-card">
                <div class="approval-header">
                    <div>
                        <div class="approval-title">${truncate(item.topic || 'Untitled Post', 40)}</div>
                        <div class="approval-date">
                            <i class="fas fa-calendar"></i>
                            Scheduled: ${formatDateReadable(item.scheduled_date)}
                            ${item.scheduled_time ? ' <small style="color:var(--primary);font-weight:600;">' + item.scheduled_time + '</small>' : ''}
                        </div>
                    </div>
                    <span class="status-badge pending">Pending Approval</span>
                </div>
                <div class="approval-content">
                    ${item.media_url ? `
                    <div class="approval-media" style="margin-bottom: 15px; border-radius: 8px; overflow: hidden; max-height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                        ${(item.media_type === 'video' || (item.media_url && (item.media_url.endsWith('.mp4') || item.media_url.endsWith('.mov')))) 
                            ? `<video src="${item.media_url}" style="max-width: 100%; max-height: 200px; object-fit: contain;" controls muted></video>`
                            : `<img src="${item.media_url}" alt="Post Media" style="max-width: 100%; max-height: 200px; object-fit: contain;" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px;color:#999;\\'>Image not available</div>'">`
                        }
                    </div>
                    ` : (item.media_link ? `
                    <div class="approval-media" style="margin-bottom: 15px; border-radius: 8px; overflow: hidden; max-height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                        <img src="${item.media_link}" alt="Post Media" style="max-width: 100%; max-height: 200px; object-fit: contain;" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px;color:#999;\\'>Image not available</div>'">
                    </div>
                    ` : '')}
                    <div class="approval-preview" style="white-space: pre-wrap; max-height: 200px; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 6px; font-size: 0.9rem;">
                        ${item.caption ? escapeHtml(item.caption) : 
                          '<span class="text-muted"><i class="fas fa-info-circle"></i> No caption generated yet. Run the workflow first.</span>'}
                    </div>
                    ${item.evaluation_score ? `
                    <div style="margin-top: 8px; font-size: 0.85rem;">
                        <strong>AI Score:</strong> <span style="color: ${item.evaluation_score >= 7 ? 'var(--success)' : item.evaluation_score >= 5 ? 'var(--warning)' : 'var(--danger)'}; font-weight: 600;">${item.evaluation_score.toFixed(1)}/10</span>
                    </div>
                    ` : ''}
                    <div style="margin-top: 12px; font-size: 0.85rem; color: var(--gray-500);">
                        <p><strong>Product:</strong> ${item.product || 'N/A'}</p>
                        <p><strong>Audience:</strong> ${item.audience || 'N/A'}</p>
                        <p><strong>CTA:</strong> ${item.cta || 'N/A'}</p>
                    </div>
                </div>
                <div class="approval-actions">
                    <button class="btn btn-success" onclick="Approvals.approve(${item.id})">
                        <i class="fas fa-check"></i> Approve & Publish
                    </button>
                    <button class="btn btn-danger" onclick="Approvals.reject(${item.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-secondary" onclick="Approvals.requestRevision(${item.id})">
                        <i class="fas fa-edit"></i> Revise
                    </button>
                    <button class="btn btn-warning" onclick="Approvals.generateVariants(${item.id})" title="Generate caption variants">
                        <i class="fas fa-layer-group"></i> Variants
                    </button>
                </div>
            </div>
        `).join('');
    },

    async approve(entryId) {
        if (!confirm('Approve this post for publishing?')) return;

        try {
            showLoading('Approving & Publishing...');
            const result = await api.approvePost(entryId);
            hideLoading();
            showToast(result.message || 'Post approved successfully!', 'success');
            await App.refreshAll();
        } catch (error) {
            hideLoading();
            showToast(`Failed to approve: ${error.message}`, 'error');
        }
    },

    async reject(entryId) {
        
        const item = this.pending.find(p => p.id === entryId);
        const caption = item ? (item.caption || '').substring(0, 100) : '';
        
        const feedback = prompt(
            'Rejection reason (the AI will auto-revise based on your feedback):\n\n' +
            (caption ? `Current caption: "${caption}..."\n\n` : '') +
            'Examples:\n- Make the hook more attention-grabbing\n- Use a more casual tone\n- Focus more on product benefits'
        );
        if (feedback === null) return; 

        if (!feedback.trim()) {
            
            if (!confirm('No feedback provided. Reject without auto-revision?')) return;
            
            try {
                showLoading('Rejecting...');
                const result = await api.rejectPost(entryId, '');
                hideLoading();
                showToast(result.message || 'Post rejected', 'info');
                await App.refreshAll();
            } catch (error) {
                hideLoading();
                showToast(`Failed to reject: ${error.message}`, 'error');
            }
            return;
        }

        try {
            showLoading('Rejecting & revising content...');
            const result = await api.rejectPost(entryId, feedback);
            hideLoading();
            
            if (result.new_status === 'Awaiting Approval') {
                showToast('Content revised! New version is ready for review.', 'success');
                if (result.evaluation_score) {
                    showToast(`New AI Score: ${result.evaluation_score.toFixed(1)}/10`, 'info');
                }
            } else {
                showToast(result.message || 'Post rejected', 'info');
            }
            await App.refreshAll();
        } catch (error) {
            hideLoading();
            showToast(`Failed to reject: ${error.message}`, 'error');
        }
    },

    async requestRevision(entryId) {
        const item = this.pending.find(p => p.id === entryId);
        const caption = item ? (item.caption || '').substring(0, 100) : '';
        
        const feedback = prompt(
            'What changes would you like to see?\n\n' +
            (caption ? `Current caption: "${caption}..."\n\n` : '') +
            'Be specific about what to change (tone, length, CTA, etc.)'
        );
        if (!feedback || !feedback.trim()) {
            showToast('Please provide revision feedback', 'warning');
            return;
        }

        try {
            showLoading('Revising content with your feedback...');
            const result = await api.submitRevision(entryId, feedback);
            hideLoading();
            
            if (result.new_caption) {
                showToast('Content revised successfully! Review the new version.', 'success');
                if (result.evaluation_score) {
                    showToast(`New AI Score: ${result.evaluation_score.toFixed(1)}/10`, 'info');
                }
            } else {
                showToast(result.message || 'Revision request submitted', 'success');
            }
            await App.refreshAll();
        } catch (error) {
            hideLoading();
            showToast(`Failed to submit revision: ${error.message}`, 'error');
        }
    },

    generateVariants(entryId) {
        // Delegate to Workflow module's variant generator
        if (typeof Workflow !== 'undefined') {
            Workflow.generateVariants(entryId);
        } else {
            showToast('Workflow module not loaded', 'warning');
        }
    },
};
