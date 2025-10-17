/**
 * History Performance Integration Tests
 * Tests performance characteristics of history interface components
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Performance thresholds specific to history functionality
const HISTORY_PERFORMANCE_THRESHOLDS = {
  modalOpenTime: 500,
  historyLoadTime: 2000,
  searchResponseTime: 300,
  comparisonLoadTime: 1000,
  virtualScrollFrameTime: 16.67, // 60fps
  memoryLeakThreshold: 30, // 30% increase
};

// Helper functions
const createLargeHistoryDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    history_id: i + 1,
    original_id: 1,
    operation_type: i % 3 === 0 ? 'create' : i % 3 === 1 ? 'update' : 'delete',
    operation_timestamp: new Date(Date.now() - i * 60000).toISOString(),
    name: `instance-${i + 1}`,
    model_name: `model-${Math.floor(i / 100) + 1}`,
    model_version: '1.0.0',
    cluster_name: `cluster-${String.fromCharCode(65 + (i % 5))}`,
    status: i % 2 === 0 ? 'active' : 'inactive',
    description: `History record ${i + 1} with detailed description that contains multiple words and spans several lines to test rendering performance with longer content.`.repeat(2),
    pp: (i % 8) + 1,
    cp: (i % 4) + 1,
    tp: (i % 4) + 1,
    n_workers: (i % 16) + 1,
    replicas: (i % 5) + 1,
    priorities: [`priority-${i % 3}`],
    envs: Array.from({ length: i % 10 }, (_, j) => ({ key: `env-${j}`, value: `value-${j}` })),
    created_at: new Date(Date.now() - i * 120000).toISOString(),
    updated_at: new Date(Date.now() - i * 60000).toISOString(),
  }));
};

const setupPerformanceMonitoring = async (page: Page) => {
  await page.addInitScript(() => {
    // Performance monitoring setup
    (window as any).performanceMetrics = {
      marks: new Map(),
      measures: new Map(),
      frameTimings: [],
      memoryUsage: [],
    };

    // Mark performance points
    (window as any).markPerformance = (name: string) => {
      const timestamp = performance.now();
      (window as any).performanceMetrics.marks.set(name, timestamp);
      performance.mark(name);
    };

    // Measure performance between marks
    (window as any).measurePerformance = (name: string, startMark: string, endMark?: string) => {
      const startTime = (window as any).performanceMetrics.marks.get(startMark);
      const endTime = endMark 
        ? (window as any).performanceMetrics.marks.get(endMark)
        : performance.now();
      
      if (startTime && endTime) {
        const duration = endTime - startTime;
        (window as any).performanceMetrics.measures.set(name, duration);
        return duration;
      }
      return 0;
    };

    // Monitor frame rate
    let lastFrameTime = performance.now();
    const frameRateMonitor = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      (window as any).performanceMetrics.frameTimings.push(frameTime);
      lastFrameTime = currentTime;
      
      // Keep only last 100 frames
      if ((window as any).performanceMetrics.frameTimings.length > 100) {
        (window as any).performanceMetrics.frameTimings.shift();
      }
      
      requestAnimationFrame(frameRateMonitor);
    };
    requestAnimationFrame(frameRateMonitor);

    // Monitor memory usage
    setInterval(() => {
      if ((performance as any).memory) {
        (window as any).performanceMetrics.memoryUsage.push({
          timestamp: Date.now(),
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
        });
        
        // Keep only last 50 measurements
        if ((window as any).performanceMetrics.memoryUsage.length > 50) {
          (window as any).performanceMetrics.memoryUsage.shift();
        }
      }
    }, 1000);
  });
};

const getPerformanceMetrics = async (page: Page) => {
  return await page.evaluate(() => {
    const metrics = (window as any).performanceMetrics;
    
    // Calculate average frame time
    const frameTimings = metrics.frameTimings;
    const avgFrameTime = frameTimings.length > 0 
      ? frameTimings.reduce((a: number, b: number) => a + b, 0) / frameTimings.length
      : 0;
    
    // Calculate memory usage trend
    const memoryUsage = metrics.memoryUsage;
    const memoryTrend = memoryUsage.length > 1
      ? ((memoryUsage[memoryUsage.length - 1].used - memoryUsage[0].used) / memoryUsage[0].used) * 100
      : 0;
    
    return {
      marks: Object.fromEntries(metrics.marks),
      measures: Object.fromEntries(metrics.measures),
      avgFrameTime,
      memoryTrend,
      memoryUsage: memoryUsage[memoryUsage.length - 1],
    };
  });
};

test.describe('History Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupPerformanceMonitoring(page);
    
    // Mock instance API
    await page.route(`${API_BASE_URL}/api/instances`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          name: 'performance-test-instance',
          status: 'active',
        }]),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForSelector('[data-testid="instance-table"]');
  });

  test.describe('Modal Performance', () => {
    test('should open history modal within performance threshold', async ({ page }) => {
      // Mock small dataset for modal open test
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(20),
            total_count: 20,
            limit: 20,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Measure modal open time
      await page.evaluate(() => (window as any).markPerformance('modal-open-start'));
      
      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');
      
      await page.evaluate(() => (window as any).markPerformance('modal-open-end'));

      const metrics = await getPerformanceMetrics(page);
      const modalOpenTime = metrics.measures.get('modal-open-time') || 
        await page.evaluate(() => (window as any).measurePerformance('modal-open-time', 'modal-open-start', 'modal-open-end'));

      expect(modalOpenTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.modalOpenTime);
    });

    test('should handle modal resize performance', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(100),
            total_count: 100,
            limit: 100,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      // Test resize performance
      await page.evaluate(() => (window as any).markPerformance('resize-start'));
      
      // Simulate window resize
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 1200, height: 800 });
      
      await page.evaluate(() => (window as any).markPerformance('resize-end'));

      const metrics = await getPerformanceMetrics(page);
      
      // Should maintain good frame rate during resize
      expect(metrics.avgFrameTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.virtualScrollFrameTime * 2);
    });
  });

  test.describe('Large Dataset Performance', () => {
    test('should handle 1000+ history records efficiently', async ({ page }) => {
      const largeDataset = createLargeHistoryDataset(1000);
      
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        // Simulate realistic API delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: largeDataset,
            total_count: 1000,
            limit: 1000,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.evaluate(() => (window as any).markPerformance('large-dataset-start'));
      
      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');
      await page.waitForSelector('[data-testid="history-record"]');
      
      await page.evaluate(() => (window as any).markPerformance('large-dataset-end'));

      const metrics = await getPerformanceMetrics(page);
      const loadTime = await page.evaluate(() => 
        (window as any).measurePerformance('large-dataset-load', 'large-dataset-start', 'large-dataset-end')
      );

      expect(loadTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.historyLoadTime);

      // Verify virtual scrolling is working (not all records rendered)
      const renderedRecords = await page.locator('[data-testid="history-record"]').count();
      expect(renderedRecords).toBeLessThan(100); // Should be virtualized
    });

    test('should maintain performance during virtual scrolling', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(5000),
            total_count: 5000,
            limit: 5000,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      const historyList = page.locator('[data-testid="history-list"]');
      
      // Start performance monitoring for scrolling
      await page.evaluate(() => (window as any).markPerformance('scroll-start'));

      // Perform intensive scrolling
      for (let i = 0; i < 20; i++) {
        await historyList.evaluate(el => el.scrollBy(0, 500));
        await page.waitForTimeout(50);
      }

      await page.evaluate(() => (window as any).markPerformance('scroll-end'));

      const metrics = await getPerformanceMetrics(page);
      
      // Should maintain good frame rate during scrolling
      expect(metrics.avgFrameTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.virtualScrollFrameTime * 1.5);
    });
  });

  test.describe('Search Performance', () => {
    test('should respond to search queries quickly', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        const url = new URL(route.request().url());
        const searchTerm = url.searchParams.get('search');
        
        let records = createLargeHistoryDataset(500);
        
        if (searchTerm) {
          records = records.filter(r => 
            r.name.includes(searchTerm) || 
            r.description.includes(searchTerm)
          );
        }
        
        // Simulate search processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: records,
            total_count: records.length,
            limit: 500,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      // Test search performance
      await page.evaluate(() => (window as any).markPerformance('search-start'));
      
      await page.fill('[data-testid="history-search-input"]', 'instance-100');
      await page.waitForTimeout(350); // Wait for debounce + processing
      
      await page.evaluate(() => (window as any).markPerformance('search-end'));

      const searchTime = await page.evaluate(() => 
        (window as any).measurePerformance('search-time', 'search-start', 'search-end')
      );

      expect(searchTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.searchResponseTime + 200); // Include debounce
    });

    test('should handle rapid search input changes efficiently', async ({ page }) => {
      let requestCount = 0;
      
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        requestCount++;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(50),
            total_count: 50,
            limit: 50,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      const initialRequestCount = requestCount;

      // Rapid typing simulation
      const searchTerms = ['a', 'ab', 'abc', 'abcd', 'abcde'];
      for (const term of searchTerms) {
        await page.fill('[data-testid="history-search-input"]', term);
        await page.waitForTimeout(50); // Faster than debounce
      }

      // Wait for debounce to complete
      await page.waitForTimeout(400);

      // Should debounce requests (not make a request for each keystroke)
      const finalRequestCount = requestCount - initialRequestCount;
      expect(finalRequestCount).toBeLessThan(3); // Should be debounced
    });
  });

  test.describe('Comparison Performance', () => {
    test('should load comparison view quickly', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(100),
            total_count: 100,
            limit: 100,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Mock comparison API
      await page.route(`${API_BASE_URL}/api/history/compare`, async (route) => {
        const requestBody = await route.request().postDataJSON();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            left_record: createLargeHistoryDataset(1)[0],
            right_record: createLargeHistoryDataset(1)[0],
            differences: Array.from({ length: 20 }, (_, i) => ({
              field: `field_${i}`,
              left_value: `old_value_${i}`,
              right_value: `new_value_${i}`,
              change_type: 'modified',
            })),
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      // Select records for comparison
      await page.check('[data-testid="history-record"]:nth-child(1) [data-testid="select-record"]');
      await page.check('[data-testid="history-record"]:nth-child(2) [data-testid="select-record"]');

      await page.evaluate(() => (window as any).markPerformance('comparison-start'));
      
      await page.click('[data-testid="compare-selected-button"]');
      await page.waitForSelector('[data-testid="history-comparison"]');
      
      await page.evaluate(() => (window as any).markPerformance('comparison-end'));

      const comparisonTime = await page.evaluate(() => 
        (window as any).measurePerformance('comparison-time', 'comparison-start', 'comparison-end')
      );

      expect(comparisonTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.comparisonLoadTime);
    });

    test('should handle large comparison diffs efficiently', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(10),
            total_count: 10,
            limit: 10,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Mock large diff comparison
      await page.route(`${API_BASE_URL}/api/history/compare`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            left_record: createLargeHistoryDataset(1)[0],
            right_record: createLargeHistoryDataset(1)[0],
            differences: Array.from({ length: 500 }, (_, i) => ({
              field: `field_${i}`,
              left_value: `old_value_${i}`.repeat(10),
              right_value: `new_value_${i}`.repeat(10),
              change_type: i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'modified',
            })),
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      await page.waitForSelector('[data-testid="history-modal"]');

      await page.check('[data-testid="history-record"]:nth-child(1) [data-testid="select-record"]');
      await page.check('[data-testid="history-record"]:nth-child(2) [data-testid="select-record"]');

      await page.click('[data-testid="compare-selected-button"]');
      await page.waitForSelector('[data-testid="history-comparison"]');

      // Test scrolling performance in comparison view
      const comparisonPanel = page.locator('[data-testid="comparison-diff-panel"]');
      
      await page.evaluate(() => (window as any).markPerformance('diff-scroll-start'));
      
      for (let i = 0; i < 10; i++) {
        await comparisonPanel.evaluate(el => el.scrollBy(0, 200));
        await page.waitForTimeout(50);
      }
      
      await page.evaluate(() => (window as any).markPerformance('diff-scroll-end'));

      const metrics = await getPerformanceMetrics(page);
      
      // Should maintain good performance even with large diffs
      expect(metrics.avgFrameTime).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.virtualScrollFrameTime * 2);
    });
  });

  test.describe('Memory Management', () => {
    test('should not have memory leaks during extended usage', async ({ page }) => {
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(200),
            total_count: 200,
            limit: 200,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Get initial memory baseline
      await page.waitForTimeout(1000);
      const initialMetrics = await getPerformanceMetrics(page);
      const initialMemory = initialMetrics.memoryUsage?.used || 0;

      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        // Open history modal
        await page.click('[data-testid="history-instance-1"]');
        await page.waitForSelector('[data-testid="history-modal"]');

        // Scroll through records
        const historyList = page.locator('[data-testid="history-list"]');
        for (let j = 0; j < 5; j++) {
          await historyList.evaluate(el => el.scrollBy(0, 300));
          await page.waitForTimeout(100);
        }

        // Open and close details
        await page.click('[data-testid="history-record"]:first-child [data-testid="view-details-button"]');
        await page.waitForTimeout(200);
        await page.click('[data-testid="close-details-button"]');

        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="history-modal"]', { state: 'hidden' });
        
        await page.waitForTimeout(500);
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      await page.waitForTimeout(2000);

      const finalMetrics = await getPerformanceMetrics(page);
      const finalMemory = finalMetrics.memoryUsage?.used || 0;

      // Calculate memory increase percentage
      const memoryIncrease = ((finalMemory - initialMemory) / initialMemory) * 100;

      expect(memoryIncrease).toBeLessThan(HISTORY_PERFORMANCE_THRESHOLDS.memoryLeakThreshold);
    });

    test('should efficiently manage component lifecycle', async ({ page }) => {
      let componentMountCount = 0;
      let componentUnmountCount = 0;

      // Inject component lifecycle tracking
      await page.addInitScript(() => {
        const originalCreateElement = React.createElement;
        React.createElement = function(...args) {
          const element = originalCreateElement.apply(this, args);
          if (args[0] && typeof args[0] === 'function' && args[0].name.includes('History')) {
            (window as any).componentMountCount = ((window as any).componentMountCount || 0) + 1;
          }
          return element;
        };
      });

      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(50),
            total_count: 50,
            limit: 50,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Test component mounting/unmounting
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="history-instance-1"]');
        await page.waitForSelector('[data-testid="history-modal"]');
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="history-modal"]', { state: 'hidden' });
      }

      // Components should be properly cleaned up
      const metrics = await getPerformanceMetrics(page);
      expect(metrics.memoryTrend).toBeLessThan(20); // Less than 20% memory increase
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        // Simulate 3G network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(100),
            total_count: 100,
            limit: 100,
            offset: 0,
            has_more: false,
          }),
        });
      });

      await page.click('[data-testid="history-instance-1"]');
      
      // Should show loading state immediately
      await expect(page.locator('[data-testid="history-loading"]')).toBeVisible();
      
      // Should eventually load content
      await page.waitForSelector('[data-testid="history-record"]', { timeout: 10000 });
      
      // Loading state should be hidden
      await expect(page.locator('[data-testid="history-loading"]')).not.toBeVisible();
    });

    test('should optimize concurrent requests', async ({ page }) => {
      let requestCount = 0;
      
      await page.route(`${API_BASE_URL}/api/instances/1/history`, async (route) => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history_records: createLargeHistoryDataset(50),
            total_count: 50,
            limit: 50,
            offset: 0,
            has_more: false,
          }),
        });
      });

      // Make multiple rapid requests
      await page.click('[data-testid="history-instance-1"]');
      await page.keyboard.press('Escape');
      await page.click('[data-testid="history-instance-1"]');
      await page.keyboard.press('Escape');
      await page.click('[data-testid="history-instance-1"]');
      
      await page.waitForSelector('[data-testid="history-modal"]');

      // Should deduplicate or cache requests
      expect(requestCount).toBeLessThanOrEqual(2);
    });
  });
});