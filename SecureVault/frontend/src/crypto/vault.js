const crypto = globalThis.crypto || window.crypto;

export function getRandomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(password, salt, iterations = 600000) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-512'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

export async function encrypt(plaintext, key) {
  const encoder = new TextEncoder();
  const iv = getRandomBytes(12);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv)
  };
}

export async function decrypt(ciphertext, iv, key) {
  const decoder = new TextDecoder();

  try {
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToBytes(iv),
        tagLength: 128
      },
      key,
      base64ToBytes(ciphertext)
    );

    return decoder.decode(plaintext);
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data');
  }
}

export async function sha256(data) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return bytesToBase64(new Uint8Array(hashBuffer));
}

export function generatePassword(options = {}) {
  const {
    length = 20,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeAmbiguous = true
  } = options;

  let charset = '';
  const required = [];

  if (includeLowercase) {
    let chars = 'abcdefghijklmnopqrstuvwxyz';
    if (excludeAmbiguous) chars = chars.replace(/[l]/g, '');
    charset += chars;
    required.push(chars);
  }

  if (includeUppercase) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (excludeAmbiguous) chars = chars.replace(/[IO]/g, '');
    charset += chars;
    required.push(chars);
  }

  if (includeNumbers) {
    let chars = '0123456789';
    if (excludeAmbiguous) chars = chars.replace(/[01]/g, '');
    charset += chars;
    required.push(chars);
  }

  if (includeSymbols) {
    const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    charset += chars;
    required.push(chars);
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  const randomValues = getRandomBytes(length);
  let password = Array.from(randomValues)
    .map(byte => charset[byte % charset.length])
    .join('');

  const passwordChars = password.split('');
  required.forEach((chars, index) => {
    if (!password.split('').some(c => chars.includes(c))) {
      const randomIndex = randomValues[index] % password.length;
      const randomChar = chars[randomValues[length - 1 - index] % chars.length];
      passwordChars[randomIndex] = randomChar;
    }
  });

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

export function generateAlterations(basePassword) {
  const leetMap = {
    'a': ['@', '4'], 'e': ['3'], 'i': ['1', '!'],
    'o': ['0'], 's': ['$', '5'], 't': ['7']
  };

  const symbols = '!@#$%^&*';
  const numbers = '0123456789';
  const randomBytes = getRandomBytes(20);
  let byteIndex = 0;

  const getRandom = (max) => randomBytes[byteIndex++ % randomBytes.length] % max;

  let alt1 = basePassword.split('').map(char => {
    const lower = char.toLowerCase();
    if (leetMap[lower] && getRandom(2)) {
      return leetMap[lower][getRandom(leetMap[lower].length)];
    }
    return getRandom(2) ? char.toUpperCase() : char.toLowerCase();
  }).join('');
  alt1 += symbols[getRandom(symbols.length)] + numbers[getRandom(10)] + numbers[getRandom(10)];

  let alt2 = basePassword.split('').map((char, i) => 
    i % 2 === 0 ? char.toUpperCase() : char.toLowerCase()
  ).join('');
  alt2 = numbers[getRandom(10)] + alt2 + symbols[getRandom(symbols.length)] + numbers[getRandom(10)];

  let alt3 = basePassword.split('').reverse().map(char => {
    const lower = char.toLowerCase();
    if (leetMap[lower] && getRandom(2)) {
      return leetMap[lower][getRandom(leetMap[lower].length)];
    }
    return char;
  }).join('');
  alt3 = symbols[getRandom(symbols.length)] + alt3 + numbers[getRandom(10)];

  return [alt1, alt2, alt3];
}

export function calculateStrength(password) {
  if (!password) {
    return { score: 0, label: 'None', color: '#6b7280', percentage: 0 };
  }

  let score = 0;
  const len = password.length;

  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;
  if (len >= 20) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const uniqueChars = new Set(password).size;
  if (uniqueChars >= len * 0.6) score += 1;
  if (uniqueChars >= len * 0.8) score += 1;

  if (/^(.)\1+$/.test(password)) score -= 3;
  if (/^(012|123|234|abc|bcd)/i.test(password)) score -= 2;
  if (/^(password|admin|user|login)/i.test(password)) score -= 5;

  score = Math.max(0, Math.min(10, score));
  const percentage = score * 10;

  const levels = [
    { max: 2, label: 'Very Weak', color: '#ef4444' },
    { max: 4, label: 'Weak', color: '#f97316' },
    { max: 6, label: 'Fair', color: '#eab308' },
    { max: 8, label: 'Strong', color: '#22c55e' },
    { max: 10, label: 'Very Strong', color: '#10b981' }
  ];

  const level = levels.find(l => score <= l.max) || levels[levels.length - 1];

  return {
    score,
    label: level.label,
    color: level.color,
    percentage
  };
}

export class VaultManager {
  constructor() {
    this.masterKey = null;
    this.isUnlocked = false;
  }

  async unlock(masterPassword, salt) {
    const saltBytes = typeof salt === 'string' ? base64ToBytes(salt) : salt;
    this.masterKey = await deriveKey(masterPassword, saltBytes);
    this.isUnlocked = true;
  }

  lock() {
    this.masterKey = null;
    this.isUnlocked = false;
  }

  async encryptEntry(entry) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const plaintext = JSON.stringify(entry);
    return await encrypt(plaintext, this.masterKey);
  }

  async decryptEntry(encryptedData) {
    if (!this.isUnlocked) {
      throw new Error('Vault is locked');
    }

    const plaintext = await decrypt(encryptedData.ciphertext, encryptedData.iv, this.masterKey);
    return JSON.parse(plaintext);
  }
}

export const vault = new VaultManager();
