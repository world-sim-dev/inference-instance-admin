/**
 * Dashboard JavaScript - Simplified Version
 * Core functionality for instance management using modular components
 */

class Dashboard {
    constructor() {
        this.currentInstances = [];
        this.formHandler = null;
        this.historyHandler = null;
        this.initialize();
    }

    // Initialize dashboard when DOM is loaded
    initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeDashboard();
        });
    }

    // Initialize dashboard functionality
    initializeDashboard() {
        this.formHandler = new FormHandler();
        this.historyHandler = new HistoryHandler();
        this.setupEventListeners();
        this.loadInstances();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', UIUtils.debounce(this.handleSearch.bind(this), 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch.bind(this));
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.loadInstances.bind(this));
        }
        
        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', this.handleConfirmDelete.bind(this));
        }
        
        // Table event delegation
        this.setupTableEventDelegation();
        
        // Listen for instance changes
        window.addEventListener('instancesChanged', this.loadInstances.bind(this));
    }

    // Setup table event delegation for dynamic content
    setupTableEventDelegation() {
        const tableBody = document.getElementById('instancesTableBody');
        if (tableBody) {
            tableBody.addEventListener('click', this.handleTableAction.bind(this));
        }
    }

    // Handle table button clicks
    handleTableAction(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        const instanceId = button.dataset.instanceId;
        const instanceName = button.dataset.instanceName;
        
        switch (action) {
            case 'edit':
                this.editInstance(instanceId);
                break;
            case 'delete':
                this.showDeleteConfirmation(instanceId, instanceName);
                break;
            case 'history':
                this.historyHandler.viewHistory(instanceId, instanceName);
                break;
        }
    }

    // Load instances from API
    async loadInstances() {
        UIUtils.showLoading(true);
        
        try {
            this.currentInstances = await window.apiClient.getInstances();
            this.renderInstancesTable(this.currentInstances);
            UIUtils.showEmptyState(this.currentInstances.length === 0);
            
        } catch (error) {
            console.error('Failed to load instances:', error);
            UIUtils.showAlert('Failed to load instances: ' + UIUtils.getErrorMessage(error), 'danger');
            UIUtils.showEmptyState(true);
        } finally {
            UIUtils.showLoading(false);
        }
    }

    // Handle search functionality
    handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderInstancesTable(this.currentInstances);
            return;
        }
        
        const filteredInstances = this.currentInstances.filter(instance => {
            return instance.name.toLowerCase().includes(searchTerm) ||
                   instance.model_name.toLowerCase().includes(searchTerm) ||
                   instance.cluster_name.toLowerCase().includes(searchTerm) ||
                   instance.status.toLowerCase().includes(searchTerm);
        });
        
        this.renderInstancesTable(filteredInstances);
        UIUtils.showEmptyState(filteredInstances.length === 0 && this.currentInstances.length > 0, 'No instances match your search.');
    }

    // Render instances table
    renderInstancesTable(instances) {
        const tableBody = document.getElementById('instancesTableBody');
        
        if (!tableBody) return;
        
        if (instances.length === 0) {
            tableBody.innerHTML = '';
            return;
        }
        
        tableBody.innerHTML = instances.map(instance => this.renderInstanceRow(instance)).join('');
    }

    // Render single instance row
    renderInstanceRow(instance) {
        return `
            <tr>
                <td><strong>${UIUtils.escapeHtml(instance.name)}</strong></td>
                <td>${UIUtils.escapeHtml(instance.model_name)}</td>
                <td>${UIUtils.escapeHtml(instance.cluster_name)}</td>
                <td>
                    <span class="badge status-badge ${UIUtils.getStatusBadgeClass(instance.status)}">
                        ${UIUtils.getStatusText(instance.status)}
                    </span>
                </td>
                <td>${instance.replicas}</td>
                <td>${UIUtils.formatDateTime(instance.created_at)}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary btn-action" 
                                data-action="edit" 
                                data-instance-id="${instance.id}"
                                title="Edit Instance">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-action" 
                                data-action="history" 
                                data-instance-id="${instance.id}"
                                data-instance-name="${UIUtils.escapeHtml(instance.name)}"
                                title="View History">
                            <i class="fas fa-history"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-action" 
                                data-action="delete" 
                                data-instance-id="${instance.id}"
                                data-instance-name="${UIUtils.escapeHtml(instance.name)}"
                                title="Delete Instance">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Edit instance
    async editInstance(instanceId) {
        console.log('🔄 Starting edit instance process for ID:', instanceId);
        
        try {
            // Show loading state
            UIUtils.showLoading(true);
            
            // Get instance data from API
            console.log('📡 Fetching instance data...');
            const instance = await window.apiClient.getInstance(instanceId);
            console.log('✅ Instance data received:', instance);
            
            // Set editing mode
            console.log('⚙️ Setting editing mode...');
            this.formHandler.setEditingInstance(instanceId);
            
            // Show modal first
            console.log('📱 Showing modal...');
            const modal = new bootstrap.Modal(document.getElementById('createModal'));
            modal.show();
            
            // Wait for modal to be fully shown, then populate form
            const modalElement = document.getElementById('createModal');
            
            // Remove any existing event listeners to avoid conflicts
            modalElement.removeEventListener('shown.bs.modal', this.handleModalShown);
            
            // Create a bound function for the event handler
            this.handleModalShown = () => {
                console.log('📝 Modal shown, populating form...');
                
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    console.log('🔄 Attempting to populate form with data:', instance);
                    const result = this.formHandler.populateForm(instance);
                    console.log('✅ Form population result:', result);
                    
                    // Verify population worked
                    const form = document.getElementById('instanceForm');
                    if (form) {
                        const nameField = form.querySelector('[name="name"]');
                        const modelField = form.querySelector('[name="model_name"]');
                        console.log('🔍 Verification - name field:', nameField ? nameField.value : 'not found');
                        console.log('🔍 Verification - model_name field:', modelField ? modelField.value : 'not found');
                    }
                    
                    // Hide loading state
                    UIUtils.showLoading(false);
                }, 200);
            };
            
            modalElement.addEventListener('shown.bs.modal', this.handleModalShown, { once: true });
            
            // Backup: Also try to populate after a longer delay in case the event doesn't fire
            setTimeout(() => {
                console.log('🔄 Backup: Attempting form population...');
                const form = document.getElementById('instanceForm');
                if (form && form.querySelector('[name="name"]').value === '') {
                    console.log('📝 Form appears empty, trying to populate...');
                    const result = this.formHandler.populateForm(instance);
                    console.log('✅ Backup population result:', result);
                }
                UIUtils.showLoading(false);
            }, 1500);
            
        } catch (error) {
            console.error('❌ Failed to load instance:', error);
            UIUtils.showAlert('Failed to load instance: ' + UIUtils.getErrorMessage(error), 'danger');
            UIUtils.showLoading(false);
        }
    }



    // Show delete confirmation
    showDeleteConfirmation(instanceId, instanceName) {
        document.getElementById('deleteInstanceName').textContent = instanceName;
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
        
        // Store instance ID for deletion
        document.getElementById('confirmDeleteBtn').dataset.instanceId = instanceId;
    }

    // Handle confirm delete
    async handleConfirmDelete() {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const instanceId = confirmBtn.dataset.instanceId;
        const spinner = confirmBtn.querySelector('.spinner-border');
        
        if (!instanceId) return;
        
        // Show loading state
        confirmBtn.disabled = true;
        spinner.classList.remove('d-none');
        
        try {
            await window.apiClient.deleteInstance(instanceId);
            
            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            
            await this.loadInstances();
            UIUtils.showAlert('Instance deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to delete instance:', error);
            UIUtils.showAlert('Failed to delete instance: ' + UIUtils.getErrorMessage(error), 'danger');
            
        } finally {
            // Reset loading state
            confirmBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    }


}

// Initialize dashboard
new Dashboard();