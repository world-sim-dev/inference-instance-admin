#!/usr/bin/env python3
"""
Integration test runner for the inference instance management system.
Runs comprehensive integration tests including browser tests.
"""

import os
import sys
import subprocess
import argparse
import time
from pathlib import Path


def run_command(command, description, timeout=300):
    """Run a command with timeout and error handling."""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if result.stdout:
            print("STDOUT:")
            print(result.stdout)
        
        if result.stderr:
            print("STDERR:")
            print(result.stderr)
        
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            return True
        else:
            print(f"❌ {description} - FAILED (exit code: {result.returncode})")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT (>{timeout}s)")
        return False
    except Exception as e:
        print(f"💥 {description} - ERROR: {str(e)}")
        return False


def check_dependencies():
    """Check if required dependencies are installed."""
    print("Checking dependencies...")
    
    required_packages = [
        "pytest",
        "selenium", 
        "webdriver-manager",
        "fastapi",
        "sqlalchemy"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} - installed")
        except ImportError:
            print(f"❌ {package} - missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\nMissing packages: {', '.join(missing_packages)}")
        print("Install with: pip install -r requirements.txt")
        return False
    
    return True


def setup_test_environment():
    """Set up the test environment."""
    print("\nSetting up test environment...")
    
    # Create test database directory if it doesn't exist
    test_db_dir = Path("test_data")
    test_db_dir.mkdir(exist_ok=True)
    
    # Set environment variables for testing
    os.environ["TESTING"] = "1"
    os.environ["DATABASE_URL"] = "sqlite:///test_data/test_integration.db"
    
    print("✅ Test environment setup complete")
    return True


def run_unit_tests():
    """Run unit tests first to ensure basic functionality."""
    return run_command(
        "python -m pytest tests/test_models.py tests/test_services.py -v",
        "Unit Tests (Models & Services)",
        timeout=120
    )


def run_api_tests():
    """Run API integration tests."""
    return run_command(
        "python -m pytest tests/test_api_endpoints.py -v",
        "API Integration Tests",
        timeout=180
    )


def run_integration_tests():
    """Run comprehensive integration tests."""
    return run_command(
        "python -m pytest tests/test_integration.py -v",
        "End-to-End Integration Tests",
        timeout=300
    )


def run_browser_tests():
    """Run browser-based integration tests."""
    print("\nPreparing browser tests...")
    
    # Check if Chrome/Chromium is available
    chrome_available = False
    for chrome_cmd in ["google-chrome", "chromium-browser", "chrome"]:
        try:
            subprocess.run([chrome_cmd, "--version"], 
                         capture_output=True, check=True)
            chrome_available = True
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue
    
    if not chrome_available:
        print("⚠️  Chrome/Chromium not found. Skipping browser tests.")
        print("   Install Chrome or Chromium to run browser tests.")
        return True  # Don't fail the entire test suite
    
    return run_command(
        "python -m pytest tests/test_browser_integration.py -v -s",
        "Browser Integration Tests",
        timeout=600
    )


def run_performance_tests():
    """Run performance and load tests."""
    return run_command(
        "python -m pytest tests/test_integration.py::TestAdvancedIntegrationScenarios::test_bulk_operations_workflow -v",
        "Performance Tests",
        timeout=180
    )


def generate_test_report():
    """Generate a comprehensive test report."""
    print("\n" + "="*60)
    print("GENERATING TEST REPORT")
    print("="*60)
    
    return run_command(
        "python -m pytest tests/ --tb=short --maxfail=5 -v",
        "Comprehensive Test Report",
        timeout=600
    )


def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description="Integration Test Runner")
    parser.add_argument("--skip-browser", action="store_true", 
                       help="Skip browser tests")
    parser.add_argument("--skip-performance", action="store_true",
                       help="Skip performance tests")
    parser.add_argument("--quick", action="store_true",
                       help="Run only essential tests")
    parser.add_argument("--report-only", action="store_true",
                       help="Generate test report only")
    
    args = parser.parse_args()
    
    print("🚀 Integration Test Runner")
    print("="*60)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Dependency check failed. Please install missing packages.")
        sys.exit(1)
    
    # Setup test environment
    if not setup_test_environment():
        print("\n❌ Test environment setup failed.")
        sys.exit(1)
    
    # Track test results
    test_results = []
    
    if args.report_only:
        # Generate comprehensive report only
        success = generate_test_report()
        sys.exit(0 if success else 1)
    
    # Run tests in order
    if not args.quick:
        # Unit tests first
        result = run_unit_tests()
        test_results.append(("Unit Tests", result))
        
        if not result:
            print("\n❌ Unit tests failed. Stopping test execution.")
            sys.exit(1)
        
        # API tests
        result = run_api_tests()
        test_results.append(("API Tests", result))
    
    # Integration tests (always run)
    result = run_integration_tests()
    test_results.append(("Integration Tests", result))
    
    # Browser tests (optional)
    if not args.skip_browser:
        result = run_browser_tests()
        test_results.append(("Browser Tests", result))
    
    # Performance tests (optional)
    if not args.skip_performance and not args.quick:
        result = run_performance_tests()
        test_results.append(("Performance Tests", result))
    
    # Print summary
    print("\n" + "="*60)
    print("TEST EXECUTION SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(test_results)} test suites")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 All integration tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 {failed} test suite(s) failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()