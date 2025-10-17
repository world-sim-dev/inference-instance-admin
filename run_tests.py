#!/usr/bin/env python3
"""
Test runner script for the simplified inference instance management system.
Provides convenient commands to run different test suites.
"""

import sys
import subprocess
import argparse


def run_command(cmd):
    """Run a command and return the result."""
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=False)
    return result.returncode


def run_unit_tests():
    """Run unit tests for models and services."""
    cmd = ["python", "-m", "pytest", "tests/test_models.py", "tests/test_services.py", "-v"]
    return run_command(cmd)


def run_api_tests():
    """Run API endpoint tests."""
    cmd = ["python", "-m", "pytest", "tests/test_api_endpoints.py", "-v"]
    return run_command(cmd)


def run_integration_tests():
    """Run integration tests."""
    cmd = ["python", "-m", "pytest", "tests/test_integration.py", "-v"]
    return run_command(cmd)


def run_all_tests():
    """Run all tests."""
    cmd = ["python", "-m", "pytest", "tests/", "-v"]
    return run_command(cmd)


def run_tests_with_coverage():
    """Run all tests with coverage report."""
    cmd = ["python", "-m", "pytest", "tests/", "-v", "--cov=.", "--cov-report=term-missing"]
    return run_command(cmd)


def main():
    parser = argparse.ArgumentParser(description="Test runner for inference instance management system")
    parser.add_argument(
        "test_type",
        choices=["unit", "api", "integration", "all", "coverage"],
        help="Type of tests to run"
    )
    
    args = parser.parse_args()
    
    if args.test_type == "unit":
        return run_unit_tests()
    elif args.test_type == "api":
        return run_api_tests()
    elif args.test_type == "integration":
        return run_integration_tests()
    elif args.test_type == "all":
        return run_all_tests()
    elif args.test_type == "coverage":
        return run_tests_with_coverage()
    else:
        print(f"Unknown test type: {args.test_type}")
        return 1


if __name__ == "__main__":
    sys.exit(main())