/**
 * UI Utilities Module
 * Common UI functions and helpers
 */

class UIUtils {
    // Show/hide loading state
    static showLoading(show) {
        const loading = document.querySelector('.loading');
        if (loading) {
            if (show) {
                loading.classList.add('show');
            } else {
                loading.classList.remove('show');
            }
        }
    }

    // Show/hide empty state
    static showEmptyState(show, message = null) {
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('instancesTable');
        
        if (emptyState && table) {
            if (show) {
                emptyState.style.display = 'block';
                table.style.display = 'none';
                
                if (message) {
                    const messageElement = emptyState.querySelector('p');
                    if (messageElement) {
                        messageElement.textContent = message;
                    }
                }
            } else {
                emptyState.style.display = 'none';
                table.style.display = 'table';
            }
        }
    }

    // Show alert message
    static showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${UIUtils.escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        if (alertContainer) {
            alertContainer.appendChild(alertDiv);
        } else {
            document.body.appendChild(alertDiv);
            alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Get error message from axios error
    static getErrorMessage(error) {
        if (error.response && error.response.data) {
            if (error.response.data.detail) {
                return error.response.data.detail;
            }
            if (error.response.data.message) {
                return error.response.data.message;
            }
        }
        return error.message || 'Unknown error occurred';
    }

    // Escape HTML to prevent XSS
    static escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Debounce function
    static debounce(func, wait) {
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

    // Format date time
    static formatDateTime(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } catch (error) {
            return '-';
        }
    }

    // Get status badge CSS class
    static getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'active': return 'bg-success';
            case 'inactive': return 'bg-secondary';
            case 'pending': return 'bg-warning text-dark';
            case 'error': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    // Get status display text
    static getStatusText(status) {
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    // Get operation badge class
    static getOperationBadgeClass(operation) {
        switch (operation.toLowerCase()) {
            case 'create': return 'bg-success';
            case 'update': return 'bg-primary';
            case 'delete': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    // Get operation text
    static getOperationText(operation) {
        return operation.charAt(0).toUpperCase() + operation.slice(1).toLowerCase();
    }
}

// Make UIUtils globally available
window.UIUtils = UIUtils;