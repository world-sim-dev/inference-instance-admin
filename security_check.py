#!/usr/bin/env python3
"""
Security check script to scan for hardcoded passwords and sensitive information.
"""

import os
import re
import sys
from pathlib import Path

# Patterns to search for potential security issues
SECURITY_PATTERNS = [
    # Original admin password
    (r'1262fcfa-0088-4f9e-be85-0b587500338c', 'Hardcoded admin password found'),
    
    # Common password patterns
    (r'password\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded password'),
    (r'pwd\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded password'),
    (r'pass\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded password'),
    
    # API keys and tokens
    (r'api_key\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded API key'),
    (r'token\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded token'),
    (r'secret\s*=\s*["\'][^"\']+["\']', 'Potential hardcoded secret'),
    
    # Basic auth patterns
    (r'setBasicAuth\s*\(\s*["\'][^"\']+["\'],\s*["\'][^"\']+["\']', 'Hardcoded Basic Auth credentials'),
    (r'Authorization.*Basic\s+[A-Za-z0-9+/=]+', 'Hardcoded Basic Auth header'),
    
    # Database credentials
    (r'postgresql://[^:]+:[^@]+@', 'Database credentials in URL'),
    (r'mysql://[^:]+:[^@]+@', 'Database credentials in URL'),
]

# Files and directories to exclude from scanning
EXCLUDE_PATTERNS = [
    r'\.git/',
    r'node_modules/',
    r'venv/',
    r'__pycache__/',
    r'\.pyc$',
    r'\.log$',
    r'\.tmp$',
    r'security_check\.py$',
    r'SECURITY\.md$',
    r'manage_password\.py$',  # This file is for password management
]

def should_exclude_file(file_path: str) -> bool:
    """Check if file should be excluded from scanning."""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, file_path):
            return True
    return False

def scan_file(file_path: Path) -> list:
    """Scan a single file for security issues."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        for line_num, line in enumerate(content.split('\n'), 1):
            for pattern, description in SECURITY_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    issues.append({
                        'file': str(file_path),
                        'line': line_num,
                        'content': line.strip(),
                        'issue': description,
                        'pattern': pattern
                    })
                    
    except Exception as e:
        print(f"Warning: Could not scan {file_path}: {e}")
        
    return issues

def scan_directory(directory: Path) -> list:
    """Scan all files in directory recursively."""
    all_issues = []
    
    for root, dirs, files in os.walk(directory):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not should_exclude_file(os.path.join(root, d))]
        
        for file in files:
            file_path = Path(root) / file
            
            if should_exclude_file(str(file_path)):
                continue
                
            # Only scan text files
            if file_path.suffix in ['.py', '.js', '.ts', '.tsx', '.json', '.yaml', '.yml', '.env', '.md', '.txt', '.conf']:
                issues = scan_file(file_path)
                all_issues.extend(issues)
                
    return all_issues

def main():
    """Main function to run security scan."""
    print("🔍 Security Scan - Checking for hardcoded passwords and sensitive information")
    print("=" * 80)
    
    # Scan current directory
    current_dir = Path('.')
    issues = scan_directory(current_dir)
    
    if not issues:
        print("✅ No security issues found!")
        print("\nScanned patterns:")
        for pattern, description in SECURITY_PATTERNS:
            print(f"  - {description}")
        return 0
    
    print(f"❌ Found {len(issues)} potential security issues:")
    print()
    
    for issue in issues:
        print(f"File: {issue['file']}")
        print(f"Line: {issue['line']}")
        print(f"Issue: {issue['issue']}")
        print(f"Content: {issue['content']}")
        print("-" * 40)
    
    print(f"\n⚠️  Please review and fix these {len(issues)} security issues before deployment.")
    return 1

if __name__ == "__main__":
    sys.exit(main())