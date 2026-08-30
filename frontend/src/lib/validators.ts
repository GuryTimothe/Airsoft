export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// French phone number: 10 digits starting with 0, second digit 1-9 (e.g. 0705403950).
export const FRENCH_PHONE_REGEX = /^0[1-9]\d{8}$/;

export function isValidPhoneNumber(phone: string): boolean {
  return FRENCH_PHONE_REGEX.test(phone.trim());
}

// Names: letters (incl. accents), spaces and hyphens only - no digits or other symbols.
export const NAME_REGEX = /^[\p{L} -]+$/u;

export function isValidName(name: string): boolean {
  return NAME_REGEX.test(name.trim());
}
