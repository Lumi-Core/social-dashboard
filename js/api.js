
class ApiService {
    constructor() {
        this.baseUrl = localStorage.getItem('apiBaseUrl') || 'https://social-media-agent-production-e6df.up.railway.app';
        this.apiKey = localStorage.getItem('apiKey') || '';
    }

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, ''); 
        localStorage.setItem('apiBaseUrl', this.baseUrl);
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('apiKey', this.apiKey);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        return headers;
    }

    async fetchWithTimeout(url, options = {}, timeout = 30000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    async get(endpoint) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    }

    async post(endpoint, data = {}) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    }

    async uploadFile(file, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('Invalid response format'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed: Network error'));
            });
            
            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload failed: Timeout'));
            });
            
            xhr.open('POST', `${this.baseUrl}/api/media/upload`);
            
            if (this.apiKey) {
                xhr.setRequestHeader('X-API-Key', this.apiKey);
            }
            
            xhr.timeout = 300000; 
            xhr.send(formData);
        });
    }

    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    }

    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    }

    async getRoot() {
        return this.get('/');
    }

    async getHealth() {
        return this.get('/health');
    }

    async getHealthLive() {
        return this.get('/api/health/live');
    }

    async getHealthReady() {
        return this.get('/api/health/ready');
    }

    async getConfig() {
        return this.get('/api/config');
    }

    async getGenerationInstructions() {
        return this.get('/api/generation-instructions');
    }

    async updateGenerationInstructions(instructions) {
        return this.put('/api/generation-instructions', { instructions });
    }

    async getSchedulerStatus() {
        return this.get('/api/scheduler/status');
    }

    async triggerScheduler() {
        return this.post('/api/scheduler/trigger');
    }

    async getCalendar() {
        return this.get('/api/calendar');
    }

    async getCalendarToday() {
        return this.get('/api/calendar/today');
    }

    async getCalendarByDate(date) {
        return this.get(`/api/calendar/by-date/${date}`);
    }

    async getCalendarEntry(id) {
        return this.get(`/api/calendar/${id}`);
    }

    async addCalendarEntry(data) {
        return this.post('/api/calendar/add', data);
    }

    async bulkAddCalendarEntries(entries) {
        return this.post('/api/calendar/bulk-add', entries);
    }

    async deleteCalendarEntry(id) {
        return this.delete(`/api/calendar/${id}`);
    }

    async exportCalendarExcel() {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/api/calendar/export/excel`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error(`Export failed: ${response.status}`);
        return response.blob();
    }

    async importCalendarExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        const headers = {};
        if (this.apiKey) headers['X-API-Key'] = this.apiKey;
        const response = await this.fetchWithTimeout(`${this.baseUrl}/api/calendar/import/excel`, {
            method: 'POST',
            headers: headers,
            body: formData,
        }, 60000);
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Import failed: ${response.status} - ${text}`);
        }
        return response.json();
    }

    async downloadCalendarTemplate() {
        const response = await this.fetchWithTimeout(`${this.baseUrl}/api/calendar/export/template`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!response.ok) throw new Error(`Template download failed: ${response.status}`);
        return response.blob();
    }

    async startWorkflow(data) {
        return this.post('/api/workflow/start', data);
    }

    async startWorkflowById(entryId) {
        return this.post(`/api/workflow/start-by-id/${entryId}`);
    }

    async runDailyWorkflow() {
        return this.post('/api/workflow/run-daily');
    }

    async runWorkflowByDate(date) {
        return this.post(`/api/workflow/run-by-date/${date}`);
    }

    async getWorkflowStatus(sessionId) {
        return this.get(`/api/workflow/status/${sessionId}`);
    }

    async getTracking() {
        return this.get('/api/tracking');
    }

    async getTrackingPost(postId) {
        return this.get(`/api/tracking/${postId}`);
    }

    async getMetrics() {
        return this.get('/api/metrics');
    }

    async getMetricsPosts() {
        return this.get('/api/metrics/posts');
    }

    async getMetricsForPost(mediaId) {
        return this.get(`/api/metrics/${mediaId}`);
    }

    async refreshMetrics() {
        return this.post('/api/metrics/refresh');
    }

    async getAnalyticsFullReport() {
        return this.get('/api/analytics/report');
    }

    async getPendingApprovals() {
        return this.get('/api/approval/pending');
    }

    async approvePost(entryId) {
        return this.post('/api/approval/action', {
            entry_id: parseInt(entryId),
            action: 'approve',
            publish_immediately: true
        });
    }

    async rejectPost(entryId, feedback) {
        return this.post('/api/approval/action', {
            entry_id: parseInt(entryId),
            action: 'reject',
            feedback: feedback || ''
        });
    }

    async submitRevision(entryId, feedback) {
        return this.post('/api/approval/action', {
            entry_id: parseInt(entryId),
            action: 'revise',
            feedback: feedback
        });
    }

    async getAgentTasks() {
        return this.get('/api/agent/tasks');
    }

    async runAgent(data) {
        return this.post('/api/agent/run', data);
    }

    async getErrors() {
        return this.get('/api/errors');
    }

    async getErrorLogs() {
        return this.get('/api/logs/errors');
    }

    async cleanDatabase(tables = 'all') {
        return this.post('/api/db/clean', { tables });
    }

    async getDbStats() {
        return this.get('/api/db/stats');
    }

    // ── Calendar (extra) ──────────────────────────────────────
    async updateCalendarEntry(id, data) {
        return this.put(`/api/calendar/${id}`, data);
    }

    async getCalendarPending() {
        return this.get('/api/calendar/pending');
    }

    async getCalendarByStatus(status) {
        return this.get(`/api/calendar/status/${encodeURIComponent(status)}`);
    }

    async getCalendarByRange(startDate, endDate) {
        return this.get(`/api/calendar/range?start_date=${startDate}&end_date=${endDate}`);
    }

    // ── Alerts ───────────────────────────────────────────────
    async getAlerts(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.get(`/api/alerts${qs ? '?' + qs : ''}`);
    }

    async getAlertCount() {
        return this.get('/api/alerts/count');
    }

    async dismissAlert(id) {
        return this.post(`/api/alerts/${id}/dismiss`);
    }

    async dismissAllAlerts() {
        return this.post('/api/alerts/dismiss-all');
    }

    // ── Tags ─────────────────────────────────────────────────
    async getAllTags() {
        return this.get('/api/tags');
    }

    async updateEntryTags(id, tags) {
        return this.put(`/api/calendar/${id}/tags`, { tags });
    }

    async getEntriesByTag(tag) {
        return this.get(`/api/calendar/by-tag/${encodeURIComponent(tag)}`);
    }

    // ── Caption Variants ─────────────────────────────────────
    async generateCaptionVariants(id) {
        return this.post(`/api/workflow/generate-variants/${id}`);
    }

    async getCaptionVariants(id) {
        return this.get(`/api/workflow/variants/${id}`);
    }

    async selectCaptionVariant(id, variantIndex) {
        return this.post(`/api/workflow/select-variant/${id}`, { variant_index: variantIndex });
    }

    // ── Suggestions ──────────────────────────────────────────
    async getHookSuggestions(topic, product, audience) {
        return this.post('/api/suggestions/hooks', { topic, product, audience });
    }

    async getHashtagSuggestions(topic, product, audience) {
        return this.post('/api/suggestions/hashtags', { topic, product, audience });
    }

    async getActionSuggestions(entryId) {
        return this.get(`/api/suggestions/${entryId}`);
    }

    async suggestReschedule(entryId, proposedTime) {
        return this.post('/api/workflow/suggest-reschedule', { entry_id: entryId, proposed_time: proposedTime });
    }

    // ── Analytics (enhanced) ─────────────────────────────────
    async getAnalyticsByTags() {
        return this.get('/api/analytics/by-tags');
    }

    async comparePosts(mediaIds) {
        return this.post('/api/analytics/compare', { media_ids: mediaIds });
    }

    async comparePeriods(period1Start, period1End, period2Start, period2End) {
        return this.get(`/api/analytics/compare-periods?period1_start=${period1Start}&period1_end=${period1End}&period2_start=${period2Start}&period2_end=${period2End}`);
    }

    async getBestTimes() {
        return this.get('/api/analytics/best-times');
    }

    // ── Reports ──────────────────────────────────────────────
    async generateReport(body) {
        return this.post('/api/reports/generate', body);
    }

    async listReports() {
        return this.get('/api/reports');
    }

    async getReport(id) {
        return this.get(`/api/reports/${id}`);
    }

    // ── Platform Instructions ─────────────────────────────────
    async getAllPlatformInstructions() {
        return this.get('/api/generation-instructions/platforms');
    }

    async getPlatformInstructions(platform) {
        return this.get(`/api/generation-instructions/${platform}`);
    }

    async updatePlatformInstructions(platform, instructions) {
        return this.put(`/api/generation-instructions/${platform}`, { instructions });
    }

    // ── Metrics (enhanced) ───────────────────────────────────
    async getMetricsFiltered(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return this.get(`/api/metrics/posts/filtered${qs ? '?' + qs : ''}`);
    }

    async debugPostMetrics(mediaId) {
        return this.get(`/api/metrics/debug/${mediaId}`);
    }
}

const api = new ApiService();
