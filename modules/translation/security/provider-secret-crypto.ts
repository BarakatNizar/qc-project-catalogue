import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function getEncryptionKey(): Buffer {
  const configured = process.env.TRANSLATION_CONFIG_ENCRYPTION_KEY;

  if (!configured) {
    throw new Error("TRANSLATION_CONFIG_ENCRYPTION_KEY is not configured.");
  }

  const key = Buffer.from(configured, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TRANSLATION_CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
    );
  }

  return key;
}

export function encryptProviderSecret(plaintext: string): string {
  if (!plaintext) throw new Error("Provider secret cannot be empty.");

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptProviderSecret(encrypted: string): string {
  const [version, ivValue, tagValue, ciphertextValue] = encrypted.split(".");

  if (
    version !== VERSION ||
    !ivValue ||
    !tagValue ||
    !ciphertextValue
  ) {
    throw new Error("Stored provider secret has an unsupported format.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
