/**
 * Argon2id Key Derivation Module
 * High-security password hashing using memory-hard parameters
 * Uses argon2-wasm for Vite-compatible WebAssembly loading
 * Suitable for master password derivation in high-security vaults
 */

import { hash } from "argon2-wasm";

export interface Argon2idOptions {
  memory: number; // KiB (default: 65536 = 64MB)
  time: number; // iterations (default: 3)
  parallelism: number; // threads (default: 4)
  hashLen: number; // output length in bytes (default: 32 for 256-bit)
  type: number; // 0 = Argon2d, 1 = Argon2i, 2 = Argon2id
}

export interface Argon2idHash {
  hash: string; // base64-encoded hash
  salt: string; // base64-encoded salt
  params: Argon2idOptions;
  timestamp: number;
}

// High-security settings for vault master password
export const VAULT_ARGON2_PARAMS: Argon2idOptions = {
  memory: 65536, // 64 MB
  time: 3, // 3 iterations
  parallelism: 4, // 4 threads
  hashLen: 32, // 256 bits
  type: 2, // Argon2id
};

/**
 * Generate a random salt for Argon2id hashing
 */
export function generateArgon2Salt(length: number = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(arr)));
}

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
 * Hash a password using Argon2id with high-security parameters
 * Returns salt and hash for storage
 */
export async function hashPasswordArgon2id(
  password: string,
  salt?: Uint8Array,
  options: Argon2idOptions = VAULT_ARGON2_PARAMS,
): Promise<Argon2idHash> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = salt || generateArgon2Salt();

  try {
    const result = await hash({
      pass: passwordBuffer,
      salt: saltBuffer,
      time: options.time,
      mem: options.memory,
      parallelism: options.parallelism,
      hashLen: options.hashLen,
      type: options.type,
    });

    return {
      hash: uint8ArrayToBase64(result.hash),
      salt: uint8ArrayToBase64(saltBuffer),
      params: options,
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`Argon2id hashing failed: ${error}`);
  }
}

/**
 * Verify a password against a stored Argon2id hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPasswordArgon2id(
  password: string,
  storedHash: Argon2idHash,
): Promise<boolean> {
  try {
    const salt = base64ToUint8Array(storedHash.salt);
    const newHash = await hashPasswordArgon2id(
      password,
      salt,
      storedHash.params,
    );

    // Constant-time comparison to prevent timing attacks
    const storedHashBytes = base64ToUint8Array(storedHash.hash);
    const newHashBytes = base64ToUint8Array(newHash.hash);

    if (storedHashBytes.length !== newHashBytes.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < storedHashBytes.length; i++) {
      result |= storedHashBytes[i] ^ newHashBytes[i];
    }

    return result === 0;
  } catch (error) {
    console.error("Argon2id verification failed:", error);
    return false;
  }
}

/**
 * Derive a CryptoKey from password using Argon2id
 * For use with AES-256-GCM encryption
 */
export async function deriveKeyArgon2id(
  password: string,
  salt?: Uint8Array,
  options: Argon2idOptions = VAULT_ARGON2_PARAMS,
): Promise<{ key: CryptoKey; salt: Uint8Array; hash: Argon2idHash }> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = salt || generateArgon2Salt();

  try {
    const result = await hash({
      pass: passwordBuffer,
      salt: saltBuffer,
      time: options.time,
      mem: options.memory,
      parallelism: options.parallelism,
      hashLen: options.hashLen,
      type: options.type,
    });

    // Import derived key material for AES-256-GCM
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      result.hash as BufferSource,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"],
    );

    const hashRecord: Argon2idHash = {
      hash: uint8ArrayToBase64(result.hash),
      salt: uint8ArrayToBase64(saltBuffer),
      params: options,
      timestamp: Date.now(),
    };

    return {
      key: cryptoKey,
      salt: saltBuffer,
      hash: hashRecord,
    };
  } catch (error) {
    throw new Error(`Argon2id key derivation failed: ${error}`);
  }
}

/**
 * Scrub sensitive data from memory (best effort in JavaScript)
 */
export function scrubArgon2Data(data: Uint8Array): void {
  data.fill(0);
  // Note: In JavaScript, we cannot guarantee memory clearing
  // This fills the array with zeros as a best effort
}

export default {
  generateArgon2Salt,
  hashPasswordArgon2id,
  verifyPasswordArgon2id,
  deriveKeyArgon2id,
  scrubArgon2Data,
  VAULT_ARGON2_PARAMS,
};
