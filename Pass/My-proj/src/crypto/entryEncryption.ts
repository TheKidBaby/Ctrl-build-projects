/**
 * Per-Entry Encryption Module
 * Encrypts/decrypts individual vault entries using AES-256-GCM
 * Keys derived from master password via Argon2id
 */

import { generateIV, encryptData, decryptData } from "./index";
import { deriveKeyArgon2id } from "./argon2";
import type { DecryptedEntry, VaultEntry } from "@/types/vault";

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(b64: string): Uint8Array {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(arr)));
}

/**
 * Extract sensitive data from DecryptedEntry for encryption
 */
function extractSensitiveData(entry: DecryptedEntry): Record<string, unknown> {
  return {
    username: entry.username || "",
    email: entry.email || "",
    password: entry.password,
    url: entry.url || "",
    notes: entry.notes || "",
    tags: entry.tags || [],
    customFields: entry.customFields || {},
  };
}

/**
 * Encrypt a vault entry using master password
 * Derives key from master password via Argon2id
 */
export async function encryptVaultEntry(
  entry: DecryptedEntry,
  masterPassword: string,
): Promise<VaultEntry> {
  try {
    const { key, salt } = await deriveKeyArgon2id(masterPassword);
    const iv = await generateIV();

    const dataToEncrypt = JSON.stringify(extractSensitiveData(entry));
    const encryptedData = await encryptData(dataToEncrypt, key, iv);

    return {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      encryptedData,
      iv: uint8ArrayToBase64(iv),
      salt: uint8ArrayToBase64(salt),
      isFavorite: entry.isFavorite,
      passwordStrength: 0,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lastAccessedAt: entry.lastAccessedAt,
    };
  } catch (error) {
    throw new Error(`Failed to encrypt entry: ${error}`);
  }
}

/**
 * Decrypt a vault entry using master password
 * Re-derives key using stored salt
 */
export async function decryptVaultEntry(
  entry: VaultEntry,
  masterPassword: string,
): Promise<DecryptedEntry> {
  try {
    const saltBytes = base64ToUint8Array(entry.salt);
    const { key } = await deriveKeyArgon2id(masterPassword, saltBytes);

    const decryptedJSON = await decryptData(entry.encryptedData, key);
    const decryptedData = JSON.parse(decryptedJSON) as Record<string, unknown>;

    return {
      id: entry.id,
      title: entry.title,
      category: entry.category,
      username: (decryptedData.username as string) || "",
      email: (decryptedData.email as string) || "",
      password: decryptedData.password as string,
      url: (decryptedData.url as string) || "",
      notes: (decryptedData.notes as string) || "",
      tags: (decryptedData.tags as string[]) || [],
      customFields: decryptedData.customFields as
        | Record<string, string>
        | undefined,
      isFavorite: entry.isFavorite,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lastAccessedAt: entry.lastAccessedAt,
    };
  } catch (error) {
    throw new Error(`Failed to decrypt entry ${entry.id}: ${error}`);
  }
}

/**
 * Encrypt multiple entries in parallel
 */
export async function encryptVaultEntries(
  entries: DecryptedEntry[],
  masterPassword: string,
): Promise<VaultEntry[]> {
  return Promise.all(entries.map((e) => encryptVaultEntry(e, masterPassword)));
}

/**
 * Decrypt multiple entries in parallel
 */
export async function decryptVaultEntries(
  entries: VaultEntry[],
  masterPassword: string,
): Promise<DecryptedEntry[]> {
  return Promise.all(entries.map((e) => decryptVaultEntry(e, masterPassword)));
}

export default {
  encryptVaultEntry,
  decryptVaultEntry,
  encryptVaultEntries,
  decryptVaultEntries,
};
