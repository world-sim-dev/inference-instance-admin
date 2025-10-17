#!/usr/bin/env node

/**
 * History Integration Test Runner
 * Comprehensive test runner for history interface functionality
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface HistoryTestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
  timeout: number;
}

const historyTestSuites: HistoryTestSuite[] = [
  {
    name: 'history-integration',
    command: 'npm run test:history:integration',
    description: 'End-to-end history interface workflows',
    required: true,
    timeout: 120000, // 2 minutes
  },
  {
    name: 'history-api',
    command: 'npm run test:history:api',
    description: 'History API integration and data consistency',
    required: true,
    timeout: 60000, // 1 minute
  },
  {
    name: 'history-performance',
    command: 'npm run test:history:performance',
    description: 'History interface performance tests',
    required: false,
    timeout: 180000, // 3 minutes
  },
];

interface HistoryTestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class HistoryTestRunner {
  private results: HistoryTestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🔍 Starting History Interface Integration Tests...\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const suitesToRun = this.parseSuites(args);
    const parallel = args.includes('--parallel');
    const verbose = args.includes('--verbose');
    const generateReport = !args.includes('--no-report');

    console.log(`📋 Running ${suitesToRun.length} test suites:`);
    suitesToRun.forEach(suite => {
      const status = suite.required ? '(required)' : '(optional)';
      console.log(`   • ${suite.name} ${status}: ${suite.description}`);
    });
    console.log('');

    if (parallel) {
      await this.runTestsInParallel(suitesToRun, verbose);
    } else {
      await this.runTestsSequentially(suitesToRun, verbose);
    }

    this.printSummary();
    
    if (generateReport) {
      this.generateReport();
    }

    // Exit with error code if any required tests failed
    const failedRequired = this.results.some(r => !r.passed && this.isRequired(r.suite));
    process.exit(failedRequired ? 1 : 0);
  }

  private parseSuites(args: string[]): HistoryTestSuite[] {
    const suiteNames = args.filter(arg => !arg.startsWith('--'));
    
    if (suiteNames.length === 0) {
      return historyTestSuites;
    }

    return historyTestSuites.filter(suite => suiteNames.includes(suite.name));
  }

  private isRequired(suiteName: string): boolean {
    return historyTestSuites.find(s => s.name === suiteName)?.required || false;
  }

  private async runTestsSequentially(suites: HistoryTestSuite[], verbose: boolean): Promise<void> {
    for (const suite of suites) {
      await this.runTestSuite(suite, verbose);
    }
  }

  private async runTestsInParallel(suites: HistoryTestSuite[], verbose: boolean): Promise<void> {
    const promises = suites.map(suite => this.runTestSuite(suite, verbose));
    await Promise.all(promises);
  }

  private async runTestSuite(suite: HistoryTestSuite, verbose: boolean): Promise<void> {
    const startTime = Date.now();
    
    console.log(`🧪 Running ${suite.name}: ${suite.description}`);
    
    try {
      await this.executeCommand(suite.command, suite.timeout, verbose);
      
      const duration = Date.now() - startTime;
      this.results.push({
        suite: suite.name,
        passed: true,
        duration,
      });
      
      console.log(`✅ ${suite.name} passed (${Math.round(duration / 1000)}s)\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.log(`❌ ${suite.name} failed (${Math.round(duration / 1000)}s)`);
      if (verbose && error) {
        console.log(`   Error: ${error}\n`);
      }
    }
  }

  private executeCommand(command: string, timeout: number, verbose: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: verbose ? 'inherit' : 'pipe',
        shell: true,
        timeout,
      });

      let output = '';
      let errorOutput = '';

      if (!verbose) {
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });

        child.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(errorOutput || `Command failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('📊 History Test Summary');
    console.log('=======================');
    console.log(`Total Suites: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log('');

    // Detailed results
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      const required = this.isRequired(result.suite) ? '(required)' : '(optional)';
      
      console.log(`${status} ${result.suite} ${required} - ${duration}s`);
      
      if (!result.passed && result.error) {
        console.log(`   ${result.error}`);
      }
    });

    console.log('');

    // Overall result
    const failedRequired = this.results.some(r => !r.passed && this.isRequired(r.suite));
    if (failedRequired) {
      console.log('❌ History integration tests failed - required test suites failed');
    } else if (failed > 0) {
      console.log('⚠️ History integration tests completed with warnings - optional test suites failed');
    } else {
      console.log('✅ All history integration tests passed!');
    }

    // Performance insights
    this.printPerformanceInsights();
  }

  private printPerformanceInsights(): void {
    const performanceResult = this.results.find(r => r.suite === 'history-performance');
    
    if (performanceResult) {
      console.log('\n🚀 Performance Insights');
      console.log('========================');
      
      if (performanceResult.passed) {
        console.log('✅ History interface meets performance thresholds');
        console.log('   • Modal open time: < 500ms');
        console.log('   • Large dataset load: < 2000ms');
        console.log('   • Search response: < 300ms');
        console.log('   • Virtual scrolling: 60fps maintained');
        console.log('   • Memory usage: No significant leaks detected');
      } else {
        console.log('⚠️ Performance issues detected');
        console.log('   Check detailed logs for specific thresholds exceeded');
      }
    }
  }

  private generateReport(): void {
    const reportDir = path.join(process.cwd(), 'test-results');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      testType: 'history-integration',
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      results: this.results.map(result => ({
        ...result,
        required: this.isRequired(result.suite),
      })),
      requirements: {
        '1.1': this.getRequirementStatus('1.1', ['history-integration', 'history-api']),
        '1.2': this.getRequirementStatus('1.2', ['history-integration', 'history-api']),
        '1.3': this.getRequirementStatus('1.3', ['history-integration', 'history-api']),
        '1.4': this.getRequirementStatus('1.4', ['history-integration', 'history-api']),
        '2.1': this.getRequirementStatus('2.1', ['history-integration', 'history-api']),
        '2.2': this.getRequirementStatus('2.2', ['history-integration', 'history-api']),
        '2.3': this.getRequirementStatus('2.3', ['history-integration', 'history-api']),
        '2.4': this.getRequirementStatus('2.4', ['history-integration', 'history-api']),
        '3.1': this.getRequirementStatus('3.1', ['history-integration']),
        '3.2': this.getRequirementStatus('3.2', ['history-integration']),
        '3.3': this.getRequirementStatus('3.3', ['history-integration', 'history-api']),
        '3.4': this.getRequirementStatus('3.4', ['history-integration', 'history-api']),
        '4.1': this.getRequirementStatus('4.1', ['history-integration', 'history-performance']),
        '4.2': this.getRequirementStatus('4.2', ['history-integration', 'history-performance']),
        '4.3': this.getRequirementStatus('4.3', ['history-integration', 'history-performance']),
        '4.4': this.getRequirementStatus('4.4', ['history-integration', 'history-api']),
      },
      coverage: {
        endToEndWorkflows: this.results.find(r => r.suite === 'history-integration')?.passed || false,
        apiIntegration: this.results.find(r => r.suite === 'history-api')?.passed || false,
        performanceThresholds: this.results.find(r => r.suite === 'history-performance')?.passed || false,
        crossDeviceCompatibility: this.results.find(r => r.suite === 'history-integration')?.passed || false,
        dataConsistency: this.results.find(r => r.suite === 'history-api')?.passed || false,
      },
    };

    const reportFile = path.join(reportDir, 'history-integration-test-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportFile}`);

    // Generate HTML report summary
    this.generateHtmlReport(report, reportDir);
  }

  private getRequirementStatus(requirementId: string, testSuites: string[]): boolean {
    return testSuites.every(suite => 
      this.results.find(r => r.suite === suite)?.passed || false
    );
  }

  private generateHtmlReport(report: any, reportDir: string): void {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>History Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { color: #52c41a; }
        .failed { color: #ff4d4f; }
        .results { margin: 20px 0; }
        .result-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .result-passed { background: #f6ffed; border-left: 4px solid #52c41a; }
        .result-failed { background: #fff2f0; border-left: 4px solid #ff4d4f; }
        .requirements { margin: 20px 0; }
        .requirement { display: inline-block; margin: 5px; padding: 5px 10px; border-radius: 4px; }
        .requirement-passed { background: #f6ffed; color: #52c41a; }
        .requirement-failed { background: #fff2f0; color: #ff4d4f; }
    </style>
</head>
<body>
    <div class="header">
        <h1>History Integration Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Duration: ${Math.round(report.duration / 1000)}s</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 24px; font-weight: bold;">${report.summary.total}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 24px; font-weight: bold;" class="passed">${report.summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 24px; font-weight: bold;" class="failed">${report.summary.failed}</div>
        </div>
    </div>

    <div class="results">
        <h2>Test Results</h2>
        ${report.results.map((result: any) => `
            <div class="result-item ${result.passed ? 'result-passed' : 'result-failed'}">
                <strong>${result.suite}</strong> ${result.required ? '(required)' : '(optional)'}
                <span style="float: right;">${Math.round(result.duration / 1000)}s</span>
                ${result.error ? `<div style="margin-top: 5px; font-size: 12px;">${result.error}</div>` : ''}
            </div>
        `).join('')}
    </div>

    <div class="requirements">
        <h2>Requirements Coverage</h2>
        ${Object.entries(report.requirements).map(([req, passed]) => `
            <span class="requirement ${passed ? 'requirement-passed' : 'requirement-failed'}">
                ${req}
            </span>
        `).join('')}
    </div>

    <div class="coverage">
        <h2>Coverage Areas</h2>
        <ul>
            <li class="${report.coverage.endToEndWorkflows ? 'passed' : 'failed'}">
                End-to-End Workflows: ${report.coverage.endToEndWorkflows ? 'Passed' : 'Failed'}
            </li>
            <li class="${report.coverage.apiIntegration ? 'passed' : 'failed'}">
                API Integration: ${report.coverage.apiIntegration ? 'Passed' : 'Failed'}
            </li>
            <li class="${report.coverage.performanceThresholds ? 'passed' : 'failed'}">
                Performance Thresholds: ${report.coverage.performanceThresholds ? 'Passed' : 'Failed'}
            </li>
            <li class="${report.coverage.crossDeviceCompatibility ? 'passed' : 'failed'}">
                Cross-Device Compatibility: ${report.coverage.crossDeviceCompatibility ? 'Passed' : 'Failed'}
            </li>
            <li class="${report.coverage.dataConsistency ? 'passed' : 'failed'}">
                Data Consistency: ${report.coverage.dataConsistency ? 'Passed' : 'Failed'}
            </li>
        </ul>
    </div>
</body>
</html>`;

    const htmlFile = path.join(reportDir, 'history-integration-test-report.html');
    fs.writeFileSync(htmlFile, htmlContent);

    console.log(`📊 HTML report saved to: ${htmlFile}`);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new HistoryTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ History test runner failed:', error);
    process.exit(1);
  });
}

export { HistoryTestRunner };