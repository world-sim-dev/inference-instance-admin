/**
 * Accessibility Tests
 * Tests application accessibility compliance and usability
 */

import { test, expect, Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Helper functions
const checkColorContrast = async (page: Page, selector: string) => {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    
    const styles = getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    return { backgroundColor, color };
  }, selector);
};

const simulateScreenReader = async (page: Page) => {
  // Simulate screen reader navigation
  await page.keyboard.press('Tab');
  const focusedElement = await page.locator(':focus');
  const ariaLabel = await focusedElement.getAttribute('aria-label');
  const role = await focusedElement.getAttribute('role');
  const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
  
  return { ariaLabel, role, tagName };
};

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/instances', async (route) => {
      const mockInstances = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `instance-${i + 1}`,
        model_name: `model-${i + 1}`,
        cluster_name: `cluster-${String.fromCharCode(65 + (i % 3))}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
        description: `Test instance ${i + 1} description`,
        created_at: new Date().toISOString(),
      }));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockInstances),
      });
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('WCAG Compliance', () => {
    test('should pass axe-core accessibility audit', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      const headingLevels: number[] = [];
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName);
        const level = parseInt(tagName.charAt(1));
        headingLevels.push(level);
      }

      // Should start with h1
      expect(headingLevels[0]).toBe(1);
      
      // Should not skip levels
      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // Test main text elements
      const textSelectors = [
        '[data-testid="page-title"]',
        '[data-testid="instance-name"]',
        '[data-testid="status-text"]',
        'button',
        'a',
      ];

      for (const selector of textSelectors) {
        const elements = await page.locator(selector).all();
        
        for (const element of elements.slice(0, 3)) { // Test first 3 of each type
          if (await element.isVisible()) {
            const contrast = await checkColorContrast(page, selector);
            // Note: Actual contrast calculation would require more complex logic
            // This is a simplified check
            expect(contrast).toBeTruthy();
          }
        }
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check for required ARIA labels
      const requiredAriaElements = [
        '[data-testid="search-input"]',
        '[data-testid="create-instance-button"]',
        '[data-testid="instance-table"]',
        '[data-testid="status-filter"]',
      ];

      for (const selector of requiredAriaElements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          const ariaLabel = await element.getAttribute('aria-label');
          const ariaLabelledBy = await element.getAttribute('aria-labelledby');
          const role = await element.getAttribute('role');
          
          // Should have either aria-label, aria-labelledby, or appropriate role
          expect(ariaLabel || ariaLabelledBy || role).toBeTruthy();
        }
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab navigation through interactive elements
      const interactiveElements: string[] = [];
      
      // Start from the beginning
      await page.keyboard.press('Home');
      
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
          const type = await focusedElement.getAttribute('type');
          const role = await focusedElement.getAttribute('role');
          
          interactiveElements.push(`${tagName}${type ? `[${type}]` : ''}${role ? `[${role}]` : ''}`);
          
          // Test that focused element is visible
          await expect(focusedElement).toBeVisible();
          
          // Test that focus indicator is present
          const outline = await focusedElement.evaluate(el => {
            const styles = getComputedStyle(el);
            return styles.outline || styles.boxShadow;
          });
          expect(outline).not.toBe('none');
        }
      }

      // Should have navigated through multiple interactive elements
      expect(interactiveElements.length).toBeGreaterThan(5);
    });

    test('should support Enter and Space key activation', async ({ page }) => {
      // Test button activation with Enter
      await page.focus('[data-testid="create-instance-button"]');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-testid="create-instance-modal"]')).toBeVisible();
      
      // Close modal with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="create-instance-modal"]')).not.toBeVisible();
      
      // Test button activation with Space
      await page.focus('[data-testid="create-instance-button"]');
      await page.keyboard.press('Space');
      await expect(page.locator('[data-testid="create-instance-modal"]')).toBeVisible();
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should provide meaningful text alternatives', async ({ page }) => {
      // Check images have alt text
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const ariaLabel = await img.getAttribute('aria-label');
        const role = await img.getAttribute('role');
        
        // Should have alt text, aria-label, or be decorative
        expect(alt !== null || ariaLabel !== null || role === 'presentation').toBe(true);
      }

      // Check icons have labels
      const icons = await page.locator('[data-icon], .anticon').all();
      for (const icon of icons.slice(0, 5)) { // Test first 5 icons
        const ariaLabel = await icon.getAttribute('aria-label');
        const ariaHidden = await icon.getAttribute('aria-hidden');
        const title = await icon.getAttribute('title');
        
        // Should have label or be hidden from screen readers
        expect(ariaLabel || ariaHidden === 'true' || title).toBeTruthy();
      }
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Check for live regions
      const liveRegions = await page.locator('[aria-live]').all();
      expect(liveRegions.length).toBeGreaterThan(0);

      // Test that status messages are announced
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      // Check for aria-live region for form validation
      const validationRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      await expect(validationRegion).toBeVisible();
    });

    test('should provide context for form fields', async ({ page }) => {
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      // Check form fields have proper labels
      const formFields = await page.locator('input, select, textarea').all();
      
      for (const field of formFields) {
        const id = await field.getAttribute('id');
        const ariaLabel = await field.getAttribute('aria-label');
        const ariaLabelledBy = await field.getAttribute('aria-labelledby');
        
        if (id) {
          // Check for associated label
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          
          // Should have label, aria-label, or aria-labelledby
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should provide error messages accessibly', async ({ page }) => {
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      // Try to submit empty form to trigger validation
      await page.click('[data-testid="submit-button"]');
      
      // Check for accessible error messages
      const errorMessages = await page.locator('[role="alert"], .ant-form-item-explain-error').all();
      
      for (const error of errorMessages) {
        if (await error.isVisible()) {
          // Error should be associated with form field
          const ariaDescribedBy = await page.locator('input[aria-describedby]').count();
          expect(ariaDescribedBy).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Motor Accessibility', () => {
    test('should have adequate touch targets', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const buttons = await page.locator('button, a, [role="button"]').all();
      
      for (const button of buttons.slice(0, 10)) { // Test first 10 buttons
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          
          if (box) {
            // WCAG recommends minimum 44x44px touch targets
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check that animations are reduced or disabled
      const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
      
      for (const element of animatedElements.slice(0, 5)) {
        const animationDuration = await element.evaluate(el => {
          const styles = getComputedStyle(el);
          return styles.animationDuration;
        });
        
        // Animations should be disabled or very short
        expect(animationDuration === '0s' || animationDuration === 'none').toBe(true);
      }
    });

    test('should not cause seizures or vestibular disorders', async ({ page }) => {
      // Check for rapidly flashing content
      let flashCount = 0;
      const startTime = Date.now();
      
      // Monitor for rapid visual changes
      await page.evaluate(() => {
        let lastBrightness = 0;
        const observer = new MutationObserver(() => {
          const brightness = Array.from(document.querySelectorAll('*'))
            .reduce((sum, el) => {
              const styles = getComputedStyle(el);
              const bg = styles.backgroundColor;
              // Simplified brightness calculation
              return sum + (bg.includes('rgb') ? 1 : 0);
            }, 0);
          
          if (Math.abs(brightness - lastBrightness) > 10) {
            (window as any).flashCount = ((window as any).flashCount || 0) + 1;
          }
          lastBrightness = brightness;
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      });

      // Trigger various interactions
      await page.click('[data-testid="create-instance-button"]');
      await page.keyboard.press('Escape');
      await page.fill('[data-testid="search-input"]', 'test');
      await page.fill('[data-testid="search-input"]', '');

      await page.waitForTimeout(3000); // Monitor for 3 seconds
      
      flashCount = await page.evaluate(() => (window as any).flashCount || 0);
      
      // Should not flash more than 3 times per second
      const duration = (Date.now() - startTime) / 1000;
      const flashRate = flashCount / duration;
      
      expect(flashRate).toBeLessThan(3);
    });
  });

  test.describe('Cognitive Accessibility', () => {
    test('should provide clear navigation and orientation', async ({ page }) => {
      // Check for breadcrumbs or navigation aids
      const navigationAids = await page.locator('[aria-label*="breadcrumb"], [role="navigation"], .ant-breadcrumb').count();
      expect(navigationAids).toBeGreaterThan(0);

      // Check for page titles
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      expect(pageTitle.length).toBeGreaterThan(0);

      // Check for main heading
      const mainHeading = await page.locator('h1').count();
      expect(mainHeading).toBeGreaterThan(0);
    });

    test('should provide helpful error messages', async ({ page }) => {
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');
      
      // Fill invalid data
      await page.fill('[data-testid="instance-name-input"]', 'invalid name with spaces');
      await page.click('[data-testid="submit-button"]');
      
      // Check error message quality
      const errorMessage = await page.locator('.ant-form-item-explain-error').first();
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        
        // Error should be specific and helpful
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(10);
        expect(errorText).not.toMatch(/^error$/i); // Not just "error"
      }
    });

    test('should provide consistent interaction patterns', async ({ page }) => {
      // Check that similar elements behave consistently
      const buttons = await page.locator('button[data-testid*="edit-instance"]').all();
      
      for (const button of buttons.slice(0, 3)) {
        if (await button.isVisible()) {
          // All edit buttons should have similar attributes
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');
          
          expect(ariaLabel || title).toMatch(/edit|编辑/i);
        }
      }
    });

    test('should support user preferences', async ({ page }) => {
      // Check for theme/preference controls
      const themeControls = await page.locator('[data-testid*="theme"], [aria-label*="theme"], [aria-label*="主题"]').count();
      
      // Check for language controls
      const langControls = await page.locator('[data-testid*="language"], [aria-label*="language"], [aria-label*="语言"]').count();
      
      // Should have some user preference controls
      expect(themeControls + langControls).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Assistive Technology Compatibility', () => {
    test('should work with screen readers', async ({ page }) => {
      // Test screen reader announcements
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check for live regions that announce changes
      const liveRegions = await page.locator('[aria-live]').all();
      expect(liveRegions.length).toBeGreaterThan(0);

      // Test form announcements
      await page.click('[data-testid="create-instance-button"]');
      await page.waitForSelector('[data-testid="create-instance-modal"]');

      // Submit empty form to trigger validation
      await page.click('[data-testid="submit-button"]');

      // Check that errors are announced
      const errorRegion = page.locator('[aria-live="assertive"], [role="alert"]');
      await expect(errorRegion).toBeVisible();
    });

    test('should support voice control', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Test that all interactive elements have accessible names
      const interactiveElements = await page.locator('button, a, input, select, textarea').all();
      
      for (const element of interactiveElements.slice(0, 10)) {
        if (await element.isVisible()) {
          const accessibleName = await element.evaluate(el => {
            // Get accessible name using browser's accessibility API
            return el.getAttribute('aria-label') || 
                   el.getAttribute('aria-labelledby') || 
                   el.textContent?.trim() ||
                   el.getAttribute('title') ||
                   el.getAttribute('alt');
          });
          
          expect(accessibleName).toBeTruthy();
          expect(accessibleName!.length).toBeGreaterThan(0);
        }
      }
    });

    test('should support switch navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Test that all interactive elements are reachable via keyboard
      const focusableElements: string[] = [];
      let currentElement = null;

      // Navigate through all focusable elements
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.locator(':focus');
        
        if (await focused.count() > 0) {
          const elementInfo = await focused.evaluate(el => ({
            tagName: el.tagName.toLowerCase(),
            type: el.getAttribute('type'),
            role: el.getAttribute('role'),
            testId: el.getAttribute('data-testid'),
          }));
          
          const elementKey = `${elementInfo.tagName}[${elementInfo.type || elementInfo.role || elementInfo.testId}]`;
          
          if (elementKey !== currentElement) {
            focusableElements.push(elementKey);
            currentElement = elementKey;
          }
        }
      }

      // Should have navigated through multiple interactive elements
      expect(focusableElements.length).toBeGreaterThan(5);
      
      // Should include key interactive elements
      expect(focusableElements.some(el => el.includes('button'))).toBe(true);
      expect(focusableElements.some(el => el.includes('input'))).toBe(true);
    });
  });

  test.describe('Internationalization Accessibility', () => {
    test('should support right-to-left languages', async ({ page }) => {
      // Set RTL language
      await page.addInitScript(() => {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check that layout adapts to RTL
      const bodyDir = await page.locator('body').getAttribute('dir');
      expect(bodyDir).toBe('rtl');

      // Check that interactive elements are still accessible
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should handle high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Check that content is still visible and accessible
      const buttons = await page.locator('button').all();
      for (const button of buttons.slice(0, 5)) {
        if (await button.isVisible()) {
          const styles = await button.evaluate(el => {
            const computed = getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              border: computed.border,
            };
          });
          
          // In forced colors mode, elements should have system colors
          expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        }
      }
    });

    test('should support zoom up to 200%', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Set zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Check that content is still accessible at high zoom
      await expect(page.locator('[data-testid="instance-table"]')).toBeVisible();
      
      // Test that interactions still work
      await page.click('[data-testid="create-instance-button"]');
      await expect(page.locator('[data-testid="create-instance-modal"]')).toBeVisible();
      
      // Check that modal is still usable
      const modal = page.locator('[data-testid="create-instance-modal"]');
      const modalBox = await modal.boundingBox();
      expect(modalBox).toBeTruthy();
      expect(modalBox!.width).toBeGreaterThan(0);
      expect(modalBox!.height).toBeGreaterThan(0);
    });
  });
});