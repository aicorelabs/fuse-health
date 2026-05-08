import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

// AES-256-GCM. 96-bit IV is the GCM-recommended size; 128-bit auth tag is the
// default. Wire format: base64(iv || authTag || ciphertext).
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer {
  const raw = process.env.FUSE_SECRET_KEY;
  if (!raw || raw.length === 0) {
    throw new Error(
      "FUSE_SECRET_KEY is not set. Add it to .env to enable per-integration encrypted variables.",
    );
  }
  // SHA-256 of the raw secret yields a stable 32-byte AES-256 key. The user
  // gives us "any string" — we don't enforce a min length but the docs do.
  return createHash("sha256").update(raw, "utf8").digest();
}

/** Encrypt any JSON-serializable value into a base64 string. */
export function encryptJson(value: unknown): string {
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/** Decrypt a base64 string produced by `encryptJson`. */
export function decryptJson(encoded: string): unknown {
  const buf = Buffer.from(encoded, "base64");
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error("Cipher payload too short");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const authTag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8"));
}
