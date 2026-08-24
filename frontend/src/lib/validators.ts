export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhoneNumber(phone: string): boolean {
  const normalized = phone.replace(/[\s().-]/g, "");

  return /^\+?\d{6,15}$/.test(normalized);
}
