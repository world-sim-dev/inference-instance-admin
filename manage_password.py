#!/usr/bin/env python3
"""
Password management utility for the application.
Provides tools to generate and verify password hashes.
"""

import sys
import getpass
from password_utils import generate_password_hash, verify_password


def generate_hash():
    """Generate a hash for a new password."""
    print("Password Hash Generator")
    print("=" * 30)
    
    # Get password securely
    password = getpass.getpass("Enter password to hash: ")
    if not password:
        print("Error: Password cannot be empty")
        return
    
    # Confirm password
    confirm_password = getpass.getpass("Confirm password: ")
    if password != confirm_password:
        print("Error: Passwords do not match")
        return
    
    # Generate hash
    hashed = generate_password_hash(password)
    
    print("\nGenerated hash:")
    print(f"AUTH_PASSWORD_HASH={hashed}")
    print("\nAdd this to your .env file or update config.py")


def verify_hash():
    """Verify a password against a hash."""
    print("Password Hash Verifier")
    print("=" * 30)
    
    password = getpass.getpass("Enter password to verify: ")
    hash_value = input("Enter hash to verify against: ")
    
    if not password or not hash_value:
        print("Error: Both password and hash are required")
        return
    
    is_valid = verify_password(password, hash_value)
    
    if is_valid:
        print("✅ Password matches the hash")
    else:
        print("❌ Password does not match the hash")


def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) < 2:
        print("Password Management Utility")
        print("=" * 30)
        print("Usage:")
        print("  python manage_password.py generate  - Generate hash for new password")
        print("  python manage_password.py verify    - Verify password against hash")
        return
    
    command = sys.argv[1].lower()
    
    if command == "generate":
        generate_hash()
    elif command == "verify":
        verify_hash()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: generate, verify")


if __name__ == "__main__":
    main()