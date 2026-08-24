// Translates the default English Symfony/API-Platform validator messages to French.
const VIOLATION_TRANSLATIONS: Array<[RegExp, string]> = [
  [/^This value should not be blank\.$/, "ce champ ne doit pas etre vide."],
  [/^This value should not be null\.$/, "ce champ est obligatoire."],
  [
    /^This value should be a valid number\.$/,
    "cette valeur doit etre un nombre valide.",
  ],
  [/^This value should be positive\.$/, "cette valeur doit etre positive."],
  [
    /^This value should be greater than or equal to (.+)\.$/,
    "cette valeur doit etre superieure ou egale a $1.",
  ],
  [
    /^This value should be less than or equal to (.+)\.$/,
    "cette valeur doit etre inferieure ou egale a $1.",
  ],
  [
    /^This value is too short\. It should have (\d+) characters or more\.$/,
    "cette valeur est trop courte. Elle doit contenir au moins $1 caracteres.",
  ],
  [
    /^This value is too long\. It should have (\d+) characters or less\.$/,
    "cette valeur est trop longue. Elle doit contenir au plus $1 caracteres.",
  ],
  [
    /^This value is not a valid email address\.$/,
    "cette valeur n'est pas une adresse email valide.",
  ],
  [
    /^This value is not a valid date\.$/,
    "cette valeur n'est pas une date valide.",
  ],
  [/^This value is already used\.$/, "cette valeur est deja utilisee."],
  [
    /^The data is either not an? string, an empty string, or null; you should pass a string that can be parsed with the passed format or a valid DateTime string\.$/,
    "la date fournie n'est pas valide.",
  ],
];

export function translateViolationMessage(message: string): string {
  for (const [pattern, replacement] of VIOLATION_TRANSLATIONS) {
    if (pattern.test(message)) {
      return message.replace(pattern, replacement);
    }
  }

  return message;
}
