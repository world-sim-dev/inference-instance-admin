"""
Password utilities for secure password handling.
Provides password hashing and verification functionality using bcrypt.
"""

import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        str: Hashed password as a string
    """
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        password: Plain text password to verify
        hashed_password: Hashed password to compare against
        
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        # Return False for any bcrypt errors (invalid hash format, etc.)
        return False


def generate_password_hash(password: str) -> str:
    """
    Generate a password hash for storage.
    This is a convenience function that wraps hash_password.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password ready for storage
    """
    return hash_password(password)


if __name__ == "__main__":
    # Interactive script to generate hash for passwords
    import getpass
    
    print("Password Hash Generator")
    print("=" * 30)
    
    # Get password securely from user input
    password = getpass.getpass("Enter password to hash: ")
    
    if not password:
        print("Error: Password cannot be empty")
        exit(1)
    
    # Generate hash
    hashed = generate_password_hash(password)
    print(f"\nGenerated hash:")
    print(f"{hashed}")
    
    # Verify the hash works
    verification_result = verify_password(password, hashed)
    print(f"\nVerification test: {'✅ PASS' if verification_result else '❌ FAIL'}")
    
    if verification_result:
        print("\n📋 Copy this hash to your config:")
        print(f"auth_password_hash: {hashed}")
    else:
        print("\n❌ Hash generation failed!")