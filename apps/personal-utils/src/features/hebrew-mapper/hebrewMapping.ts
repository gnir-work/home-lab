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

/**
 * Converts a string of Hebrew characters to the English keys that produced them.
 * Non-Hebrew characters (spaces, numbers, Latin letters, punctuation) pass through unchanged.
 */
export function hebrewToEnglish(input: string): string {
  return input
    .split("")
    .map((char) => HEBREW_TO_ENGLISH[char] ?? char)
    .join("");
}
