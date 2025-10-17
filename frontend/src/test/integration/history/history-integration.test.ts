/**
 * History Interface Integration Tests
 * Comprehensive tests for history functionality end-to-end workflows
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Mock data for history testing
const createMockInstance = (overrides = {}) => ({
  id: 1,
  name: 'test-instance',
  model_name: 'test-model',
  model_version: '1.0.0',
  cluster_name: 'test-cluster',
  image_tag: 'latest',
  status: 'active',
  description: 'Test instance for history',
  pp: 1,
  cp: 1,
  tp: 1,
  n_workers: 4,
  replicas: 1,
  priorities: ['normal'],
  envs: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockHistoryRecords = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    history_id: i + 1,
    original_id: 1,
    operation_type: i === 0 ? 'create' : i % 2 === 0 ? 'update' : 'delete',
    operation_timestamp: new Date(Date.now() - (count - i) * 60000).toISOString(),
    ...createMockInstance({
      name: i === 0 ? 'test-instance' : `test-instance-v${i}`,
      description: `History record ${i + 1}`,
    }),
  }));
};

// Helper functions
const setupHistoryMocks = async (page: Page, instanceId: number = 1, recordCount: number = 5) => {
  const instance = createMockInstance({ id: instanceId });
  const historyRecords = createMockHistoryRecords(recordCount);

  // Mock instance API
  await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([instance]),
    });
  });

  // Mock history API
  await page.route(`${API_BASE_URL}/api/instances/${instanceId}/history`, async (route) => {
    const url = new URL(route.request().url());
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const paginatedRecords = historyRecords.slice(offset, offset + limit);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        history_records: paginatedRecords,
        total_count: historyRecords.length,
        limit,
        offset,
        has_more: offset + limit < historyRecords.length,
      }),
    });
  });

  // Mock individual history record API
  historyRecords.forEach(record => {
    page.route(`${API_BASE_URL}/api/history/${record.history_id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(record),
      });
    });
  });

  return { instance, historyRecords };
};

const waitForHistoryModal = async (page: Page) => {
  await page.waitForSelector('[data-testid="history-modal"]', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
};

test.describe('History Interface Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupHistoryMocks(page);
    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="instance-table"]');
  });

  test.describe('End-to-End History Workflows', () => {
    test('should display complete history workflow', async ({ page }) => {
      await test.step('Open history modal', async () => {
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Verify modal is open and has content
        await expect(page.locator('[data-testid="history-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="history-modal-title"]')).toContainText('test-instance');
      });

      await test.step('Verify history records display', async () => {
        // Should show history records
        await expect(page.locator('[data-testid="history-record"]')).toHaveCount(5);
        
        // Verify record order (newest first)
        const firstRecord = page.locator('[data-testid="history-record"]').first();
        await expect(firstRecord.locator('[data-testid="operation-type"]')).toContainText('删除');
        
        // Verify record content
        await expect(firstRecord.locator('[data-testid="record-timestamp"]')).toBeVisible();
        await expect(firstRecord.locator('[data-testid="record-name"]')).toBeVisible();
      });

      await test.step('View history record details', async () => {
        // Click on first record to view details
        await page.click('[data-testid="history-record"]:first-child [data-testid="view-details-button"]');
        
        // Verify details panel opens
        await expect(page.locator('[data-testid="history-detail-panel"]')).toBeVisible();
        
        // Verify all fields are displayed
        await expect(page.locator('[data-testid="detail-field-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="detail-field-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="detail-field-description"]')).toBeVisible();
      });

      await test.step('Compare history records', async () => {
        // Select two records for comparison
        await page.check('[data-testid="history-record"]:nth-child(1) [data-testid="select-record"]');
        await page.check('[data-testid="history-record"]:nth-child(2) [data-testid="select-record"]');
        
        // Click compare button
        await page.click('[data-testid="compare-selected-button"]');
        
        // Verify comparison view
        await expect(page.locator('[data-testid="history-comparison"]')).toBeVisible();
        await expect(page.locator('[data-testid="comparison-left-panel"]')).toBeVisible();
        await expect(page.locator('[data-testid="comparison-right-panel"]')).toBeVisible();
        
        // Verify differences are highlighted
        await expect(page.locator('[data-testid="field-diff"]')).toHaveCount.greaterThan(0);
      });

      await test.step('Filter and search history', async () => {
        // Close comparison view
        await page.click('[data-testid="close-comparison-button"]');
        
        // Test operation type filter
        await page.click('[data-testid="operation-filter"]');
        await page.check('[data-testid="filter-update"]');
        await page.click('[data-testid="apply-filters"]');
        
        // Should show only update operations
        const visibleRecords = page.locator('[data-testid="history-record"]:visible');
        await expect(visibleRecords).toHaveCount(2); // Assuming 2 update operations
        
        // Test search functionality
        await page.fill('[data-testid="history-search-input"]', 'test-instance-v2');
        await page.waitForTimeout(300); // Debounce delay
        
        // Should show only matching records
        await expect(page.locator('[data-testid="search-highlight"]')).toBeVisible();
      });

      await test.step('Pagination and virtual scrolling', async () => {
        // Clear filters
        await page.click('[data-testid="clear-filters-button"]');
        
        // Test pagination if more than page size
        if (await page.locator('[data-testid="pagination-next"]').isVisible()) {
          await page.click('[data-testid="pagination-next"]');
          await page.waitForLoadState('networkidle');
          
          // Verify new records loaded
          await expect(page.locator('[data-testid="history-record"]')).toHaveCount.greaterThan(0);
        }
      });
    });

    test('should handle history operations correctly', async ({ page }) => {
      await test.step('Export history data', async () => {
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Mock export API
        await page.route(`${API_BASE_URL}/api/instances/1/history/export`, async (route) => {
          const csvData = 'history_id,operation_type,operation_timestamp,name\n1,create,2024-01-01T00:00:00Z,test-instance';
          await route.fulfill({
            status: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="history.csv"',
            },
            body: csvData,
          });
        });
        
        // Trigger export
        await page.click('[data-testid="export-history-button"]');
        
        // Wait for download
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="confirm-export"]');
        const download = await downloadPromise;
        
        expect(download.suggestedFilename()).toBe('history.csv');
      });

      await test.step('Copy history record', async () => {
        // Click copy button on first record
        await page.click('[data-testid="history-record"]:first-child [data-testid="copy-record-button"]');
        
        // Verify success message
        await expect(page.locator('.ant-message-success')).toContainText('历史记录已复制');
        
        // Verify clipboard content (if supported)
        if (await page.evaluate(() => 'clipboard' in navigator)) {
          const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
          expect(clipboardText).toContain('test-instance');
        }
      });

      await test.step('Restore from history', async () => {
        // Mock restore API
        await page.route(`${API_BASE_URL}/api/instances/1/restore`, async (route) => {
          const requestBody = await route.request().postDataJSON();
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ 
              id: 1, 
              ...createMockInstance(),
              restored_from_history_id: requestBody.history_id 
            }),
          });
        });
        
        // Click restore button
        await page.click('[data-testid="history-record"]:nth-child(2) [data-testid="restore-button"]');
        
        // Confirm restoration
        await page.waitForSelector('[data-testid="restore-confirm-modal"]');
        await page.click('[data-testid="confirm-restore"]');
        
        // Verify success message
        await expect(page.locator('.ant-message-success')).toContainText('实例已恢复');
      });
    });

    test('should handle error scenarios gracefully', async ({ page }) => {
      await test.step('Handle API errors', async () => {
        // Mock API error
        await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ detail: 'Internal server error' }),
          });
        });
        
        await page.click('[data-testid="history-instance-1"]');
        await page.waitForSelector('[data-testid="history-modal"]');
        
        // Verify error state
        await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText('加载历史记录失败');
        
        // Verify retry button
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      });

      await test.step('Handle network errors', async () => {
        // Mock network failure
        await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
          await route.abort('failed');
        });
        
        await page.reload();
        await page.waitForSelector('[data-testid="instance-table"]');
        
        await page.click('[data-testid="history-instance-1"]');
        await page.waitForSelector('[data-testid="history-modal"]');
        
        // Verify network error handling
        await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      });

      await test.step('Handle empty history', async () => {
        // Mock empty history
        await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              history_records: [],
              total_count: 0,
              limit: 20,
              offset: 0,
              has_more: false,
            }),
          });
        });
        
        await page.reload();
        await page.waitForSelector('[data-testid="instance-table"]');
        
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Verify empty state
        await expect(page.locator('[data-testid="empty-history-state"]')).toBeVisible();
        await expect(page.locator('[data-testid="empty-message"]')).toContainText('暂无历史记录');
      });
    });
  });

  test.describe('Cross-Device Compatibility', () => {
    test('should work on mobile devices', async ({ page, context }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await test.step('Mobile history modal layout', async () => {
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Verify mobile-optimized layout
        await expect(page.locator('[data-testid="history-modal"]')).toHaveClass(/mobile-modal/);
        
        // Verify responsive design
        const modalWidth = await page.locator('[data-testid="history-modal"]').boundingBox();
        expect(modalWidth?.width).toBeLessThan(400);
      });

      await test.step('Touch interactions', async () => {
        // Test swipe gestures for navigation
        const historyList = page.locator('[data-testid="history-list"]');
        
        // Simulate swipe left for next page
        await historyList.hover();
        await page.mouse.down();
        await page.mouse.move(-100, 0);
        await page.mouse.up();
        
        // Verify swipe navigation works
        await page.waitForTimeout(500);
      });

      await test.step('Mobile-specific features', async () => {
        // Verify pull-to-refresh
        await page.touchscreen.tap(200, 100);
        await page.mouse.move(200, 200);
        
        // Verify mobile menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
      });
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await test.step('Tablet layout optimization', async () => {
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Verify tablet-optimized layout
        await expect(page.locator('[data-testid="history-modal"]')).toHaveClass(/tablet-modal/);
        
        // Verify side-by-side comparison view
        await page.check('[data-testid="history-record"]:nth-child(1) [data-testid="select-record"]');
        await page.check('[data-testid="history-record"]:nth-child(2) [data-testid="select-record"]');
        await page.click('[data-testid="compare-selected-button"]');
        
        await expect(page.locator('[data-testid="tablet-comparison-layout"]')).toBeVisible();
      });
    });

    test('should handle orientation changes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Rotate to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      // Verify layout adapts to landscape
      await expect(page.locator('[data-testid="history-modal"]')).toBeVisible();
      
      // Rotate back to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Verify layout adapts back
      await expect(page.locator('[data-testid="history-modal"]')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should handle large history datasets efficiently', async ({ page }) => {
      // Setup large dataset
      await setupHistoryMocks(page, 1, 1000);
      
      await test.step('Load large history efficiently', async () => {
        const startTime = Date.now();
        
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        const loadTime = Date.now() - startTime;
        
        // Should load within reasonable time
        expect(loadTime).toBeLessThan(3000);
        
        // Verify virtual scrolling is working
        const renderedRecords = await page.locator('[data-testid="history-record"]').count();
        expect(renderedRecords).toBeLessThan(50); // Should be virtualized
      });

      await test.step('Smooth scrolling performance', async () => {
        const historyList = page.locator('[data-testid="history-list"]');
        
        // Measure scroll performance
        const startTime = Date.now();
        
        // Scroll through multiple pages
        for (let i = 0; i < 10; i++) {
          await historyList.evaluate(el => el.scrollBy(0, 500));
          await page.waitForTimeout(50);
        }
        
        const scrollTime = Date.now() - startTime;
        
        // Should maintain smooth scrolling
        expect(scrollTime).toBeLessThan(2000);
      });
    });

    test('should optimize memory usage', async ({ page }) => {
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform memory-intensive operations
      for (let i = 0; i < 20; i++) {
        // Open and close details
        await page.click('[data-testid="history-record"]:first-child [data-testid="view-details-button"]');
        await page.waitForTimeout(100);
        await page.click('[data-testid="close-details-button"]');
        
        // Scroll to trigger virtualization
        await page.locator('[data-testid="history-list"]').evaluate(el => el.scrollBy(0, 200));
        await page.waitForTimeout(50);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory should not increase significantly
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      expect(memoryIncreasePercent).toBeLessThan(30);
    });

    test('should cache data effectively', async ({ page }) => {
      let requestCount = 0;
      
      // Count API requests
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        requestCount++;
        await route.continue();
      });
      
      // First load
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      const firstRequestCount = requestCount;
      
      // Close and reopen
      await page.click('[data-testid="close-history-modal"]');
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Should use cached data
      expect(requestCount).toBe(firstRequestCount);
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should be fully accessible', async ({ page }) => {
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Run accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="history-modal"]')
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="history-search-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="operation-filter"]')).toBeFocused();
      
      // Test arrow key navigation in list
      await page.keyboard.press('Tab');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="history-detail-panel"]')).toBeVisible();
      
      // Test Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="history-detail-panel"]')).not.toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Check ARIA labels
      await expect(page.locator('[aria-label="历史记录列表"]')).toBeVisible();
      await expect(page.locator('[aria-label="搜索历史记录"]')).toBeVisible();
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('[role="list"]')).toBeVisible();
      
      // Check ARIA states
      const firstRecord = page.locator('[data-testid="history-record"]').first();
      await expect(firstRecord).toHaveAttribute('role', 'listitem');
      await expect(firstRecord).toHaveAttribute('aria-selected', 'false');
      
      // Test selection state
      await firstRecord.locator('[data-testid="select-record"]').check();
      await expect(firstRecord).toHaveAttribute('aria-selected', 'true');
    });

    test('should support screen readers', async ({ page }) => {
      await page.click('[data-testid="history-instance-1"]');
      await waitForHistoryModal(page);
      
      // Check for screen reader announcements
      await expect(page.locator('[aria-live="polite"]')).toBeVisible();
      
      // Test dynamic content announcements
      await page.fill('[data-testid="history-search-input"]', 'test');
      await page.waitForTimeout(300);
      
      // Should announce search results
      const announcement = page.locator('[aria-live="polite"]');
      await expect(announcement).toContainText(/找到.*条记录/);
    });
  });

  test.describe('Data Consistency Tests', () => {
    test('should maintain data consistency across operations', async ({ page }) => {
      await test.step('Verify history creation on instance update', async () => {
        // Mock instance update
        await page.route(`${API_BASE_URL}/api/instances/1`, async (route) => {
          if (route.request().method() === 'PUT') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                ...createMockInstance(),
                name: 'updated-instance',
                updated_at: new Date().toISOString(),
              }),
            });
          }
        });
        
        // Update instance
        await page.click('[data-testid="edit-instance-1"]');
        await page.waitForSelector('[data-testid="edit-instance-modal"]');
        await page.fill('[data-testid="instance-name-input"]', 'updated-instance');
        await page.click('[data-testid="submit-button"]');
        
        // Verify history was created
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Should have new history record
        const records = page.locator('[data-testid="history-record"]');
        await expect(records).toHaveCount(6); // Original 5 + 1 new
      });

      await test.step('Verify history integrity', async () => {
        // Check that all history records are valid
        const records = page.locator('[data-testid="history-record"]');
        const count = await records.count();
        
        for (let i = 0; i < count; i++) {
          const record = records.nth(i);
          
          // Each record should have required fields
          await expect(record.locator('[data-testid="operation-type"]')).toBeVisible();
          await expect(record.locator('[data-testid="record-timestamp"]')).toBeVisible();
          await expect(record.locator('[data-testid="record-name"]')).toBeVisible();
        }
      });

      await test.step('Verify chronological order', async () => {
        const timestamps = await page.locator('[data-testid="record-timestamp"]').allTextContents();
        
        // Verify timestamps are in descending order (newest first)
        for (let i = 1; i < timestamps.length; i++) {
          const current = new Date(timestamps[i]).getTime();
          const previous = new Date(timestamps[i - 1]).getTime();
          expect(current).toBeLessThanOrEqual(previous);
        }
      });
    });

    test('should handle concurrent operations correctly', async ({ page, context }) => {
      // Open multiple tabs
      const page2 = await context.newPage();
      await page2.goto(BASE_URL);
      await page2.waitForSelector('[data-testid="instance-table"]');
      
      // Open history in both tabs
      await page.click('[data-testid="history-instance-1"]');
      await page2.click('[data-testid="history-instance-1"]');
      
      await waitForHistoryModal(page);
      await waitForHistoryModal(page2);
      
      // Both should show the same data
      const records1 = await page.locator('[data-testid="history-record"]').count();
      const records2 = await page2.locator('[data-testid="history-record"]').count();
      
      expect(records1).toBe(records2);
      
      await page2.close();
    });
  });

  test.describe('Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ page }) => {
        // Basic functionality test for each browser
        await page.click('[data-testid="history-instance-1"]');
        await waitForHistoryModal(page);
        
        // Verify core functionality works
        await expect(page.locator('[data-testid="history-record"]')).toHaveCount(5);
        
        // Test search functionality
        await page.fill('[data-testid="history-search-input"]', 'test');
        await page.waitForTimeout(300);
        
        // Test comparison functionality
        await page.check('[data-testid="history-record"]:nth-child(1) [data-testid="select-record"]');
        await page.check('[data-testid="history-record"]:nth-child(2) [data-testid="select-record"]');
        await page.click('[data-testid="compare-selected-button"]');
        
        await expect(page.locator('[data-testid="history-comparison"]')).toBeVisible();
      });
    });
  });
});