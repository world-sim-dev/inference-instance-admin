/**
 * Responsive Design Tests
 * Tests responsive behavior across different device sizes
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Device configurations
const devices = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

// Helper functions
const setViewportSize = async (page: Page, device: keyof typeof devices) => {
  await page.setViewportSize(devices[device]);
};

const waitForLayoutStabilization = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Allow for CSS transitions
};

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/instances', async (route) => {
      const mockInstances = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `instance-${i + 1}`,
        model_name: `model-${i + 1}`,
        cluster_name: i % 2 === 0 ? 'cluster-a' : 'cluster-b',
        status: i % 3 === 0 ? 'inactive' : 'active',
        created_at: new Date().toISOString(),
      }));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockInstances),
      });
    });

    await page.goto(BASE_URL);
  });

  test.describe('Layout Adaptation', () => {
    test('should adapt layout for mobile devices', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Check mobile-specific layout
      await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
      
      // Table should switch to card view on mobile
      await expect(page.locator('[data-testid="instance-cards"]')).toBeVisible();
      await expect(page.locator('[data-testid="instance-table"]')).not.toBeVisible();
      
      // Navigation should be collapsed
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    });

    test('should adapt layout for tablet devices', async ({ page }) => {
      await setViewportSize(page, 'tablet');
      await waitForLayoutStabilization(page);

      // Check tablet-specific layout
      await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
      
      // Should show grid view on tablet
      await expect(page.locator('[data-testid="instance-grid"]')).toBeVisible();
      
      // Some columns might be hidden
      const visibleColumns = await page.locator('[data-testid="table-column"]').count();
      expect(visibleColumns).toBeLessThan(10); // Fewer than desktop
    });

    test('should show full layout on desktop', async ({ page }) => {
      await setViewportSize(page, 'desktop');
      await waitForLayoutStabilization(page);

      // Check desktop layout
      await expect(page.locator('[data-testid="desktop-layout"]')).toBeVisible();
      
      // Full table should be visible
      await expect(page.locator('[data-testid="instance-table"]')).toBeVisible();
      
      // All columns should be visible
      const visibleColumns = await page.locator('[data-testid="table-column"]').count();
      expect(visibleColumns).toBeGreaterThan(8);
    });
  });

  test.describe('Cross-Device Compatibility', () => {
    test('should work on various mobile devices', async ({ page }) => {
      const mobileDevices = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'Samsung Galaxy S21', width: 360, height: 800 },
        { name: 'Google Pixel 5', width: 393, height: 851 },
      ];

      for (const device of mobileDevices) {
        await test.step(`Test on ${device.name}`, async () => {
          await page.setViewportSize({ width: device.width, height: device.height });
          await waitForLayoutStabilization(page);

          // Verify core functionality works
          await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
          await expect(page.locator('[data-testid="instance-cards"]')).toBeVisible();

          // Test touch interactions
          const firstCard = page.locator('[data-testid="instance-card-1"]');
          if (await firstCard.isVisible()) {
            await firstCard.tap();
            await expect(page.locator('[data-testid="instance-details"]')).toBeVisible();
          }
        });
      }
    });

    test('should work on various tablet devices', async ({ page }) => {
      const tabletDevices = [
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'iPad Pro', width: 1024, height: 1366 },
        { name: 'Surface Pro', width: 912, height: 1368 },
        { name: 'Galaxy Tab', width: 800, height: 1280 },
      ];

      for (const device of tabletDevices) {
        await test.step(`Test on ${device.name}`, async () => {
          await page.setViewportSize({ width: device.width, height: device.height });
          await waitForLayoutStabilization(page);

          // Verify tablet-optimized layout
          await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
          
          // Should show grid or hybrid view
          const gridVisible = await page.locator('[data-testid="instance-grid"]').isVisible();
          const tableVisible = await page.locator('[data-testid="instance-table"]').isVisible();
          expect(gridVisible || tableVisible).toBe(true);
        });
      }
    });
  });

  test.describe('Component Responsiveness', () => {
    test('should adapt form layout for different screen sizes', async ({ page }) => {
      // Open create modal
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      // Test mobile form layout
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);
      
      // Form should stack vertically on mobile
      const formCols = await page.locator('.ant-col').count();
      const singleColumnCols = await page.locator('.ant-col-24').count();
      expect(singleColumnCols).toBeGreaterThan(formCols * 0.7); // Most columns should be full width

      // Test desktop form layout
      await setViewportSize(page, 'desktop');
      await waitForLayoutStabilization(page);
      
      // Form should use multiple columns on desktop
      const multiColumnCols = await page.locator('.ant-col-12, .ant-col-8, .ant-col-6').count();
      expect(multiColumnCols).toBeGreaterThan(0);
    });

    test('should adapt table columns based on screen size', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Mobile should hide non-essential columns
      await expect(page.locator('[data-testid="column-created-at"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="column-description"]')).not.toBeVisible();

      await setViewportSize(page, 'tablet');
      await waitForLayoutStabilization(page);

      // Tablet should show more columns
      await expect(page.locator('[data-testid="column-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-cluster"]')).toBeVisible();

      await setViewportSize(page, 'desktop');
      await waitForLayoutStabilization(page);

      // Desktop should show all columns
      await expect(page.locator('[data-testid="column-created-at"]')).toBeVisible();
      await expect(page.locator('[data-testid="column-description"]')).toBeVisible();
    });

    test('should adapt modal size for different screens', async ({ page }) => {
      // Test mobile modal
      await setViewportSize(page, 'mobile');
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      const mobileModal = page.locator('[data-testid="create-instance-modal"]');
      const mobileModalBox = await mobileModal.boundingBox();
      
      // Modal should be nearly full screen on mobile
      expect(mobileModalBox?.width).toBeGreaterThan(devices.mobile.width * 0.9);

      await page.keyboard.press('Escape');

      // Test desktop modal
      await setViewportSize(page, 'desktop');
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      const desktopModal = page.locator('[data-testid="create-instance-modal"]');
      const desktopModalBox = await desktopModal.boundingBox();
      
      // Modal should be smaller relative to screen on desktop
      expect(desktopModalBox?.width).toBeLessThan(devices.desktop.width * 0.8);
    });
  });

  test.describe('Touch and Interaction', () => {
    test('should support touch interactions on mobile', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Test touch scrolling
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(200, 200);
      
      // Test swipe gestures (if implemented)
      const instanceCard = page.locator('[data-testid="instance-card-1"]');
      if (await instanceCard.isVisible()) {
        const cardBox = await instanceCard.boundingBox();
        if (cardBox) {
          // Swipe left to reveal actions
          await page.touchscreen.tap(cardBox.x + cardBox.width - 50, cardBox.y + cardBox.height / 2);
          await page.touchscreen.tap(cardBox.x + 50, cardBox.y + cardBox.height / 2);
        }
      }
    });

    test('should have appropriate touch targets', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Check button sizes meet touch target guidelines (44px minimum)
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test.describe('Content Adaptation', () => {
    test('should truncate text appropriately on small screens', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Long text should be truncated with ellipsis
      const textElements = await page.locator('[data-testid*="text-content"]').all();
      
      for (const element of textElements) {
        if (await element.isVisible()) {
          const styles = await element.evaluate(el => getComputedStyle(el));
          if (styles.textOverflow === 'ellipsis') {
            expect(styles.whiteSpace).toBe('nowrap');
            expect(styles.overflow).toBe('hidden');
          }
        }
      }
    });

    test('should show/hide content based on screen size', async ({ page }) => {
      // Test content visibility on mobile
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      await expect(page.locator('[data-testid="desktop-only-content"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="mobile-visible-content"]')).toBeVisible();

      // Test content visibility on desktop
      await setViewportSize(page, 'desktop');
      await waitForLayoutStabilization(page);

      await expect(page.locator('[data-testid="desktop-only-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-only-content"]')).not.toBeVisible();
    });
  });

  test.describe('Performance on Different Devices', () => {
    test('should maintain performance on mobile devices', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      
      // Simulate slower mobile performance
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await waitForLayoutStabilization(page);
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time on mobile
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle orientation changes', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await waitForLayoutStabilization(page);

      const portraitLayout = await page.locator('[data-testid="main-content"]').boundingBox();

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await waitForLayoutStabilization(page);

      const landscapeLayout = await page.locator('[data-testid="main-content"]').boundingBox();

      // Layout should adapt to orientation change
      expect(landscapeLayout?.width).toBeGreaterThan(portraitLayout?.width || 0);
      expect(landscapeLayout?.height).toBeLessThan(portraitLayout?.height || 0);
    });
  });

  test.describe('Accessibility on Different Devices', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Check focus management
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Check that focus indicators are visible
      const focusedBox = await focusedElement.boundingBox();
      expect(focusedBox).toBeTruthy();
    });

    test('should support screen reader navigation', async ({ page }) => {
      await setViewportSize(page, 'mobile');
      await waitForLayoutStabilization(page);

      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check for landmark regions
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    });
  });
});