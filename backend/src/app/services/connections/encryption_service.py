"""Encryption service for securing OAuth credentials."""
import base64
import json
import os
from typing import Any, Dict

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


def get_encryption_key() -> bytes:
    """Get or generate encryption key from environment."""
    secret_key = os.getenv("ENCRYPTION_SECRET_KEY")

    if not secret_key:
        raise ValueError(
            "ENCRYPTION_SECRET_KEY environment variable not set. "
            "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
        )

    # Use PBKDF2 to derive a key from the secret
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"fuse_workflow_salt_v1",  # Static salt for consistency
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))
    return key


def encrypt_credentials(credentials: Dict[str, Any]) -> str:
    """Encrypt credentials dictionary to string."""
    key = get_encryption_key()
    fernet = Fernet(key)

    # Convert to JSON string
    json_str = json.dumps(credentials)

    # Encrypt
    encrypted = fernet.encrypt(json_str.encode())

    return encrypted.decode()


def decrypt_credentials(encrypted_str: str) -> Dict[str, Any]:
    """Decrypt credentials string to dictionary."""
    key = get_encryption_key()
    fernet = Fernet(key)

    # Decrypt
    decrypted = fernet.decrypt(encrypted_str.encode())

    # Parse JSON
    credentials = json.loads(decrypted.decode())

    return credentials


def test_encryption() -> bool:
    """Test encryption/decryption works."""
    try:
        test_data = {"test": "value", "token": "secret123"}
        encrypted = encrypt_credentials(test_data)
        decrypted = decrypt_credentials(encrypted)
        return decrypted == test_data
    except Exception:
        return False
