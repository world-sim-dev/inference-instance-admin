# Integration Tests

This directory contains comprehensive integration tests for the React frontend application. The tests cover end-to-end user workflows, API integration, responsive design, performance, and accessibility.

## Test Structure

```
integration/
├── e2e/                    # End-to-end user flow tests
├── api/                    # API integration and data flow tests
├── responsive/             # Responsive design tests
├── performance/            # Performance and optimization tests
├── accessibility/          # Accessibility compliance tests
├── setup/                  # Global setup and teardown
└── run-integration-tests.ts # Test runner script
```

## Test Categories

### 1. End-to-End Tests (`e2e/`)
- **Purpose**: Test complete user workflows from start to finish
- **Coverage**: CRUD operations, search/filter, form validation, error handling
- **Requirements**: 2.1, 2.2, 2.3, 2.4

### 2. API Integration Tests (`api/`)
- **Purpose**: Test API client integration and data flow consistency
- **Coverage**: HTTP requests, error handling, caching, optimistic updates
- **Requirements**: 4.1, 4.2, 4.3

### 3. Responsive Design Tests (`responsive/`)
- **Purpose**: Verify responsive behavior across different device sizes
- **Coverage**: Layout adaptation, touch interactions, content adaptation
- **Requirements**: 5.1, 5.2

### 4. Performance Tests (`performance/`)
- **Purpose**: Ensure application meets performance benchmarks
- **Coverage**: Load times, bundle sizes, memory usage, Core Web Vitals
- **Requirements**: 6.3, 7.5

### 5. Accessibility Tests (`accessibility/`)
- **Purpose**: Verify WCAG compliance and accessibility features
- **Coverage**: Screen readers, keyboard navigation, color contrast, ARIA
- **Requirements**: 5.4, 7.5

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

### Running Individual Test Suites

```bash
# End-to-end tests
npm run test:e2e

# API integration tests
npm run test:api

# Responsive design tests
npm run test:responsive

# Performance tests
npm run test:performance

# Accessibility tests
npm run test:accessibility

# All integration tests
npm run test:integration
```

### Running with Options

```bash
# Run with UI mode
npm run test:integration:ui

# Run in debug mode
npm run test:integration:debug

# Run specific test file
npx playwright test user-flows.test.ts

# Run tests in headed mode
npx playwright test --headed

# Run tests with specific browser
npx playwright test --project=chromium
```

### Using the Test Runner

The comprehensive test runner allows running multiple test suites:

```bash
# Run all tests sequentially
npx ts-node src/test/integration/run-integration-tests.ts

# Run specific suites
npx ts-node src/test/integration/run-integration-tests.ts e2e api

# Run tests in parallel
npx ts-node src/test/integration/run-integration-tests.ts --parallel

# Run with verbose output
npx ts-node src/test/integration/run-integration-tests.ts --verbose
```

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)

- **Browsers**: Chrome, Firefox, Safari, Edge
- **Devices**: Desktop, Mobile Chrome, Mobile Safari
- **Reporters**: HTML, JSON, JUnit
- **Timeouts**: 30s test timeout, 10s action timeout
- **Retries**: 2 retries on CI, 0 locally

### Environment Variables

```bash
# Application URL (default: http://localhost:3000)
VITE_API_BASE_URL=http://localhost:3000

# API URL (default: http://localhost:8000)
VITE_API_BASE_URL=http://localhost:8000

# CI mode
CI=true
```

## Test Data and Mocking

### API Mocking

Tests use Playwright's route interception to mock API responses:

```typescript
await page.route('**/api/instances', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockData),
  });
});
```

### Test Data Factories

Reusable test data factories are available in `../utils.tsx`:

```typescript
import { createMockInstance, createMockInstances } from '../../utils';

const instance = createMockInstance({ name: 'test-instance' });
const instances = createMockInstances(10);
```

## Performance Thresholds

The performance tests enforce the following thresholds:

- **First Contentful Paint**: < 2000ms
- **Largest Contentful Paint**: < 4000ms
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 5000ms
- **Total Blocking Time**: < 300ms

## Accessibility Standards

The accessibility tests verify compliance with:

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines
- **Section 508**: US Federal accessibility requirements
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44x44px on mobile
- **Keyboard Navigation**: Full keyboard accessibility

## Continuous Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
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
      
      - name: Run integration tests
        run: npm run test:all
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Debugging Tests

### Visual Debugging

```bash
# Run with UI mode to see tests in browser
npm run test:integration:ui

# Run in debug mode with step-by-step execution
npm run test:integration:debug

# Run in headed mode to see browser
npx playwright test --headed
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots on failure
- Videos of the entire test run
- Traces for detailed debugging

Access these in the `test-results/` directory.

### Common Issues

1. **Timeouts**: Increase timeout values in `playwright.config.ts`
2. **Flaky tests**: Add proper wait conditions and stable selectors
3. **Mock data**: Ensure mock responses match actual API format
4. **Responsive tests**: Allow time for CSS transitions to complete

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

## Reporting

Test results are available in multiple formats:

- **HTML Report**: `test-results/index.html`
- **JSON Report**: `test-results/integration-results.json`
- **JUnit XML**: `test-results/integration-results.xml`
- **Custom Summary**: `test-results/integration-test-report.json`

## Contributing

When adding new integration tests:

1. Follow the existing test structure and naming conventions
2. Add appropriate test data and mocking
3. Include both positive and negative test cases
4. Update this README with new test categories or requirements
5. Ensure tests pass in all supported browsers and devices