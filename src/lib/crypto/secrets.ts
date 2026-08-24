import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * Symmetric encryption for secrets at rest — payment gateway credentials are
 * NEVER stored in plain text (spec §6.2, §8). AES-256-GCM with a per-value salt
 * and IV; the key is derived from ENCRYPTION_KEY.
 *
 * Format: base64(salt).base64(iv).base64(tag).base64(ciphertext)
 */
function requireSecret(): string {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ENCRYPTION_KEY is not set (min 16 chars) — required to encrypt/decrypt credentials.",
    );
  }
  return secret;
}

function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(secret, salt, 32);
}

export function encryptSecret(plaintext: string): string {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = deriveKey(requireSecret(), salt);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [salt, iv, tag, ciphertext]
    .map((buf) => buf.toString("base64"))
    .join(".");
}

export function decryptSecret(payload: string): string {
  const [saltB64, ivB64, tagB64, ctB64] = payload.split(".");
  if (!saltB64 || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Invalid encrypted payload");
  }
  const key = deriveKey(requireSecret(), Buffer.from(saltB64, "base64"));
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
