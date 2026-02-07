/**
 * Approvals Page Module
 */

const Approvals = {
    pending: [],
    initialized: false,

    /**
     * Initialize approvals page
     */
    init() {
        this.bindEvents();
        this.initialized = true;
    },

    /**
     * Load approvals when page becomes active
     */
    onPageActive() {
        if (!this.initialized) {
            this.init();
        }
        this.loadApprovals();
    },

    /**
     * Bind event handlers
     */
    bindEvents() {
        on('refreshApprovals', 'click', () => this.loadApprovals());
    },

    /**
     * Load pending approvals
     */
    async loadApprovals() {
        try {
            showLoading('Loading approvals...');
            this.pending = await api.getPendingApprovals();
            this.render();
            hideLoading();
            
            // Update notification badge
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

    /**
     * Render approvals grid
     */
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
                        </div>
                    </div>
                    <span class="status-badge pending">Pending</span>
                </div>
                <div class="approval-content">
                    ${item.media_url ? `
                        <div class="approval-media" style="margin-bottom: 16px;">
                            ${Approvals.isVideoMedia(item) ? `
                                <video src="${item.media_url}" controls preload="metadata"
                                     style="max-width: 100%; height: auto; border-radius: 8px; max-height: 400px; background: #000;"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                    Your browser does not support video.
                                </video>
                                <div style="display: none; padding: 20px; background: var(--gray-100); border-radius: 8px; text-align: center; color: var(--gray-500);">
                                    <i class="fas fa-video fa-2x" style="margin-bottom: 8px;"></i>
                                    <p>Video unavailable</p>
                                </div>
                            ` : `
                                <img src="${item.media_url}" alt="${item.topic}" 
                                     style="max-width: 100%; height: auto; border-radius: 8px; max-height: 400px; object-fit: cover;"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <div style="display: none; padding: 20px; background: var(--gray-100); border-radius: 8px; text-align: center; color: var(--gray-500);">
                                    <i class="fas fa-image fa-2x" style="margin-bottom: 8px;"></i>
                                    <p>Image unavailable</p>
                                </div>
                            `}
                        </div>
                    ` : ''}
                    <div class="approval-preview" style="background: var(--gray-50); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                        ${item.caption ? escapeHtml(item.caption) : 
                          item.content ? escapeHtml(item.content) :
                          '<span class="text-muted">No caption available</span>'}
                    </div>
                    ${item.hashtags && item.hashtags.length > 0 ? `
                        <div style="margin-bottom: 12px;">
                            ${item.hashtags.map(tag => `<span class="badge" style="margin-right: 4px; background: var(--primary-color); color: white;">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div style="font-size: 0.85rem; color: var(--gray-600);">
                        <p><strong>Product:</strong> ${item.product || 'N/A'}</p>
                        <p><strong>Audience:</strong> ${item.audience || 'N/A'}</p>
                        <p><strong>CTA:</strong> ${item.cta || 'N/A'}</p>
                        ${item.evaluation_score ? `<p><strong>Score:</strong> ${item.evaluation_score}/10</p>` : ''}
                    </div>
                </div>
                <div class="approval-actions">
                    <button class="btn btn-success" onclick="Approvals.approve(${item.id})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger" onclick="Approvals.reject(${item.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn btn-secondary" onclick="Approvals.requestRevision(${item.id})">
                        <i class="fas fa-edit"></i> Revise
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Approve a post
     */
    async approve(entryId) {
        if (!confirm('Approve this post for publishing?')) return;

        try {
            showLoading('Approving...');
            const result = await api.submitApprovalAction({
                entry_id: entryId,
                action: 'approve',
                publish_immediately: false
            });
            hideLoading();
            showToast('Post approved successfully!', 'success');
            this.loadApprovals();
        } catch (error) {
            hideLoading();
            showToast(`Failed to approve: ${error.message}`, 'error');
        }
    },

    /**
     * Check if a media item is a video based on media_type or URL extension
     */
    isVideoMedia(item) {
        if (item.media_type && item.media_type.toLowerCase() === 'video') return true;
        if (item.media_url) {
            const url = item.media_url.toLowerCase().split('?')[0];
            return url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.avi') || url.endsWith('.webm');
        }
        return false;
    },

    /**
     * Reject a post
     */
    async reject(entryId) {
        const feedback = prompt('Please provide rejection reason:');
        if (feedback === null) return; // Cancelled

        try {
            showLoading('Rejecting...');
            const result = await api.submitApprovalAction({
                entry_id: entryId,
                action: 'reject',
                feedback: feedback || 'No reason provided'
            });
            hideLoading();
            showToast('Post rejected', 'info');
            this.loadApprovals();
        } catch (error) {
            hideLoading();
            showToast(`Failed to reject: ${error.message}`, 'error');
        }
    },

    /**
     * Request revision
     */
    async requestRevision(entryId) {
        const feedback = prompt('What changes would you like to see?');
        if (!feedback) {
            showToast('Please provide revision feedback', 'warning');
            return;
        }

        try {
            showLoading('Submitting revision request...');
            const result = await api.submitApprovalAction({
                entry_id: entryId,
                action: 'revise',
                feedback: feedback
            });
            hideLoading();
            showToast('Revision request submitted', 'success');
            this.loadApprovals();
        } catch (error) {
            hideLoading();
            showToast(`Failed to submit revision: ${error.message}`, 'error');
        }
    },
};
