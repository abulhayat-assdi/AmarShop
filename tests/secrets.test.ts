import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test-encryption-key-1234567890";
});

describe("secrets (AES-256-GCM)", () => {
  it("round-trips plaintext", () => {
    const enc = encryptSecret("bkash-app-secret");
    expect(enc).not.toContain("bkash-app-secret");
    expect(decryptSecret(enc)).toBe("bkash-app-secret");
  });

  it("uses a fresh salt/iv so ciphertext differs each time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("throws on an invalid/tampered payload", () => {
    expect(() => decryptSecret("not.a.valid.payload")).toThrow();
  });
});
