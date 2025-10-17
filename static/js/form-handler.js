/**
 * Form Handler Module
 * Handles form validation, submission, and data collection
 */

class FormHandler {
    constructor() {
        this.editingInstanceId = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        const saveBtn = document.getElementById('saveInstanceBtn');
        const instanceForm = document.getElementById('instanceForm');

        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleSaveInstance.bind(this));
        }

        if (instanceForm) {
            instanceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveInstance();
            });
        }

        // Modal events
        const createModal = document.getElementById('createModal');
        if (createModal) {
            createModal.addEventListener('hidden.bs.modal', this.resetForm.bind(this));
        }
    }

    // Populate form with instance data - Complete field coverage
    populateForm(instance) {
        const form = document.getElementById('instanceForm');
        if (!form) {
            console.error('❌ Form not found: instanceForm');
            return { total: 0, success: 0, errors: 1, successRate: 0 };
        }

        console.log('🔄 Starting form population with instance data');
        console.log('📊 Instance data:', instance);
        console.log('🔑 Instance keys:', Object.keys(instance));

        // Get all form fields
        const allFields = form.querySelectorAll('input, select, textarea');
        console.log(`📋 Found ${allFields.length} form fields`);

        let successCount = 0;
        let errorCount = 0;
        const results = [];

        // Process each form field
        allFields.forEach(field => {
            const fieldName = field.name;
            if (!fieldName) return;

            try {
                let instanceValue = instance[fieldName];

                // Handle special field mappings
                if (fieldName === 'desc' && (instanceValue === undefined || instanceValue === '')) {
                    instanceValue = instance.description || '';
                }
                
                console.log(`🔍 Processing field: ${fieldName}, value: ${instanceValue}, type: ${field.type || field.tagName.toLowerCase()}`);

                // Determine field type and populate accordingly
                if (field.type === 'checkbox') {
                    // Checkbox fields
                    const checked = Boolean(instanceValue);
                    field.checked = checked;
                    results.push(`✓ ${fieldName} (checkbox): ${checked}`);
                    successCount++;

                } else if (fieldName === 'envs' || fieldName === 'priorities') {
                    // JSON array fields
                    if (Array.isArray(instanceValue)) {
                        const jsonStr = JSON.stringify(instanceValue, null, 2);
                        field.value = jsonStr;
                        results.push(`✓ ${fieldName} (JSON): ${jsonStr.length > 50 ? jsonStr.substring(0, 50) + '...' : jsonStr}`);
                    } else {
                        field.value = '';
                        results.push(`✓ ${fieldName} (JSON): empty array`);
                    }
                    successCount++;

                } else if (fieldName.includes('_at')) {
                    // Datetime fields
                    if (instanceValue) {
                        try {
                            const date = new Date(instanceValue);
                            const formatted = date.toLocaleString();
                            field.value = formatted;
                            results.push(`✓ ${fieldName} (datetime): ${formatted}`);
                        } catch (e) {
                            field.value = String(instanceValue);
                            results.push(`✓ ${fieldName} (datetime-raw): ${instanceValue}`);
                        }
                    } else {
                        field.value = '';
                        results.push(`✓ ${fieldName} (datetime): empty`);
                    }
                    successCount++;

                } else if (field.tagName.toLowerCase() === 'select') {
                    // Select dropdown fields
                    if (instanceValue !== null && instanceValue !== undefined && instanceValue !== '') {
                        // Try to set the value
                        field.value = instanceValue;

                        // Check if the option exists
                        if (field.value === instanceValue) {
                            results.push(`✓ ${fieldName} (select): ${instanceValue}`);
                        } else {
                            // Option doesn't exist, add it dynamically
                            const option = document.createElement('option');
                            option.value = instanceValue;
                            option.textContent = instanceValue;
                            field.appendChild(option);
                            field.value = instanceValue;
                            results.push(`✓ ${fieldName} (select+): ${instanceValue} (added option)`);
                        }
                    } else {
                        // Set to first option or empty
                        if (field.options.length > 0) {
                            field.selectedIndex = 0;
                            results.push(`✓ ${fieldName} (select): default (${field.value})`);
                        } else {
                            field.value = '';
                            results.push(`✓ ${fieldName} (select): empty`);
                        }
                    }
                    successCount++;

                } else {
                    // Regular input fields (text, number, etc.)
                    if (instanceValue !== null && instanceValue !== undefined) {
                        field.value = String(instanceValue);
                        results.push(`✓ ${fieldName}: "${instanceValue}"`);
                    } else {
                        field.value = '';
                        results.push(`✓ ${fieldName}: empty`);
                    }
                    successCount++;
                }

            } catch (error) {
                console.error(`❌ Error populating field ${fieldName}:`, error);
                results.push(`❌ ${fieldName}: ERROR - ${error.message}`);
                errorCount++;
            }
        });

        // Summary
        console.log('📊 FORM POPULATION SUMMARY');
        console.log(`   Total fields: ${allFields.length}`);
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log(`   📈 Success rate: ${((successCount / allFields.length) * 100).toFixed(1)}%`);

        // Detailed results (only show first 10 to avoid spam)
        console.log('📝 Field Details (first 10):');
        results.slice(0, 10).forEach(result => console.log(`   ${result}`));
        if (results.length > 10) {
            console.log(`   ... and ${results.length - 10} more fields`);
        }

        // Check for unmapped instance fields
        const formFieldNames = Array.from(allFields).map(f => f.name).filter(Boolean);
        const unmappedFields = Object.keys(instance).filter(key =>
            !formFieldNames.includes(key) &&
            key !== 'description' && // maps to 'desc'
            key !== 'priority' // not in form
        );

        if (unmappedFields.length > 0) {
            console.log('⚠️  Instance fields not in form:');
            unmappedFields.forEach(field => console.log(`   ${field}: ${instance[field]}`));
        }

        console.log('✅ Form population completed');

        // Return summary for external use
        return {
            total: allFields.length,
            success: successCount,
            errors: errorCount,
            successRate: (successCount / allFields.length) * 100
        };
    }

    // Handle save instance
    async handleSaveInstance() {
        const form = document.getElementById('instanceForm');
        if (!form) return;

        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        const saveBtn = document.getElementById('saveInstanceBtn');
        const spinner = saveBtn.querySelector('.spinner-border');

        // Show loading state
        saveBtn.disabled = true;
        spinner.classList.remove('d-none');

        try {
            const formData = this.collectFormData(form);

            if (this.editingInstanceId) {
                await window.apiClient.updateInstance(this.editingInstanceId, formData);
            } else {
                await window.apiClient.createInstance(formData);
            }

            // Close modal and refresh
            const modal = bootstrap.Modal.getInstance(document.getElementById('createModal'));
            modal.hide();

            // Trigger refresh event
            window.dispatchEvent(new CustomEvent('instancesChanged'));

            const action = this.editingInstanceId ? 'updated' : 'created';
            UIUtils.showAlert(`Instance ${action} successfully!`, 'success');

        } catch (error) {
            console.error('Failed to save instance:', error);
            UIUtils.showAlert('Failed to save instance: ' + UIUtils.getErrorMessage(error), 'danger');

            // Show validation errors if available
            if (error.response && error.response.data && error.response.data.detail) {
                this.showValidationErrors(error.response.data.detail);
            }

        } finally {
            // Reset loading state
            saveBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    }

    // Collect form data
    collectFormData(form) {
        const data = {};

        // Collect text and string inputs - comprehensive text fields
        const textFields = [
            'name', 'model_name', 'model_version', 'desc', 'cluster_name', 'image_tag',
            'checkpoint_path', 'nonce', 'pipeline_mode', 'ephemeral_to', 'ephemeral_from',
            'vae_store_type', 't5_store_type', 'status'
        ];

        textFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const value = field.value.trim();
                if (value) {
                    data[fieldName] = value;
                }
            }
        });

        // Collect number inputs - comprehensive numeric fields
        const numberFields = [
            'pp', 'cp', 'tp', 'replicas', 'n_workers', 'task_concurrency',
            'celery_task_concurrency', 'fps', 'ephemeral_min_period_seconds'
        ];

        numberFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && field.value) {
                const value = parseInt(field.value);
                if (!isNaN(value)) {
                    data[fieldName] = value;
                }
            }
        });

        // Collect checkbox inputs - comprehensive boolean fields
        const checkboxFields = [
            'quant_mode', 'distill_mode', 'm405_mode', 'ephemeral',
            'separate_video_encode', 'separate_video_decode', 'separate_t5_encode',
            'enable_cuda_graph'
        ];

        checkboxFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                data[fieldName] = field.checked;
            }
        });

        // Collect JSON fields
        const jsonFields = ['envs', 'priorities'];
        jsonFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field && field.value.trim()) {
                try {
                    data[fieldName] = JSON.parse(field.value);
                } catch (e) {
                    console.warn(`Invalid JSON in ${fieldName} field:`, e);
                    // Keep as string if JSON parsing fails
                    data[fieldName] = field.value.trim();
                }
            }
        });

        // Map description field for backward compatibility
        if (data.desc) {
            data.description = data.desc;
        }

        console.log('Collected comprehensive form data:', data);
        return data;
    }

    // Validate form
    validateForm(form) {
        let isValid = true;

        // Clear previous validation states
        form.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });

        // Required fields validation - using form field names
        const requiredFields = [
            { name: 'name', label: 'Instance Name' },
            { name: 'model_name', label: 'Model Name' },
            { name: 'cluster_name', label: 'Cluster Name' },
            { name: 'image_tag', label: 'Image Tag' }
        ];

        requiredFields.forEach(field => {
            const input = form.querySelector(`[name="${field.name}"]`);
            if (input && !input.value.trim()) {
                this.showFieldError(input, `${field.label} is required`);
                isValid = false;
            }
        });

        // Numeric fields validation - comprehensive numeric validation
        const numericFields = [
            { name: 'replicas', min: 1, max: 100 },
            { name: 'pp', min: 1, max: 16 },
            { name: 'cp', min: 1, max: 64 },
            { name: 'tp', min: 1, max: 16 },
            { name: 'n_workers', min: 1, max: 32 },
            { name: 'task_concurrency', min: 1, max: 100 },
            { name: 'celery_task_concurrency', min: 1, max: 100, required: false },
            { name: 'fps', min: 1, max: 120, required: false },
            { name: 'ephemeral_min_period_seconds', min: 60, max: 86400, required: false }
        ];

        numericFields.forEach(field => {
            const input = form.querySelector(`[name="${field.name}"]`);
            if (input && input.value) {
                const value = parseInt(input.value);
                if (isNaN(value)) {
                    this.showFieldError(input, 'Must be a valid number');
                    isValid = false;
                } else if (value < field.min || value > field.max) {
                    this.showFieldError(input, `Must be between ${field.min} and ${field.max}`);
                    isValid = false;
                }
            }
        });

        // JSON fields validation
        const jsonFields = ['envs', 'priorities'];
        jsonFields.forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input && input.value.trim()) {
                try {
                    JSON.parse(input.value);
                } catch (e) {
                    this.showFieldError(input, 'Must be valid JSON format');
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    // Show field validation error
    showFieldError(field, message) {
        field.classList.add('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    }

    // Show validation errors from server
    showValidationErrors(errors) {
        if (Array.isArray(errors)) {
            errors.forEach(error => {
                if (error.loc && error.loc.length > 0) {
                    const fieldName = error.loc[error.loc.length - 1];
                    const field = document.querySelector(`[name="${fieldName}"]`);
                    if (field) {
                        this.showFieldError(field, error.msg);
                    }
                }
            });
        }
    }

    // Reset form
    resetForm() {
        const form = document.getElementById('instanceForm');
        if (form) {
            form.reset();
            form.querySelectorAll('.is-invalid').forEach(field => {
                field.classList.remove('is-invalid');
            });
        }

        this.editingInstanceId = null;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = '新建实例';
        }
    }

    // Set editing mode
    setEditingInstance(instanceId) {
        this.editingInstanceId = instanceId;
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = '编辑实例';
        }
    }
}

// Make FormHandler globally available
window.FormHandler = FormHandler;