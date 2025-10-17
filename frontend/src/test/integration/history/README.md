# History Interface Integration Tests

This directory contains comprehensive integration tests for the history interface enhancement feature. The tests cover end-to-end user workflows, API integration, performance characteristics, and cross-device compatibility.

## Test Structure

```
history/
├── history-integration.test.ts      # End-to-end user workflows
├── history-api-integration.test.ts  # API integration and data consistency
├── history-performance.test.ts      # Performance and optimization tests
├── run-history-tests.ts            # Comprehensive test runner
└── README.md                       # This file
```

## Test Categories

### 1. End-to-End Integration Tests (`history-integration.test.ts`)

**Purpose**: Test complete user workflows for history functionality
**Coverage**:
- History modal opening and navigation
- History record display and interaction
- Search and filtering functionality
- Record comparison features
- Export and restore operations
- Error handling scenarios
- Cross-device compatibility
- Accessibility compliance

**Requirements Covered**: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4

### 2. API Integration Tests (`history-api-integration.test.ts`)

**Purpose**: Test API client integration and data flow consistency
**Coverage**:
- History data fetching with pagination
- Search and filtering API calls
- Individual record retrieval
- Export and restore operations
- Caching and performance optimization
- Error handling and retry logic
- Real-time updates via WebSocket/SSE
- Data consistency validation

**Requirements Covered**: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.3, 3.4, 4.4

### 3. Performance Tests (`history-performance.test.ts`)

**Purpose**: Ensure history interface meets performance benchmarks
**Coverage**:
- Modal opening performance
- Large dataset handling (1000+ records)
- Virtual scrolling efficiency
- Search response times
- Memory usage and leak detection
- Network optimization
- Frame rate maintenance during animations

**Requirements Covered**: 4.1, 4.2, 4.3

**Performance Thresholds**:
- Modal open time: < 500ms
- History load time: < 2000ms
- Search response: < 300ms
- Virtual scroll frame rate: 60fps
- Memory leak threshold: < 30% increase

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Start the development server:
```bash
npm run dev
```

4. Start the backend API server:
```bash
# In the root directory
python main.py
```

### Running Individual Test Suites

```bash
# All history tests
npm run test:history

# End-to-end integration tests
npm run test:history:integration

# API integration tests
npm run test:history:api

# Performance tests
npm run test:history:performance

# Comprehensive test suite
npm run test:history:comprehensive

# Run tests in parallel
npm run test:history:parallel
```

### Running with Options

```bash
# Run with UI mode
npx playwright test src/test/integration/history --ui

# Run in debug mode
npx playwright test src/test/integration/history --debug

# Run specific test file
npx playwright test src/test/integration/history/history-integration.test.ts

# Run tests in headed mode
npx playwright test src/test/integration/history --headed

# Run with specific browser
npx playwright test src/test/integration/history --project=chromium
```

### Using the History Test Runner

The comprehensive test runner allows running multiple test suites with detailed reporting:

```bash
# Run all history tests
npx ts-node src/test/integration/history/run-history-tests.ts

# Run specific suites
npx ts-node src/test/integration/history/run-history-tests.ts history-integration history-api

# Run tests in parallel
npx ts-node src/test/integration/history/run-history-tests.ts --parallel

# Run with verbose output
npx ts-node src/test/integration/history/run-history-tests.ts --verbose

# Skip report generation
npx ts-node src/test/integration/history/run-history-tests.ts --no-report
```

## Test Configuration

### Environment Variables

```bash
# Application URL (default: http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000

# API URL (default: http://localhost:8000)
VITE_API_BASE_URL=http://localhost:8000

# CI mode
CI=true
```

### Playwright Configuration

The tests use the project's main Playwright configuration with these specific settings:
- **Browsers**: Chrome, Firefox, Safari
- **Devices**: Desktop, Mobile, Tablet
- **Timeouts**: 30s test timeout, 10s action timeout
- **Retries**: 2 retries on CI, 0 locally

## Test Data and Mocking

### Mock Data Factories

The tests use factory functions to generate consistent test data:

```typescript
// Create mock instance
const instance = createMockInstance({ 
  id: 1, 
  name: 'test-instance' 
});

// Create mock history records
const historyRecords = createMockHistoryRecords(10);

// Create large dataset for performance testing
const largeDataset = createLargeHistoryDataset(1000);
```

### API Mocking

Tests use Playwright's route interception to mock API responses:

```typescript
await page.route('**/api/instances/1/history', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockHistoryData),
  });
});
```

## Requirements Mapping

The integration tests fulfill the following requirements from the specification:

### Backend Integration (Requirements 1.x)
- **1.1**: ✅ Automatic history creation on instance updates
- **1.2**: ✅ History creation on instance deletion
- **1.3**: ✅ Data integrity and consistency
- **1.4**: ✅ Transaction completeness

### Data Operations (Requirements 2.x)
- **2.1**: ✅ History record storage and retrieval
- **2.2**: ✅ Operation type tracking
- **2.3**: ✅ Timestamp and metadata recording
- **2.4**: ✅ Query and filtering capabilities

### User Interface (Requirements 3.x)
- **3.1**: ✅ History record display and navigation
- **3.2**: ✅ Detailed record viewing
- **3.3**: ✅ Search and filtering functionality
- **3.4**: ✅ Record comparison features

### Performance and UX (Requirements 4.x)
- **4.1**: ✅ Loading states and user feedback
- **4.2**: ✅ Performance optimization
- **4.3**: ✅ Responsive design
- **4.4**: ✅ Error handling and recovery

## Test Reports

### Automated Reporting

The test runner generates comprehensive reports:

- **JSON Report**: `test-results/history-integration-test-report.json`
- **HTML Report**: `test-results/history-integration-test-report.html`
- **Playwright Report**: `test-results/index.html`

### Report Contents

- Test execution summary
- Individual test results
- Requirements coverage mapping
- Performance metrics
- Error details and stack traces
- Screenshots and videos for failed tests

## Continuous Integration

### GitHub Actions Integration

```yaml
name: History Integration Tests

on: [push, pull_request]

jobs:
  history-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start backend server
        run: |
          python -m pip install -r requirements.txt
          python main.py &
          sleep 10
      
      - name: Run history integration tests
        run: npm run test:history:comprehensive
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: history-test-results
          path: test-results/
```

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode to see tests in browser
npm run test:history --ui

# Run in debug mode with step-by-step execution
npx playwright test src/test/integration/history --debug

# Run in headed mode to see browser
npx playwright test src/test/integration/history --headed
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots on failure
- Videos of the entire test run
- Traces for detailed debugging

Access these in the `test-results/` directory.

### Common Issues

1. **API Server Not Running**: Ensure the backend server is started before running tests
2. **Port Conflicts**: Check that ports 3000 and 8000 are available
3. **Timeouts**: Increase timeout values for slow environments
4. **Mock Data**: Ensure mock responses match actual API format
5. **Browser Issues**: Try running with different browsers using `--project` flag

## Best Practices

### Test Writing

1. **Use data-testid attributes** for reliable element selection
2. **Wait for network idle** before assertions
3. **Mock external dependencies** for consistent results
4. **Test error states** and edge cases
5. **Keep tests independent** and idempotent

### Performance

1. **Run tests in parallel** when possible
2. **Use beforeEach hooks** for common setup
3. **Clean up resources** in afterEach hooks
4. **Optimize test data** size for faster execution

### Maintenance

1. **Update selectors** when UI changes
2. **Review test coverage** regularly
3. **Monitor test execution time** and optimize slow tests
4. **Keep dependencies updated** for security and features

## Contributing

When adding new history integration tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate test data and mocking
3. Include both positive and negative test cases
4. Update this README with new test categories or requirements
5. Ensure tests pass in all supported browsers and devices
6. Add performance benchmarks for new features
7. Update the requirements mapping as needed

## Troubleshooting

### Test Failures

1. **Check server status**: Ensure both frontend and backend servers are running
2. **Verify API responses**: Check that mock data matches expected format
3. **Review browser console**: Look for JavaScript errors or network issues
4. **Check test artifacts**: Review screenshots and videos in test-results/
5. **Run individual tests**: Isolate failing tests to identify root cause

### Performance Issues

1. **Monitor resource usage**: Check CPU and memory during test execution
2. **Optimize test data**: Reduce dataset sizes if tests are too slow
3. **Parallel execution**: Use `--parallel` flag for faster execution
4. **Browser selection**: Some browsers may be faster for specific tests

### Environment Issues

1. **Node version**: Ensure Node.js 18+ is installed
2. **Dependencies**: Run `npm ci` to ensure clean dependency installation
3. **Playwright browsers**: Run `npx playwright install` to update browsers
4. **Port availability**: Check that required ports are not in use