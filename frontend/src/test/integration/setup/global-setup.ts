/**
 * Global Setup for Integration Tests
 * Runs once before all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for integration tests...');
  
  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log(`📡 Checking if application is ready at ${baseURL}`);
    
    // Retry connection with exponential backoff
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        
        // Check if the app has loaded by looking for a key element
        await page.waitForSelector('[data-testid="app-root"], #root', { timeout: 5000 });
        console.log('✅ Application is ready');
        break;
      } catch (error) {
        retries++;
        const delay = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`⏳ Application not ready, retrying in ${delay}ms (attempt ${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        if (retries === maxRetries) {
          throw new Error(`Application failed to start after ${maxRetries} attempts`);
        }
      }
    }
    
    // Perform any additional setup tasks
    await setupTestData(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestData(page: any) {
  // Setup test data or mock services if needed
  console.log('📝 Setting up test data...');
  
  // Example: Clear any existing test data
  try {
    await page.evaluate(() => {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB if used
      if ('indexedDB' in window) {
        // This would need more specific implementation based on your app
      }
    });
    
    console.log('🧹 Cleared browser storage');
  } catch (error) {
    console.warn('⚠️ Could not clear browser storage:', error);
  }
  
  // Example: Set up test environment variables
  await page.addInitScript(() => {
    window.__TEST_MODE__ = true;
    window.__TEST_START_TIME__ = Date.now();
  });
  
  console.log('✅ Test data setup completed');
}

export default globalSetup;