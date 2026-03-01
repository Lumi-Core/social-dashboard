
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatDateReadable(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatDateTime(datetime) {
    if (!datetime) return 'N/A';
    const d = new Date(datetime);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getToday() {
    return formatDate(new Date());
}

function timeAgo(datetime) {
    if (!datetime) return 'N/A';
    const now = new Date();
    const then = new Date(datetime);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    
    return formatDateReadable(datetime);
}

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatNumberShort(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function snakeToTitle(text) {
    if (!text) return '';
    return text.split('_').map(word => capitalize(word)).join(' ');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    
    if (['posted', 'completed', 'success', 'healthy', 'approved'].includes(s)) {
        return 'posted';
    }
    if (['pending', 'awaiting', 'waiting', 'awaiting approval'].includes(s) || s.includes('awaiting')) {
        return 'pending';
    }
    if (['scheduled', 'running', 'in-progress', 'processing', 'revision', 'revising'].includes(s) || s.includes('revis')) {
        return 'scheduled';
    }
    if (['failed', 'error', 'rejected', 'unhealthy'].includes(s)) {
        return 'failed';
    }
    return '';
}

function getStatusIcon(status) {
    if (!status) return 'fa-circle';
    const s = status.toLowerCase();
    
    if (['posted', 'completed', 'success', 'healthy', 'approved'].includes(s)) {
        return 'fa-check-circle';
    }
    if (['pending', 'awaiting', 'waiting', 'awaiting approval'].includes(s) || s.includes('awaiting')) {
        return 'fa-clock';
    }
    if (['scheduled', 'running', 'in-progress', 'processing', 'revision', 'revising'].includes(s) || s.includes('revis')) {
        return 'fa-edit';
    }
    if (['failed', 'error', 'rejected', 'unhealthy'].includes(s)) {
        return 'fa-times-circle';
    }
    return 'fa-circle';
}

function $(id) {
    return document.getElementById(id);
}

function $$(selector) {
    return document.querySelector(selector);
}

function $$$(selector) {
    return document.querySelectorAll(selector);
}

function on(element, event, handler) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.addEventListener(event, handler);
    }
}

function removeClassFromAll(selector, className) {
    $$$(selector).forEach(el => el.classList.remove(className));
}

function show(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.remove('hidden');
    }
}

function hide(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.add('hidden');
    }
}

function toggle(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.toggle('hidden');
    }
}

function showToast(message, type = 'info', title = null, duration = 5000) {
    const container = $('toastContainer');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type]}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function openModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeAllModals() {
    $$$('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// --------------- Loading Indicators ---------------
// showLoading / hideLoading: non-blocking top bar + small status text.
// showBlockingLoader / hideBlockingLoader: full-page overlay for critical ops.

let _loadingCount = 0;

function showLoading(message = 'Loading...') {
    _loadingCount++;
    // Top progress bar
    let bar = document.getElementById('topProgressBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'topProgressBar';
        bar.className = 'top-progress-bar';
        document.body.appendChild(bar);
    }
    bar.classList.add('active');

    // Small inline status indicator (bottom-right)
    let indicator = document.getElementById('loadingIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<div class="loading-indicator-spinner"></div><span></span>';
        document.body.appendChild(indicator);
    }
    indicator.querySelector('span').textContent = message;
    indicator.classList.add('active');
}

function hideLoading() {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount > 0) return; // still loading something else

    const bar = document.getElementById('topProgressBar');
    if (bar) bar.classList.remove('active');

    const indicator = document.getElementById('loadingIndicator');
    if (indicator) indicator.classList.remove('active');
}

function showBlockingLoader(message = 'Please wait...') {
    const overlay = $('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideBlockingLoader() {
    const overlay = $('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function getFormData(formId) {
    const form = $(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        
        if (value === '') continue;
        data[key] = value;
    }
    
    return data;
}

function resetForm(formId) {
    const form = $(formId);
    if (form) {
        form.reset();
    }
}

function populateForm(formId, data) {
    const form = $(formId);
    if (!form || !data) return;
    
    Object.keys(data).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input) {
            input.value = data[key] || '';
        }
    });
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function isValidDate(dateString) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    return re.test(dateString);
}

function exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) {
        showToast('No data to export', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let cell = row[header] ?? '';
                
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    cell = '"' + cell.replace(/"/g, '""') + '"';
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast(`Exported ${data.length} rows to ${filename}`, 'success');
}

/**
 * Export data to JSON
 */
function exportToJSON(data, filename = 'export.json') {
    if (!data) {
        showToast('No data to export', 'warning');
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    showToast(`Exported to ${filename}`, 'success');
}

// =========================================================================
// DEBOUNCE & THROTTLE
// =========================================================================

/**
 * Debounce function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =========================================================================
// FILE UPLOAD UTILITIES
// =========================================================================

/**
 * Initialize file upload area with drag & drop and preview
 */
function initFileUpload(options) {
    const {
        inputId,
        areaId,
        previewId,
        urlInputId,
        onUploadComplete,
        onError
    } = options;
    
    const input = $(inputId);
    const area = $(areaId);
    const preview = $(previewId);
    const urlInput = $(urlInputId);
    
    if (!input || !area) {
        console.error('File upload elements not found:', inputId, areaId);
        return;
    }
    
    // Drag & drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        area.addEventListener(eventName, () => {
            area.classList.add('dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        area.addEventListener(eventName, () => {
            area.classList.remove('dragover');
        });
    });
    
    area.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            input.files = files;
            handleFileSelect(files[0]);
        }
    });
    
    // File input change
    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    async function handleFileSelect(file) {
        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/quicktime', 'video/mov'
        ];
        
        if (!allowedTypes.includes(file.type)) {
            showToast('Invalid file type. Please upload an image or video.', 'error');
            if (onError) onError(new Error('Invalid file type'));
            return;
        }
        
        // Validate file size
        const maxSize = file.type.startsWith('video') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const maxMB = maxSize / (1024 * 1024);
            showToast(`File too large. Maximum size: ${maxMB}MB`, 'error');
            if (onError) onError(new Error('File too large'));
            return;
        }
        
        // Show preview
        showFilePreview(file, preview, area);
        
        // Upload file
        try {
            area.classList.add('uploading');
            updatePreviewStatus(preview, 'uploading', 'Uploading...');
            
            const result = await api.uploadFile(file, (progress) => {
                updatePreviewProgress(preview, progress);
            });
            
            if (result.success) {
                area.classList.remove('uploading');
                area.classList.add('has-file');
                updatePreviewStatus(preview, 'success', 'Uploaded');
                
                // Set the media URL in hidden input
                if (urlInput) {
                    urlInput.value = result.media_url;
                }
                
                if (onUploadComplete) {
                    onUploadComplete(result);
                }
                
                showToast('File uploaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            area.classList.remove('uploading');
            updatePreviewStatus(preview, 'error', 'Failed');
            showToast(`Upload failed: ${error.message}`, 'error');
            if (onError) onError(error);
        }
    }
    
    function showFilePreview(file, previewEl, areaEl) {
        previewEl.classList.add('show');
        
        const isImage = file.type.startsWith('image');
        const isVideo = file.type.startsWith('video');
        
        let thumbHtml = '';
        if (isImage) {
            const url = URL.createObjectURL(file);
            thumbHtml = `<img src="${url}" alt="Preview" class="file-preview-thumb" onload="URL.revokeObjectURL(this.src)">`;
        } else if (isVideo) {
            thumbHtml = `<div class="file-preview-thumb" style="display:flex;align-items:center;justify-content:center;"><i class="fas fa-video" style="font-size:24px;color:var(--gray-400)"></i></div>`;
        }
        
        previewEl.innerHTML = `
            <div class="file-preview-item">
                ${thumbHtml}
                <div class="file-preview-info">
                    <div class="file-preview-name">${escapeHtml(file.name)}</div>
                    <div class="file-preview-size">${formatFileSize(file.size)}</div>
                    <div class="upload-progress">
                        <div class="upload-progress-bar" style="width: 0%"></div>
                    </div>
                </div>
                <div class="file-preview-status uploading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Uploading...</span>
                </div>
                <button type="button" class="file-remove" onclick="clearFileUpload('${areaEl.id}', '${previewEl.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    return {
        clear: () => clearFileUpload(areaId, previewId)
    };
}

function updatePreviewProgress(previewEl, progress) {
    const progressBar = previewEl.querySelector('.upload-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function updatePreviewStatus(previewEl, status, text) {
    const statusEl = previewEl.querySelector('.file-preview-status');
    if (statusEl) {
        statusEl.className = `file-preview-status ${status}`;
        
        let icon = '';
        switch (status) {
            case 'uploading':
                icon = '<i class="fas fa-spinner fa-spin"></i>';
                break;
            case 'success':
                icon = '<i class="fas fa-check-circle"></i>';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle"></i>';
                break;
        }
        
        statusEl.innerHTML = `${icon}<span>${text}</span>`;
    }
}

function clearFileUpload(areaId, previewId) {
    const area = $(areaId);
    const preview = $(previewId);
    const input = area?.querySelector('.file-input');
    const urlInput = area?.parentElement?.querySelector('input[type="hidden"]');
    
    if (area) {
        area.classList.remove('uploading', 'has-file', 'dragover');
    }
    
    if (preview) {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
    
    if (input) {
        input.value = '';
    }
    
    if (urlInput) {
        urlInput.value = '';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
