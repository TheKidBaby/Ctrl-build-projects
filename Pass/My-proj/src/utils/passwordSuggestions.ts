export interface PasswordWeaknessAnalysis {
  isWeak: boolean;
  reason: string;
}

export function analyzePasswordWeakness(password: string): PasswordWeaknessAnalysis {
  let score = 0;

  if (password.length >= 8) score += 15;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;

  if (score <= 40) {
    if (password.length < 8) {
      return { isWeak: true, reason: "Password is too short (less than 8 characters)" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isWeak: true, reason: "Missing uppercase letters" };
    }
    if (!/[0-9]/.test(password)) {
      return { isWeak: true, reason: "Missing numbers" };
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      return { isWeak: true, reason: "Missing special characters" };
    }
    return { isWeak: true, reason: "Password is weak" };
  }

  return { isWeak: false, reason: "" };
}

export function generatePasswordSuggestions(password: string): string[] {
  const suggestions: string[] = [];

  // Suggestion 1: Replace common letters with symbols
  let suggestion1 = password
    .replace(/s/g, '$')
    .replace(/a/g, '@')
    .replace(/o/g, '0')
    .replace(/i/g, '!')
    .replace(/e/g, '3');

  if (suggestion1 !== password && !suggestions.includes(suggestion1)) {
    suggestions.push(suggestion1);
  }

  // Suggestion 2: Replace sequential numbers with random ones
  let suggestion2 = password.replace(/\d/g, (digit) => {
    const replacements: { [key: string]: string } = {
      '0': '7', '1': '9', '2': '8', '3': '5', '4': '6',
      '5': '2', '6': '4', '7': '3', '8': '1', '9': '0'
    };
    return replacements[digit] || '9';
  });

  if (suggestion2 !== password && !suggestions.includes(suggestion2)) {
    suggestions.push(suggestion2);
  }

  // Suggestion 3: Add special character and enhance
  let suggestion3 = password;
  const specialChars = '!@#$%^&*_+-=';

  if (!/[!@#$%^&*_+\-=]/.test(password)) {
    // Add special char in the middle
    const mid = Math.floor(password.length / 2);
    const specialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
    suggestion3 = password.slice(0, mid) + specialChar + password.slice(mid);
  } else {
    // Replace a letter with symbol
    suggestion3 = password.replace(/[a-z]/i, (char) => {
      const map: { [key: string]: string } = {
        'a': '@', 's': '$', 'o': '0', 'e': '3', 'i': '!', 'l': '|'
      };
      return map[char.toLowerCase()] || char;
    });
  }

  if (suggestion3 !== password && !suggestions.includes(suggestion3)) {
    suggestions.push(suggestion3);
  }

  // Ensure we have at least 3 suggestions
  while (suggestions.length < 3) {
    const randomSuggestion = password + specialChars[Math.floor(Math.random() * specialChars.length)];
    if (!suggestions.includes(randomSuggestion)) {
      suggestions.push(randomSuggestion);
    }
  }

  return suggestions.slice(0, 3);
}
