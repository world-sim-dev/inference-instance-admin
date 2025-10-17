/**
 * Performance Tests
 * Tests application performance metrics and optimization
 */

import { test, expect, Page } from '@playwright/test';
import lighthouse from 'lighthouse';
import { launch } from 'puppeteer';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: 2000,
  largestContentfulPaint: 4000,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100,
  timeToInteractive: 5000,
  totalBlockingTime: 300,
};

// Helper functions
const measurePageLoad = async (page: Page): Promise<any> => {
  const startTime = Date.now();
  
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  const endTime = Date.now();
  const loadTime = endTime - startTime;

  // Get performance metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      totalLoadTime: loadTime,
    };
  });

  return metrics;
};

const runLighthouseAudit = async (url: string) => {
  const browser = await launch({ headless: true });
  const { lhr } = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    logLevel: 'info',
  });
  
  await browser.close();
  return lhr;
};

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API with realistic data
    await page.route('**/api/instances', async (route) => {
      const mockInstances = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `instance-${i + 1}`,
        model_name: `model-${Math.floor(i / 10) + 1}`,
        model_version: '1.0.0',
        cluster_name: `cluster-${String.fromCharCode(65 + (i % 5))}`,
        image_tag: 'latest',
        status: i % 3 === 0 ? 'inactive' : 'active',
        description: `Description for instance ${i + 1}`.repeat(3),
        created_at: new Date(Date.now() - i * 60000).toISOString(),
        updated_at: new Date(Date.now() - i * 30000).toISOString(),
      }));
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockInstances),
      });
    });
  });

  test.describe('Page Load Performance', () => {
    test('should load initial page within performance thresholds', async ({ page }) => {
      const metrics = await measurePageLoad(page);

      expect(metrics.totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.timeToInteractive);
      expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
      expect(metrics.domContentLoaded).toBeLessThan(2000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock larger dataset
      await page.route('**/api/instances', async (route) => {
        const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
          id: i + 1,
          name: `large-instance-${i + 1}`,
          model_name: `model-${Math.floor(i / 100) + 1}`,
          cluster_name: `cluster-${String.fromCharCode(65 + (i % 10))}`,
          status: i % 4 === 0 ? 'inactive' : 'active',
          description: `Large dataset description ${i + 1}`.repeat(5),
          created_at: new Date(Date.now() - i * 60000).toISOString(),
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeDataset),
        });
      });

      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForSelector('[data-testid="instance-table"]');
      
      // Wait for virtualization to kick in
      await page.waitForTimeout(1000);
      
      const renderTime = Date.now() - startTime;
      
      // Should handle large datasets within reasonable time
      expect(renderTime).toBeLessThan(8000);
      
      // Check that not all rows are rendered (virtualization working)
      const renderedRows = await page.locator('[data-testid^="instance-row-"]').count();
      expect(renderedRows).toBeLessThan(100); // Should be virtualized
    });

    test('should maintain performance during interactions', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Measure search performance
      const searchStartTime = Date.now();
      await page.fill('[data-testid="search-input"]', 'instance-1');
      await page.waitForTimeout(300); // Debounce delay
      const searchTime = Date.now() - searchStartTime;

      expect(searchTime).toBeLessThan(1000);

      // Measure filter performance
      const filterStartTime = Date.now();
      await page.click('[data-testid="status-filter"]');
      await page.click('[data-testid="status-filter-active"]');
      await page.waitForTimeout(100);
      const filterTime = Date.now() - filterStartTime;

      expect(filterTime).toBeLessThan(500);

      // Measure modal open performance
      const modalStartTime = Date.now();
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      const modalTime = Date.now() - modalStartTime;

      expect(modalTime).toBeLessThan(300);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Perform multiple operations that could cause leaks
      for (let i = 0; i < 10; i++) {
        // Open and close modal
        await page.click('[data-testid="create-instance-button"]');
        await page.waitForSelector('[data-testid="create-instance-modal"]');
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="create-instance-modal"]', { state: 'hidden' });

        // Change filters
        await page.click('[data-testid="status-filter"]');
        await page.click('[data-testid="status-filter-active"]');
        await page.click('[data-testid="status-filter-active"]'); // Uncheck
        
        // Search and clear
        await page.fill('[data-testid="search-input"]', `search-${i}`);
        await page.waitForTimeout(100);
        await page.fill('[data-testid="search-input"]', '');
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
      
      expect(memoryIncreasePercent).toBeLessThan(50); // Less than 50% increase
    });
  });

  test.describe('Bundle Size and Loading', () => {
    test('should have reasonable bundle sizes', async ({ page }) => {
      const responses: any[] = [];
      
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length'],
            type: response.url().includes('.js') ? 'js' : 'css',
          });
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const jsSize = responses
        .filter(r => r.type === 'js')
        .reduce((total, r) => total + (parseInt(r.size) || 0), 0);
      
      const cssSize = responses
        .filter(r => r.type === 'css')
        .reduce((total, r) => total + (parseInt(r.size) || 0), 0);

      // Bundle size thresholds (in bytes)
      expect(jsSize).toBeLessThan(1024 * 1024); // 1MB for JS
      expect(cssSize).toBeLessThan(200 * 1024); // 200KB for CSS
    });

    test('should load critical resources first', async ({ page }) => {
      const resourceLoadOrder: string[] = [];
      
      page.on('response', response => {
        if (response.url().includes(BASE_URL)) {
          resourceLoadOrder.push(response.url());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // HTML should load first
      expect(resourceLoadOrder[0]).toContain(BASE_URL);
      
      // Critical CSS should load early
      const cssIndex = resourceLoadOrder.findIndex(url => url.includes('.css'));
      expect(cssIndex).toBeLessThan(5);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Measure Core Web Vitals
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};
          
          // First Contentful Paint
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            }
          }).observe({ type: 'paint', buffered: true });

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });

          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ type: 'layout-shift', buffered: true });

          // First Input Delay (simulated)
          document.addEventListener('click', function measureFID() {
            vitals.fid = performance.now() - (vitals.interactionStart || 0);
            document.removeEventListener('click', measureFID);
          }, { once: true });

          // Resolve after a short delay to collect metrics
          setTimeout(() => resolve(vitals), 2000);
        });
      });

      // Verify thresholds
      expect(vitals.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
      expect(vitals.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.largestContentfulPaint);
      expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift);
    });

    test('should maintain performance under load', async ({ page }) => {
      // Simulate high CPU load
      await page.evaluate(() => {
        // Create CPU-intensive task
        const worker = new Worker(URL.createObjectURL(new Blob([`
          let i = 0;
          setInterval(() => {
            for (let j = 0; j < 1000000; j++) {
              i += Math.random();
            }
          }, 10);
        `], { type: 'application/javascript' })));
      });

      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForSelector('[data-testid="instance-table"]');
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time under load
      expect(loadTime).toBeLessThan(8000);

      // Test interaction responsiveness under load
      const interactionStart = Date.now();
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      const interactionTime = Date.now() - interactionStart;

      expect(interactionTime).toBeLessThan(1000);
    });
  });

  test.describe('Lighthouse Audits', () => {
    test('should pass Lighthouse performance audit', async () => {
      const lhr = await runLighthouseAudit(BASE_URL);
      
      // Performance score should be above 80
      expect(lhr.categories.performance.score).toBeGreaterThan(0.8);
      
      // Core Web Vitals
      const fcp = lhr.audits['first-contentful-paint'].numericValue;
      const lcp = lhr.audits['largest-contentful-paint'].numericValue;
      const cls = lhr.audits['cumulative-layout-shift'].numericValue;
      const tbt = lhr.audits['total-blocking-time'].numericValue;

      expect(fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint);
      expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.largestContentfulPaint);
      expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift);
      expect(tbt).toBeLessThan(PERFORMANCE_THRESHOLDS.totalBlockingTime);
    });

    test('should pass Lighthouse accessibility audit', async () => {
      const lhr = await runLighthouseAudit(BASE_URL);
      
      // Accessibility score should be above 90
      expect(lhr.categories.accessibility.score).toBeGreaterThan(0.9);
    });

    test('should pass Lighthouse best practices audit', async () => {
      const lhr = await runLighthouseAudit(BASE_URL);
      
      // Best practices score should be above 90
      expect(lhr.categories['best-practices'].score).toBeGreaterThan(0.9);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto(BASE_URL);
      
      // Should show loading states
      await expect(page.locator('[data-testid="loading-skeleton"]')).toBeVisible();
      
      await page.waitForSelector('[data-testid="instance-table"]');
      const loadTime = Date.now() - startTime;

      // Should still be usable on slow networks
      expect(loadTime).toBeLessThan(10000);
    });

    test('should cache resources effectively', async ({ page }) => {
      // First visit
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Second visit should use cached resources
      const cachedResponses: string[] = [];
      
      page.on('response', response => {
        if (response.fromServiceWorker() || response.status() === 304) {
          cachedResponses.push(response.url());
        }
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should have cached responses
      expect(cachedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should maintain 60fps during animations', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceData = {
          frames: [],
          startTime: performance.now(),
        };

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              (window as any).performanceData.frames.push(entry.duration);
            }
          }
        });
        observer.observe({ entryTypes: ['measure'] });
      });

      // Trigger animations by opening/closing modal multiple times
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="create-instance-button"]');
        await page.waitForSelector('[data-testid="create-instance-modal"]');
        await page.keyboard.press('Escape');
        await page.waitForSelector('[data-testid="create-instance-modal"]', { state: 'hidden' });
      }

      const performanceData = await page.evaluate(() => {
        return (window as any).performanceData;
      });

      // Calculate average frame time
      if (performanceData.frames.length > 0) {
        const avgFrameTime = performanceData.frames.reduce((a: number, b: number) => a + b, 0) / performanceData.frames.length;
        
        // Should maintain close to 60fps (16.67ms per frame)
        expect(avgFrameTime).toBeLessThan(20);
      }
    });

    test('should handle rapid state changes efficiently', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();

      // Rapid filter changes
      for (let i = 0; i < 20; i++) {
        await page.fill('[data-testid="search-input"]', `search-${i}`);
        await page.waitForTimeout(50);
      }

      await page.fill('[data-testid="search-input"]', '');
      await page.waitForTimeout(300); // Wait for debounce

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle rapid changes without blocking
      expect(totalTime).toBeLessThan(5000);
      
      // UI should still be responsive
      await expect(page.locator('[data-testid="instance-table"]')).toBeVisible();
    });
  });

  test.describe('Resource Optimization', () => {
    test('should lazy load non-critical components', async ({ page }) => {
      const loadedModules: string[] = [];
      
      page.on('response', response => {
        if (response.url().includes('chunk') && response.url().includes('.js')) {
          loadedModules.push(response.url());
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const initialModules = loadedModules.length;

      // Trigger lazy loading by opening modal
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      // Should load additional modules for modal
      expect(loadedModules.length).toBeGreaterThan(initialModules);
    });

    test('should optimize images and assets', async ({ page }) => {
      const imageResponses: any[] = [];
      
      page.on('response', response => {
        if (response.url().match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          imageResponses.push({
            url: response.url(),
            size: response.headers()['content-length'],
            type: response.headers()['content-type'],
          });
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check image optimization
      for (const image of imageResponses) {
        const size = parseInt(image.size) || 0;
        
        // Images should be reasonably sized
        expect(size).toBeLessThan(100 * 1024); // 100KB max per image
        
        // Should prefer modern formats
        if (image.type) {
          expect(['image/webp', 'image/svg+xml', 'image/png'].some(type => 
            image.type.includes(type)
          )).toBe(true);
        }
      }
    });
  });
});