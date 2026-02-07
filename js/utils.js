/**
 * Utility Functions Module
 */

// =========================================================================
// DATE UTILITIES
// =========================================================================

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

/**
 * Format date to human readable
 */
function formatDateReadable(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format datetime to human readable
 */
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

/**
 * Get today's date in YYYY-MM-DD format
 */
function getToday() {
    return formatDate(new Date());
}

/**
 * Calculate time ago
 */
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

// =========================================================================
// NUMBER UTILITIES
// =========================================================================

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format number with K/M suffix
 */
function formatNumberShort(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * Check if URL is a video file
 */
function isVideoMedia(url) {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.wmv', '.mkv', '.m4v'];
    const urlLower = url.toLowerCase();
    return videoExtensions.some(ext => urlLower.includes(ext));
}

/**
 * Check if URL is an image file
 */
function isImageMedia(url) {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const urlLower = url.toLowerCase();
    return imageExtensions.some(ext => urlLower.includes(ext));
}

// =========================================================================
// STRING UTILITIES
// =========================================================================

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Export data to CSV file
 */
function exportToCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Build CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const val = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
            // Escape quotes and wrap in quotes if contains comma or quote
            return val.includes(',') || val.includes('"') || val.includes('\n') 
                ? '"' + val.replace(/"/g, '""') + '"'
                : val;
        });
        csv += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${data.length} records to ${filename}`, 'success');
}

/**
 * Initialize file upload area with drag-and-drop
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
    
    const fileInput = $(inputId);
    const uploadArea = $(areaId);
    const preview = $(previewId);
    const urlInput = $(urlInputId);
    
    if (!fileInput || !uploadArea) {
        console.error('File upload elements not found');
        return null;
    }
    
    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });
    
    // Handle drop
    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Handle file select
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    // Handle file upload
    async function handleFile(file) {
        try {
            showLoading(`Uploading ${file.name}...`);
            
            const result = await api.uploadFile(file, (percent) => {
                console.log(`Upload progress: ${percent}%`);
            });
            
            hideLoading();
            
            if (result.media_url) {
                if (urlInput) urlInput.value = result.media_url;
                if (preview) {
                    if (file.type.startsWith('image/')) {
                        preview.innerHTML = `<img src="${result.media_url}" alt="Preview" style="max-width: 100%; border-radius: 8px;">`;
                    } else if (file.type.startsWith('video/')) {
                        preview.innerHTML = `<video src="${result.media_url}" controls style="max-width: 100%; border-radius: 8px;"></video>`;
                    } else {
                        preview.innerHTML = `<p>✓ File uploaded: ${file.name}</p>`;
                    }
                }
                showToast('File uploaded successfully', 'success');
                if (onUploadComplete) onUploadComplete(result);
            }
        } catch (error) {
            hideLoading();
            console.error('Upload error:', error);
            showToast(`Upload failed: ${error.message}`, 'error');
            if (onError) onError(error);
        }
    }
    
    return {
        reset: () => {
            fileInput.value = '';
            if (urlInput) urlInput.value = '';
            if (preview) preview.innerHTML = '';
        }
    };
}

/**
 * Capitalize first letter
 */
function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert snake_case to Title Case
 */
function snakeToTitle(text) {
    if (!text) return '';
    return text.split('_').map(word => capitalize(word)).join(' ');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =========================================================================
// STATUS UTILITIES
// =========================================================================

/**
 * Get status badge class
 */
function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase().replace(/[\s_-]+/g, ' ');
    
    // Posted/Completed/Success states
    if (s.includes('posted') || s.includes('completed') || s.includes('success') || 
        s.includes('healthy') || s.includes('approved')) {
        return 'posted';
    }
    // Pending/Awaiting states - must catch "awaiting approval"
    if (s.includes('pending') || s.includes('awaiting') || s.includes('waiting')) {
        return 'pending';
    }
    // Scheduled/Running/Processing states
    if (s.includes('scheduled') || s.includes('running') || 
        s.includes('in-progress') || s.includes('processing')) {
        return 'scheduled';
    }
    // Failed/Error/Rejected states
    if (s.includes('failed') || s.includes('error') || 
        s.includes('rejected') || s.includes('unhealthy')) {
        return 'failed';
    }
    return '';
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
    if (!status) return 'fa-circle';
    const s = status.toLowerCase().replace(/[\s_-]+/g, ' ');
    
    // Posted/Completed/Success states
    if (s.includes('posted') || s.includes('completed') || s.includes('success') || 
        s.includes('healthy') || s.includes('approved')) {
        return 'fa-check-circle';
    }
    // Pending/Awaiting states
    if (s.includes('pending') || s.includes('awaiting') || s.includes('waiting')) {
        return 'fa-clock';
    }
    // Scheduled/Running/Processing states
    if (s.includes('scheduled') || s.includes('running') || 
        s.includes('in-progress') || s.includes('processing')) {
        return 'fa-spinner fa-spin';
    }
    // Failed/Error/Rejected states
    if (s.includes('failed') || s.includes('error') || 
        s.includes('rejected') || s.includes('unhealthy')) {
        return 'fa-times-circle';
    }
    return 'fa-circle';
}

// =========================================================================
// DOM UTILITIES
// =========================================================================

/**
 * Get element by ID
 */
function $(id) {
    return document.getElementById(id);
}

/**
 * Query selector
 */
function $$(selector) {
    return document.querySelector(selector);
}

/**
 * Query selector all
 */
function $$$(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Add event listener
 */
function on(element, event, handler) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.addEventListener(event, handler);
    }
}

/**
 * Remove class from all elements
 */
function removeClassFromAll(selector, className) {
    $$$(selector).forEach(el => el.classList.remove(className));
}

/**
 * Show element
 */
function show(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.remove('hidden');
    }
}

/**
 * Hide element
 */
function hide(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.add('hidden');
    }
}

/**
 * Toggle element visibility
 */
function toggle(element) {
    if (typeof element === 'string') {
        element = $(element);
    }
    if (element) {
        element.classList.toggle('hidden');
    }
}

// =========================================================================
// TOAST NOTIFICATIONS
// =========================================================================

/**
 * Show toast notification
 */
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

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// =========================================================================
// MODAL UTILITIES
// =========================================================================

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = $(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Close all modals
 */
function closeAllModals() {
    $$$('.modal.active').forEach(modal => {
        modal.classList.remove('active');
    });
    document.body.style.overflow = '';
}

// =========================================================================
// LOADING UTILITIES
// =========================================================================

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    const overlay = $('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = $('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// =========================================================================
// FORM UTILITIES
// =========================================================================

/**
 * Get form data as object
 */
function getFormData(formId) {
    const form = $(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        // Skip empty values
        if (value === '') continue;
        data[key] = value;
    }
    
    return data;
}

/**
 * Reset form
 */
function resetForm(formId) {
    const form = $(formId);
    if (form) {
        form.reset();
    }
}

/**
 * Populate form with data
 */
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

// =========================================================================
// VALIDATION UTILITIES
// =========================================================================

/**
 * Validate email
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    return re.test(dateString);
}

// =========================================================================
// EXPORT UTILITIES
// =========================================================================

/**
 * Export data to CSV
 */
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
                // Escape quotes and wrap in quotes if contains comma
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
                
                // Set the media URL in hidden input for media_link
                if (urlInput) {
                    urlInput.value = result.media_url;
                    
                    // Also set s3_key and media_url in separate hidden fields if they exist
                    const formEl = urlInput.closest('form');
                    if (formEl) {
                        const s3KeyInput = formEl.querySelector('input[name="s3_key"]');
                        const mediaUrlInput = formEl.querySelector('input[name="media_url"]');
                        
                        if (s3KeyInput && result.s3_key) {
                            s3KeyInput.value = result.s3_key;
                        }
                        if (mediaUrlInput && result.media_url) {
                            mediaUrlInput.value = result.media_url;
                        }
                    }
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
