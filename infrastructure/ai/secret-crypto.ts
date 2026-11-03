import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const CIPHER = "aes-256-gcm";
const VERSION = "v1";

function getEncryptionKey(): Buffer {
  const encoded = process.env.AI_CONFIG_ENCRYPTION_KEY;
  if (!encoded) {
    throw new Error("AI_CONFIG_ENCRYPTION_KEY is not configured.");
  }

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("AI_CONFIG_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

/** Encrypts an API key before it is persisted. Format: v1:iv:tag:ciphertext (base64). */
export function encryptAiSecret(plainText: string): string {
  if (!plainText) throw new Error("Cannot encrypt an empty AI secret.");
try {
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER, getEncryptionKey(), iv);
  // console.log("cipher:  ", cipher )
  const ciphertext = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
} catch (error) {
  console.error(error)
  throw error;
}
}

export function decryptAiSecret(encrypted: string): string {
  const [version, ivEncoded, tagEncoded, cipherEncoded, extra] = encrypted.split(":");
  if (version !== VERSION || !ivEncoded || !tagEncoded || !cipherEncoded || extra !== undefined) {
    throw new Error("Stored AI secret has an unsupported or invalid format.");
  }

  const decipher = createDecipheriv(CIPHER, getEncryptionKey(), Buffer.from(ivEncoded, "base64"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherEncoded, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
