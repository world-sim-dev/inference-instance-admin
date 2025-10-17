/**
 * Global Teardown for Integration Tests
 * Runs once after all tests complete
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for integration tests...');
  
  try {
    // Clean up test artifacts
    await cleanupTestArtifacts();
    
    // Generate test summary
    await generateTestSummary();
    
    // Clean up any test data
    await cleanupTestData();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here as it might mask test failures
  }
}

async function cleanupTestArtifacts() {
  console.log('🗑️ Cleaning up test artifacts...');
  
  try {
    const testResultsDir = path.join(process.cwd(), 'test-results');
    
    // Clean up old screenshots and videos if they exist
    const artifactDirs = ['screenshots', 'videos', 'traces'];
    
    for (const dir of artifactDirs) {
      const fullPath = path.join(testResultsDir, dir);
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath);
        const oldFiles = files.filter(file => {
          const filePath = path.join(fullPath, file);
          const stats = fs.statSync(filePath);
          const dayInMs = 24 * 60 * 60 * 1000;
          return Date.now() - stats.mtime.getTime() > dayInMs; // Older than 1 day
        });
        
        for (const file of oldFiles) {
          fs.unlinkSync(path.join(fullPath, file));
        }
        
        if (oldFiles.length > 0) {
          console.log(`🗑️ Cleaned up ${oldFiles.length} old files from ${dir}`);
        }
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Could not clean up test artifacts:', error);
  }
}

async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  try {
    const testResultsDir = path.join(process.cwd(), 'test-results');
    const resultsFile = path.join(testResultsDir, 'integration-results.json');
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      
      const summary = {
        timestamp: new Date().toISOString(),
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        suites: results.suites?.map((suite: any) => ({
          title: suite.title,
          tests: suite.tests?.length || 0,
          passed: suite.tests?.filter((t: any) => t.outcome === 'passed').length || 0,
          failed: suite.tests?.filter((t: any) => t.outcome === 'failed').length || 0,
        })) || [],
      };
      
      const summaryFile = path.join(testResultsDir, 'test-summary.json');
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
      
      console.log('📊 Test Summary:');
      console.log(`   Total: ${summary.total}`);
      console.log(`   Passed: ${summary.passed}`);
      console.log(`   Failed: ${summary.failed}`);
      console.log(`   Skipped: ${summary.skipped}`);
      console.log(`   Duration: ${Math.round(summary.duration / 1000)}s`);
      
      if (summary.failed > 0) {
        console.log('❌ Some tests failed. Check the detailed report for more information.');
      } else {
        console.log('✅ All tests passed!');
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error);
  }
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Clean up any test databases, files, or external resources
    // This would be specific to your application's needs
    
    // Example: Clean up test files
    const tempDir = path.join(process.cwd(), 'temp-test-files');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('🗑️ Cleaned up temporary test files');
    }
    
    // Example: Reset test database
    // await resetTestDatabase();
    
  } catch (error) {
    console.warn('⚠️ Could not clean up test data:', error);
  }
}

export default globalTeardown;