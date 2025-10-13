"""
Encryption service for secure credential storage.

Uses Fernet symmetric encryption to encrypt/decrypt credentials
before storing in the database.
"""

from cryptography.fernet import Fernet
import json
import os
from typing import Any, Dict


class EncryptionService:
    """
    Handle encryption and decryption of credentials.

    Uses Fernet (symmetric encryption) with a key from environment
    variables. All credentials are encrypted before storage and
    decrypted when needed for API calls.

    Usage:
        service = EncryptionService()
        encrypted = service.encrypt_credentials({"api_key": "secret"})
        decrypted = service.decrypt_credentials(encrypted)
    """

    def __init__(self):
        """Initialize with encryption key from environment."""
        key = os.getenv("ENCRYPTION_KEY")

        if not key:
            raise ValueError(
                "ENCRYPTION_KEY environment variable not set. "
                "Generate one with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
            )

        try:
            self.fernet = Fernet(key.encode())
        except Exception as e:
            raise ValueError(f"Invalid ENCRYPTION_KEY: {e}")

    def encrypt_credentials(self, credentials: Dict[str, Any]) -> str:
        """
        Encrypt credentials dictionary to string.

        Args:
            credentials: Dictionary containing credentials (API keys, tokens, etc.)

        Returns:
            Encrypted string safe to store in database

        Raises:
            ValueError: If credentials cannot be serialized
        """
        try:
            # Convert to JSON
            json_str = json.dumps(credentials)

            # Encrypt
            encrypted = self.fernet.encrypt(json_str.encode())

            # Return as string
            return encrypted.decode()

        except (TypeError, ValueError) as e:
            raise ValueError(f"Failed to encrypt credentials: {e}")

    def decrypt_credentials(self, encrypted: str) -> Dict[str, Any]:
        """
        Decrypt credentials string to dictionary.

        Args:
            encrypted: Encrypted credentials string from database

        Returns:
            Dictionary with decrypted credentials

        Raises:
            ValueError: If decryption fails or data is invalid
        """
        try:
            # Decrypt
            decrypted = self.fernet.decrypt(encrypted.encode())

            # Parse JSON
            credentials = json.loads(decrypted.decode())

            return credentials

        except Exception as e:
            raise ValueError(f"Failed to decrypt credentials: {e}")

    def rotate_key(
        self,
        old_encrypted: str,
        new_key: str
    ) -> str:
        """
        Re-encrypt credentials with a new key.

        Used for key rotation. Decrypts with current key and
        re-encrypts with new key.

        Args:
            old_encrypted: Currently encrypted credentials
            new_key: New encryption key

        Returns:
            Credentials encrypted with new key
        """
        # Decrypt with current key
        credentials = self.decrypt_credentials(old_encrypted)

        # Create new encryptor with new key
        new_fernet = Fernet(new_key.encode())

        # Re-encrypt
        json_str = json.dumps(credentials)
        encrypted = new_fernet.encrypt(json_str.encode())

        return encrypted.decode()


# Global encryption service instance
try:
    encryption_service = EncryptionService()
except ValueError as e:
    # Allow import even if ENCRYPTION_KEY not set (for testing)
    print(f"Warning: {e}")
    encryption_service = None  # type: ignore


def generate_key() -> str:
    """
    Generate a new Fernet encryption key.

    Returns:
        Base64-encoded encryption key as string

    Usage:
        key = generate_key()
        print(f"ENCRYPTION_KEY={key}")
    """
    return Fernet.generate_key().decode()


if __name__ == "__main__":
    # Generate key when run as script
    print("Generating new encryption key...")
    print()
    print(f"ENCRYPTION_KEY={generate_key()}")
    print()
    print("Add this to your .env file!")
