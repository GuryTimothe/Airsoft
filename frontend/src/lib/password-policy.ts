export const PASSWORD_POLICY_RULES = [
  {
    test: (password: string) => password.length >= 12,
    message: "Le mot de passe doit contenir au moins 12 caractères.",
  },
  {
    test: (password: string) => /[a-z]/.test(password),
    message: "Le mot de passe doit contenir au moins une minuscule.",
  },
  {
    test: (password: string) => /[A-Z]/.test(password),
    message: "Le mot de passe doit contenir au moins une majuscule.",
  },
  {
    test: (password: string) => /\d/.test(password),
    message: "Le mot de passe doit contenir au moins un chiffre.",
  },
  {
    test: (password: string) => /[^\w\s]/.test(password),
    message: "Le mot de passe doit contenir au moins un symbole.",
  },
] as const;

export function getPasswordPolicyErrors(password: string): string[] {
  return PASSWORD_POLICY_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.message,
  );
}

export function validatePasswordPolicy(password: string): string[] {
  return getPasswordPolicyErrors(password);
}
