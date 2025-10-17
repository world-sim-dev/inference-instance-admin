#!/usr/bin/env node

/**
 * Integration Test Runner
 * Comprehensive test runner for all integration test suites
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  required: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'unit',
    command: 'npm run test',
    description: 'Unit tests with Vitest',
    required: true,
  },
  {
    name: 'e2e',
    command: 'npm run test:e2e',
    description: 'End-to-end user flow tests',
    required: true,
  },
  {
    name: 'api',
    command: 'npm run test:api',
    description: 'API integration and data flow tests',
    required: true,
  },
  {
    name: 'responsive',
    command: 'npm run test:responsive',
    description: 'Responsive design tests',
    required: false,
  },
  {
    name: 'performance',
    command: 'npm run test:performance',
    description: 'Performance and optimization tests',
    required: false,
  },
  {
    name: 'accessibility',
    command: 'npm run test:accessibility',
    description: 'Accessibility compliance tests',
    required: false,
  },
];

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
}

class IntegrationTestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive integration test suite...\n');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const suitesToRun = this.parseSuites(args);
    const parallel = args.includes('--parallel');
    const verbose = args.includes('--verbose');

    if (parallel) {
      await this.runTestsInParallel(suitesToRun, verbose);
    } else {
      await this.runTestsSequentially(suitesToRun, verbose);
    }

    this.printSummary();
    this.generateReport();

    // Exit with error code if any required tests failed
    const failedRequired = this.results.some(r => !r.passed && this.isRequired(r.suite));
    process.exit(failedRequired ? 1 : 0);
  }

  private parseSuites(args: string[]): TestSuite[] {
    const suiteNames = args.filter(arg => !arg.startsWith('--'));
    
    if (suiteNames.length === 0) {
      return testSuites;
    }

    return testSuites.filter(suite => suiteNames.includes(suite.name));
  }

  private isRequired(suiteName: string): boolean {
    return testSuites.find(s => s.name === suiteName)?.required || false;
  }

  private async runTestsSequentially(suites: TestSuite[], verbose: boolean): Promise<void> {
    for (const suite of suites) {
      await this.runTestSuite(suite, verbose);
    }
  }

  private async runTestsInParallel(suites: TestSuite[], verbose: boolean): Promise<void> {
    const promises = suites.map(suite => this.runTestSuite(suite, verbose));
    await Promise.all(promises);
  }

  private async runTestSuite(suite: TestSuite, verbose: boolean): Promise<void> {
    const startTime = Date.now();
    
    console.log(`📋 Running ${suite.name} tests: ${suite.description}`);
    
    try {
      await this.executeCommand(suite.command, verbose);
      
      const duration = Date.now() - startTime;
      this.results.push({
        suite: suite.name,
        passed: true,
        duration,
      });
      
      console.log(`✅ ${suite.name} tests passed (${Math.round(duration / 1000)}s)\n`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      
      console.log(`❌ ${suite.name} tests failed (${Math.round(duration / 1000)}s)`);
      if (verbose && error) {
        console.log(`   Error: ${error}\n`);
      }
    }
  }

  private executeCommand(command: string, verbose: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        stdio: verbose ? 'inherit' : 'pipe',
        shell: true,
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

    console.log('📊 Test Summary');
    console.log('================');
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
      console.log('❌ Integration tests failed - required test suites failed');
    } else if (failed > 0) {
      console.log('⚠️ Integration tests completed with warnings - optional test suites failed');
    } else {
      console.log('✅ All integration tests passed!');
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
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.passed).length,
        failed: this.results.filter(r => !r.passed).length,
      },
      results: this.results.map(result => ({
        ...result,
        required: this.isRequired(result.suite),
      })),
    };

    const reportFile = path.join(reportDir, 'integration-test-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`📄 Detailed report saved to: ${reportFile}`);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner };