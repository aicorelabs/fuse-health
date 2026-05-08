import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { decryptJson, encryptJson } from "../crypto.js";

describe("encryptJson / decryptJson", () => {
  const original = process.env.FUSE_SECRET_KEY;

  beforeEach(() => {
    process.env.FUSE_SECRET_KEY = "test-secret-key-not-for-real-use";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.FUSE_SECRET_KEY;
    else process.env.FUSE_SECRET_KEY = original;
  });

  it("round-trips an object", () => {
    const value = { SLACK_TOKEN: "xoxb-abc", LIMIT: "10" };
    const cipher = encryptJson(value);
    expect(typeof cipher).toBe("string");
    expect(cipher.length).toBeGreaterThan(0);
    expect(decryptJson(cipher)).toEqual(value);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const value = { x: "secret" };
    const a = encryptJson(value);
    const b = encryptJson(value);
    expect(a).not.toBe(b);
    expect(decryptJson(a)).toEqual(value);
    expect(decryptJson(b)).toEqual(value);
  });

  it("rejects ciphertext that has been tampered with", () => {
    const cipher = encryptJson({ secret: "abc" });
    // Flip a byte deep in the ciphertext (after the 12-byte IV + 16-byte tag).
    const buf = Buffer.from(cipher, "base64");
    buf[40] = (buf[40] ?? 0) ^ 0xff;
    const tampered = buf.toString("base64");
    expect(() => decryptJson(tampered)).toThrow();
  });

  it("rejects ciphertext encrypted under a different key", () => {
    const cipher = encryptJson({ secret: "abc" });
    process.env.FUSE_SECRET_KEY = "totally-different-key";
    expect(() => decryptJson(cipher)).toThrow();
  });

  it("throws when FUSE_SECRET_KEY is missing", () => {
    delete process.env.FUSE_SECRET_KEY;
    expect(() => encryptJson({ x: 1 })).toThrow(/FUSE_SECRET_KEY/);
  });
});
