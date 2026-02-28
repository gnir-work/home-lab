/**
 * Maps Hebrew characters to the English keys that produce them on a US keyboard
 * when the OS keyboard layout is set to Hebrew.
 *
 * Based on the standard Israeli Hebrew keyboard layout (US-based).
 */
export const HEBREW_TO_ENGLISH: Record<string, string> = {
  // Top row
  ק: "e",
  ר: "r",
  א: "t",
  ט: "y",
  ו: "u",
  ן: "i",
  ם: "o",
  פ: "p",
  // Home row
  ש: "a",
  ד: "s",
  ג: "d",
  כ: "f",
  ע: "g",
  י: "h",
  ח: "j",
  ל: "k",
  ך: "l",
  ף: ";",
  // Bottom row
  ז: "z",
  ס: "x",
  ב: "c",
  ה: "v",
  נ: "b",
  מ: "n",
  צ: "m",
  ת: ",",
  ץ: ".",
};

export const UPPERCASE_PREFIX = "^";

/**
 * Maps digit keys to the symbol produced by Shift+digit on a US keyboard.
 */
export const SHIFT_DIGITS: Record<string, string> = {
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
};

/**
 * Converts a string of Hebrew characters to the English keys that produced them.
 * Non-Hebrew characters (spaces, numbers, Latin letters, punctuation) pass through unchanged.
 *
 * The `^` prefix applies a "shift" to the following character:
 *   - `^` + Hebrew letter  → uppercase English letter (e.g., ^ש → A)
 *   - `^` + digit          → Shift+digit symbol      (e.g., ^9 → ()
 *   - `^^`                 → literal `^` (escape)
 *   - `^` + anything else  → passes through literally (both `^` and the next char)
 */
export function hebrewToEnglish(input: string): string {
  const result: string[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === UPPERCASE_PREFIX && i + 1 < input.length) {
      const next = input[i + 1];
      if (next === UPPERCASE_PREFIX) {
        result.push(UPPERCASE_PREFIX);
        i += 2;
        continue;
      }
      const mappedHebrew = HEBREW_TO_ENGLISH[next];
      if (mappedHebrew !== undefined) {
        result.push(mappedHebrew.toUpperCase());
        i += 2;
        continue;
      }
      const mappedDigit = SHIFT_DIGITS[next];
      if (mappedDigit !== undefined) {
        result.push(mappedDigit);
        i += 2;
        continue;
      }
    }
    result.push(HEBREW_TO_ENGLISH[char] ?? char);
    i += 1;
  }
  return result.join("");
}
