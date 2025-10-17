/**
 * History Handler Module
 * Handles history viewing and modal functionality
 */

class HistoryHandler {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // History modal events can be added here if needed
    }

    // View history
    async viewHistory(instanceId, instanceName) {
        const historyModal = document.getElementById('historyModal');
        const historyLoading = document.getElementById('historyLoading');
        const historyTable = document.getElementById('historyTable');
        const historyTableBody = document.getElementById('historyTableBody');
        
        // Show modal and loading state
        const modal = new bootstrap.Modal(historyModal);
        modal.show();
        
        historyLoading.style.display = 'block';
        historyTable.style.display = 'none';
        
        try {
            const history = await window.apiClient.getInstanceHistory(instanceId);
            
            // Render history table
            if (history.length === 0) {
                historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="text-center text-muted py-4">
                            No history records found
                        </td>
                    </tr>
                `;
            } else {
                historyTableBody.innerHTML = history.map(record => `
                    <tr>
                        <td>
                            <span class="badge ${UIUtils.getOperationBadgeClass(record.operation_type)}">
                                ${UIUtils.getOperationText(record.operation_type)}
                            </span>
                        </td>
                        <td>${UIUtils.formatDateTime(record.operation_timestamp)}</td>
                        <td>
                            <small class="text-muted">
                                ${this.getHistoryChanges(record)}
                            </small>
                        </td>
                    </tr>
                `).join('');
            }
            
            historyLoading.style.display = 'none';
            historyTable.style.display = 'table';
            
        } catch (error) {
            console.error('Failed to load history:', error);
            UIUtils.showAlert('Failed to load history: ' + UIUtils.getErrorMessage(error), 'danger');
            modal.hide();
        }
    }

    // Get history changes summary
    getHistoryChanges(record) {
        const changes = [];
        if (record.model_name) changes.push(`Model: ${record.model_name}`);
        if (record.cluster_name) changes.push(`Cluster: ${record.cluster_name}`);
        if (record.replicas) changes.push(`Replicas: ${record.replicas}`);
        if (record.status) changes.push(`Status: ${record.status}`);
        
        return changes.length > 0 ? changes.join(', ') : 'No details available';
    }
}

// Make HistoryHandler globally available
window.HistoryHandler = HistoryHandler;