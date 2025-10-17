/**
 * End-to-End User Flow Tests
 * Tests complete user workflows from start to finish
 */

import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// Test configuration
const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Mock data
const mockInstance = {
  name: 'e2e-test-instance',
  model_name: 'test-model',
  model_version: '1.0.0',
  cluster_name: 'test-cluster',
  image_tag: 'latest',
  status: 'active',
  description: 'E2E test instance',
  pp: 1,
  cp: 1,
  tp: 1,
  n_workers: 4,
  replicas: 1,
  priorities: ['normal'],
  envs: [],
};

// Helper functions
const waitForTableLoad = async (page: Page) => {
  await page.waitForSelector('[data-testid="instance-table"]', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
};

const fillInstanceForm = async (page: Page, instance: typeof mockInstance) => {
  // Basic information
  await page.fill('[data-testid="instance-name-input"]', instance.name);
  await page.selectOption('[data-testid="status-select"]', instance.status);
  await page.fill('[data-testid="model-name-input"]', instance.model_name);
  await page.fill('[data-testid="model-version-input"]', instance.model_version);
  await page.fill('[data-testid="cluster-name-input"]', instance.cluster_name);
  await page.fill('[data-testid="image-tag-input"]', instance.image_tag);
  await page.fill('[data-testid="description-input"]', instance.description);

  // Resource configuration
  await page.fill('[data-testid="pp-input"]', instance.pp.toString());
  await page.fill('[data-testid="cp-input"]', instance.cp.toString());
  await page.fill('[data-testid="tp-input"]', instance.tp.toString());
  await page.fill('[data-testid="n-workers-input"]', instance.n_workers.toString());
  await page.fill('[data-testid="replicas-input"]', instance.replicas.toString());

  // Priorities (JSON field)
  await page.fill('[data-testid="priorities-input"]', JSON.stringify(instance.priorities));
  await page.fill('[data-testid="envs-input"]', JSON.stringify(instance.envs));
};

test.describe('Complete User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto(BASE_URL);
    await waitForTableLoad(page);
  });

  test('Complete CRUD workflow', async ({ page }) => {
    // Step 1: Create instance
    await test.step('Create new instance', async () => {
      // Click create button
      await page.click('[data-testid="create-instance-button"]');
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      // Fill form
      await fillInstanceForm(page, mockInstance);
      
      // Mock create API response
      await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 1, ...mockInstance }),
          });
        }
      });
      
      // Submit form
      await page.click('[data-testid="submit-button"]');
      
      // Wait for modal to close and success message
      await page.waitForSelector('[data-testid="create-instance-modal"]', { state: 'hidden' });
      await expect(page.locator('.ant-message-success')).toBeVisible();
    });

    // Step 2: View instance in table
    await test.step('Verify instance appears in table', async () => {
      // Mock updated instances list
      await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 1, ...mockInstance }]),
          });
        }
      });
      
      // Refresh table
      await page.click('[data-testid="refresh-button"]');
      await waitForTableLoad(page);
      
      // Verify instance appears
      await expect(page.locator(`[data-testid="instance-row-1"]`)).toBeVisible();
      await expect(page.locator('text=' + mockInstance.name)).toBeVisible();
    });

    // Step 3: Edit instance
    await test.step('Edit instance', async () => {
      // Click edit button
      await page.click('[data-testid="edit-instance-1"]');
      
      // Wait for modal
      await page.waitForSelector('[data-testid="edit-instance-modal"]');
      
      // Modify name
      const updatedName = 'e2e-test-instance-updated';
      await page.fill('[data-testid="instance-name-input"]', updatedName);
      
      // Mock update API response
      await page.route(`${API_BASE_URL}/api/instances/1`, async (route) => {
        if (route.request().method() === 'PUT') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 1, ...mockInstance, name: updatedName }),
          });
        }
      });
      
      // Submit form
      await page.click('[data-testid="submit-button"]');
      
      // Wait for modal to close
      await page.waitForSelector('[data-testid="edit-instance-modal"]', { state: 'hidden' });
      await expect(page.locator('.ant-message-success')).toBeVisible();
    });

    // Step 4: View history
    await test.step('View instance history', async () => {
      // Mock history API response
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: [
              {
                history_id: 1,
                original_id: 1,
                operation_type: 'create',
                operation_timestamp: '2024-01-01T00:00:00Z',
                ...mockInstance,
              },
              {
                history_id: 2,
                original_id: 1,
                operation_type: 'update',
                operation_timestamp: '2024-01-01T01:00:00Z',
                ...mockInstance,
                name: 'e2e-test-instance-updated',
              },
            ],
            total_count: 2,
            limit: 20,
            offset: 0,
            has_more: false,
          }),
        });
      });
      
      // Click history button
      await page.click('[data-testid="history-instance-1"]');
      
      // Wait for history modal
      await page.waitForSelector('[data-testid="history-modal"]');
      
      // Verify history records
      await expect(page.locator('[data-testid="history-record-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="history-record-2"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-history-modal"]');
    });

    // Step 5: Delete instance
    await test.step('Delete instance', async () => {
      // Click delete button
      await page.click('[data-testid="delete-instance-1"]');
      
      // Wait for confirmation modal
      await page.waitForSelector('[data-testid="delete-confirm-modal"]');
      
      // Verify instance name in confirmation
      await expect(page.locator('text=' + mockInstance.name)).toBeVisible();
      
      // Mock delete API response
      await page.route(`${API_BASE_URL}/api/instances/1`, async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204 });
        }
      });
      
      // Confirm deletion
      await page.click('[data-testid="confirm-delete-button"]');
      
      // Wait for modal to close
      await page.waitForSelector('[data-testid="delete-confirm-modal"]', { state: 'hidden' });
      await expect(page.locator('.ant-message-success')).toBeVisible();
    });
  });

  test('Search and filter workflow', async ({ page }) => {
    // Setup test data
    const instances = [
      { id: 1, ...mockInstance, name: 'prod-instance-1', cluster_name: 'prod-cluster', status: 'active' },
      { id: 2, ...mockInstance, name: 'test-instance-2', cluster_name: 'test-cluster', status: 'inactive' },
      { id: 3, ...mockInstance, name: 'dev-instance-3', cluster_name: 'dev-cluster', status: 'active' },
    ];

    await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(instances),
      });
    });

    await page.reload();
    await waitForTableLoad(page);

    await test.step('Search by name', async () => {
      // Enter search term
      await page.fill('[data-testid="search-input"]', 'prod');
      
      // Wait for search results
      await page.waitForTimeout(500); // Debounce delay
      
      // Verify filtered results
      await expect(page.locator('[data-testid="instance-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-2"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="instance-row-3"]')).not.toBeVisible();
    });

    await test.step('Filter by status', async () => {
      // Clear search
      await page.fill('[data-testid="search-input"]', '');
      await page.waitForTimeout(500);
      
      // Open status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-filter-active"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="instance-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-2"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="instance-row-3"]')).toBeVisible();
    });

    await test.step('Filter by cluster', async () => {
      // Clear status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-filter-active"]'); // Uncheck
      
      // Open cluster filter
      await page.click('[data-testid="cluster-filter"]');
      await page.click('[data-testid="cluster-filter-test-cluster"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="instance-row-1"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="instance-row-2"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-3"]')).not.toBeVisible();
    });

    await test.step('Combined filters', async () => {
      // Add status filter
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-filter-active"]');
      
      // Should show no results (test-cluster + active)
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
      
      // Change to inactive
      await page.click('[data-testid="status-filter-active"]'); // Uncheck
      await page.click('[data-testid="status-filter-inactive"]');
      
      // Should show instance 2
      await expect(page.locator('[data-testid="instance-row-2"]')).toBeVisible();
    });
  });

  test('Form validation workflow', async ({ page }) => {
    await test.step('Test required field validation', async () => {
      // Open create modal
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-button"]');
      
      // Verify validation errors
      await expect(page.locator('text=请输入实例名称')).toBeVisible();
      await expect(page.locator('text=请选择状态')).toBeVisible();
      await expect(page.locator('text=请输入模型名称')).toBeVisible();
      await expect(page.locator('text=请输入模型版本')).toBeVisible();
    });

    await test.step('Test field format validation', async () => {
      // Fill invalid instance name
      await page.fill('[data-testid="instance-name-input"]', 'invalid name with spaces');
      await page.click('[data-testid="submit-button"]');
      
      // Verify format validation
      await expect(page.locator('text=实例名称只能包含字母、数字、下划线和连字符')).toBeVisible();
    });

    await test.step('Test numeric field validation', async () => {
      // Fill invalid PP value
      await page.fill('[data-testid="pp-input"]', '100');
      await page.click('[data-testid="submit-button"]');
      
      // Verify range validation
      await expect(page.locator('text=PP值应在1-64之间')).toBeVisible();
    });

    await test.step('Test resource allocation warning', async () => {
      // Set high resource values
      await page.fill('[data-testid="pp-input"]', '4');
      await page.fill('[data-testid="cp-input"]', '2');
      await page.fill('[data-testid="tp-input"]', '2');
      
      // Verify warning message
      await expect(page.locator('text=当前配置需要 16 个GPU')).toBeVisible();
    });
  });

  test('Error handling workflow', async ({ page }) => {
    await test.step('Handle API errors gracefully', async () => {
      // Mock API error
      await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Internal server error' }),
          });
        }
      });
      
      // Try to create instance
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      await fillInstanceForm(page, mockInstance);
      await page.click('[data-testid="submit-button"]');
      
      // Verify error message
      await expect(page.locator('.ant-message-error')).toBeVisible();
      await expect(page.locator('text=创建实例失败')).toBeVisible();
    });

    await test.step('Handle network errors', async () => {
      // Mock network failure
      await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
        await route.abort('failed');
      });
      
      // Try to refresh data
      await page.click('[data-testid="refresh-button"]');
      
      // Verify error state
      await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
      await expect(page.locator('text=加载数据失败')).toBeVisible();
    });
  });
});

  test('Batch operations workflow', async ({ page }) => {
    // Setup test data with multiple instances
    const instances = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      ...mockInstance,
      name: `batch-instance-${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'inactive',
    }));

    await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(instances),
        });
      }
    });

    await page.reload();
    await waitForTableLoad(page);

    await test.step('Select multiple instances', async () => {
      // Select first three instances
      await page.check('[data-testid="select-instance-1"]');
      await page.check('[data-testid="select-instance-2"]');
      await page.check('[data-testid="select-instance-3"]');

      // Verify selection count
      await expect(page.locator('[data-testid="selected-count"]')).toContainText('3');
    });

    await test.step('Batch status update', async () => {
      // Mock batch update API
      await page.route(`${API_BASE_URL}/api/instances/batch`, async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ updated: 3 }),
          });
        }
      });

      // Open batch actions menu
      await page.click('[data-testid="batch-actions-button"]');
      await page.click('[data-testid="batch-update-status"]');

      // Select new status
      await page.selectOption('[data-testid="batch-status-select"]', 'inactive');
      await page.click('[data-testid="confirm-batch-update"]');

      // Verify success message
      await expect(page.locator('.ant-message-success')).toBeVisible();
    });

    await test.step('Batch delete with confirmation', async () => {
      // Mock batch delete API
      await page.route(`${API_BASE_URL}/api/instances/batch`, async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204 });
        }
      });

      // Open batch actions menu
      await page.click('[data-testid="batch-actions-button"]');
      await page.click('[data-testid="batch-delete"]');

      // Confirm deletion
      await page.waitForSelector('[data-testid="batch-delete-modal"]');
      await expect(page.locator('text=确认删除 3 个实例')).toBeVisible();
      await page.click('[data-testid="confirm-batch-delete"]');

      // Verify success message
      await expect(page.locator('.ant-message-success')).toBeVisible();
    });
  });

  test('Advanced filtering and sorting workflow', async ({ page }) => {
    // Setup diverse test data
    const instances = [
      { id: 1, ...mockInstance, name: 'prod-web-1', cluster_name: 'prod-cluster', status: 'active', created_at: '2024-01-01T00:00:00Z' },
      { id: 2, ...mockInstance, name: 'test-api-2', cluster_name: 'test-cluster', status: 'inactive', created_at: '2024-01-02T00:00:00Z' },
      { id: 3, ...mockInstance, name: 'dev-worker-3', cluster_name: 'dev-cluster', status: 'active', created_at: '2024-01-03T00:00:00Z' },
      { id: 4, ...mockInstance, name: 'prod-db-4', cluster_name: 'prod-cluster', status: 'error', created_at: '2024-01-04T00:00:00Z' },
    ];

    await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(instances),
      });
    });

    await page.reload();
    await waitForTableLoad(page);

    await test.step('Advanced text search', async () => {
      // Search with regex-like patterns
      await page.fill('[data-testid="search-input"]', 'prod-*');
      await page.waitForTimeout(500);

      // Should show prod instances
      await expect(page.locator('[data-testid="instance-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-4"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-2"]')).not.toBeVisible();
    });

    await test.step('Multiple filter combination', async () => {
      // Clear search
      await page.fill('[data-testid="search-input"]', '');
      await page.waitForTimeout(500);

      // Apply cluster filter
      await page.click('[data-testid="cluster-filter"]');
      await page.check('[data-testid="cluster-filter-prod-cluster"]');
      await page.click('[data-testid="apply-filters"]');

      // Apply status filter
      await page.click('[data-testid="status-filter"]');
      await page.check('[data-testid="status-filter-active"]');
      await page.click('[data-testid="apply-filters"]');

      // Should show only prod + active instances
      await expect(page.locator('[data-testid="instance-row-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-4"]')).not.toBeVisible();
    });

    await test.step('Date range filtering', async () => {
      // Open date filter
      await page.click('[data-testid="date-filter"]');
      
      // Set date range
      await page.fill('[data-testid="date-from"]', '2024-01-02');
      await page.fill('[data-testid="date-to"]', '2024-01-03');
      await page.click('[data-testid="apply-date-filter"]');

      // Should show instances created in range
      await expect(page.locator('[data-testid="instance-row-2"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-row-3"]')).toBeVisible();
    });

    await test.step('Column sorting', async () => {
      // Clear all filters
      await page.click('[data-testid="clear-all-filters"]');
      await page.waitForTimeout(500);

      // Sort by name ascending
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(300);

      // Verify sort order
      const firstRow = page.locator('[data-testid="instance-row"]:first-child [data-testid="instance-name"]');
      await expect(firstRow).toContainText('dev-worker-3');

      // Sort by name descending
      await page.click('[data-testid="sort-name"]');
      await page.waitForTimeout(300);

      // Verify reverse sort order
      await expect(firstRow).toContainText('test-api-2');
    });
  });

  test('Data export and import workflow', async ({ page }) => {
    await test.step('Export instances data', async () => {
      // Mock export API
      await page.route(`${API_BASE_URL}/api/instances/export`, async (route) => {
        const csvData = 'id,name,status,cluster_name\n1,test-instance,active,test-cluster';
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="instances.csv"',
          },
          body: csvData,
        });
      });

      // Trigger export
      await page.click('[data-testid="export-button"]');
      await page.click('[data-testid="export-csv"]');

      // Wait for download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="confirm-export"]');
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toBe('instances.csv');
    });

    await test.step('Import instances data', async () => {
      // Mock import API
      await page.route(`${API_BASE_URL}/api/instances/import`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ imported: 5, errors: [] }),
        });
      });

      // Open import modal
      await page.click('[data-testid="import-button"]');
      await page.waitForSelector('[data-testid="import-modal"]');

      // Upload file
      const fileInput = page.locator('[data-testid="file-input"]');
      await fileInput.setInputFiles({
        name: 'test-import.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('id,name,status\n1,imported-instance,active'),
      });

      // Confirm import
      await page.click('[data-testid="confirm-import"]');

      // Verify success message
      await expect(page.locator('.ant-message-success')).toContainText('成功导入 5 个实例');
    });
  });

test.describe('Accessibility Tests', () => {
  test('should not have accessibility violations', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForTableLoad(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForTableLoad(page);

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="create-instance-button"]')).toBeFocused();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="create-instance-modal"]')).toBeVisible();

    // Test Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="create-instance-modal"]')).not.toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(BASE_URL);
    await waitForTableLoad(page);

    // Check for ARIA labels
    await expect(page.locator('[aria-label="搜索实例"]')).toBeVisible();
    await expect(page.locator('[aria-label="创建新实例"]')).toBeVisible();
    await expect(page.locator('[role="table"]')).toBeVisible();
    await expect(page.locator('[role="button"]')).toHaveCount(expect.any(Number));
  });
});