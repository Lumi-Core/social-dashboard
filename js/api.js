/**
 * API Service Module
 * Handles all API communications with the Social Media Agent backend
 */

class ApiService {
    constructor() {
        this.baseUrl = localStorage.getItem('apiBaseUrl') || 'https://social-media-agent-production-e6df.up.railway.app';
        this.apiKey = localStorage.getItem('apiKey') || '';
    }

    /**
     * Set the API base URL
     */
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
        localStorage.setItem('apiBaseUrl', this.baseUrl);
    }

    /**
     * Set the API key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('apiKey', this.apiKey);
    }

    /**
     * Get headers for API requests
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.apiKey) {
            headers['X-API-Key'] = this.apiKey;
        }
        return headers;
    }

    /**
     * Fetch with timeout
     */
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

    /**
     * Make a GET request
     */
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

    /**
     * Make a POST request
     */
    async post(endpoint, data = {}, timeout = 30000) {
        try {
            const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            }, timeout);
            
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

    /**
     * Upload a file to the server
     */
    async uploadFile(file, onProgress) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            
            // Progress tracking
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
            
            // Set API key header if configured
            if (this.apiKey) {
                xhr.setRequestHeader('X-API-Key', this.apiKey);
            }
            
            xhr.timeout = 300000; // 5 minutes for large files
            xhr.send(formData);
        });
    }

    /**
     * Make a DELETE request
     */
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

    // =========================================================================
    // HEALTH & STATUS ENDPOINTS
    // =========================================================================

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

    // =========================================================================
    // CONFIGURATION ENDPOINTS
    // =========================================================================

    async getConfig() {
        return this.get('/api/config');
    }

    async getSchedulerStatus() {
        return this.get('/api/scheduler/status');
    }

    async triggerScheduler() {
        return this.post('/api/scheduler/trigger');
    }

    // =========================================================================
    // CALENDAR ENDPOINTS
    // =========================================================================

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

    // =========================================================================
    // WORKFLOW ENDPOINTS
    // =========================================================================

    async startWorkflow(data) {
        return this.post('/api/workflow/start', data, 300000);
    }

    async startWorkflowById(entryId) {
        return this.post(`/api/workflow/start-by-id/${entryId}`, {}, 300000);
    }

    async runDailyWorkflow() {
        return this.post('/api/workflow/run-daily', {}, 300000);
    }

    async runWorkflowByDate(date) {
        return this.post(`/api/workflow/run-by-date/${date}`, {}, 300000);
    }

    // =========================================================================
    // DATABASE MANAGEMENT ENDPOINTS
    // =========================================================================

    async cleanDatabase(tables = 'all') {
        return this.post('/api/database/clean', { tables });
    }

    async getWorkflowStatus(sessionId) {
        return this.get(`/api/workflow/status/${sessionId}`);
    }

    // =========================================================================
    // TRACKING ENDPOINTS
    // =========================================================================

    async getTracking() {
        return this.get('/api/tracking');
    }

    async getTrackingPost(postId) {
        return this.get(`/api/tracking/${postId}`);
    }

    // =========================================================================
    // METRICS ENDPOINTS
    // =========================================================================

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

    // =========================================================================
    // ANALYTICS INSIGHTS ENDPOINTS
    // =========================================================================

    async getAnalyticsSummary() {
        return this.get('/api/analytics/summary');
    }

    async getAnalyticsEngagement() {
        return this.get('/api/analytics/engagement');
    }

    async getAnalyticsFormats() {
        return this.get('/api/analytics/formats');
    }

    async getAnalyticsTopPosts(limit = 10) {
        return this.get(`/api/analytics/top-posts?limit=${limit}`);
    }

    async getAnalyticsPostingInsights() {
        return this.get('/api/analytics/posting-insights');
    }

    async getAnalyticsAudience() {
        return this.get('/api/analytics/audience');
    }

    async getAnalyticsRecommendations() {
        return this.get('/api/analytics/recommendations');
    }

    async getAnalyticsFullReport() {
        return this.get('/api/analytics/report');
    }

    // =========================================================================
    // APPROVAL ENDPOINTS
    // =========================================================================

    async getPendingApprovals() {
        return this.get('/api/approval/pending');
    }

    async submitApprovalAction(actionData) {
        return this.post('/api/approval/action', actionData);
    }

    async getApprovalConfig() {
        return this.get('/api/approval/config');
    }

    // =========================================================================
    // AGENT TASKS ENDPOINTS
    // =========================================================================

    async getAgentTasks() {
        return this.get('/api/agent/tasks');
    }

    async runAgent(data) {
        return this.post('/api/agent/run', data);
    }

    // =========================================================================
    // ERROR LOGS ENDPOINTS
    // =========================================================================

    async getErrors() {
        return this.get('/api/errors');
    }

    async getErrorLogs() {
        return this.get('/api/logs/errors');
    }
}

// Create global API instance
const api = new ApiService();
