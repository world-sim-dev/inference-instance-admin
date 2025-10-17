/**
 * API Client Module
 * Handles all API communication with the backend
 */

class ApiClient {
    constructor() {
        // Configure axios defaults
        axios.defaults.withCredentials = true;
    }

    // Instance API methods
    async getInstances() {
        const response = await axios.get('http://localhost:8000/api/instances');
        return response.data;
    }

    async getInstance(instanceId) {
        const response = await axios.get(`http://localhost:8000/api/instances/${instanceId}`);
        return response.data;
    }

    async createInstance(data) {
        const response = await axios.post('http://localhost:8000/api/instances', data);
        return response.data;
    }

    async updateInstance(instanceId, data) {
        const response = await axios.put(`http://localhost:8000/api/instances/${instanceId}`, data);
        return response.data;
    }

    async deleteInstance(instanceId) {
        await axios.delete(`http://localhost:8000/api/instances/${instanceId}`);
    }

    // History API methods
    async getInstanceHistory(instanceId) {
        const response = await axios.get(`http://localhost:8000/api/instances/${instanceId}/history`);
        return response.data.history_records || response.data;
    }

    async getHistoryRecord(historyId) {
        const response = await axios.get(`http://localhost:8000/api/history/${historyId}`);
        return response.data;
    }
}

// Create global API client instance
window.apiClient = new ApiClient();