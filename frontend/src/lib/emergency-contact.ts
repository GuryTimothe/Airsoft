export type EmergencyContactFields = {
  lastname: string;
  firstname: string;
  email: string;
  phone: string;
};

const EMPTY_EMERGENCY_CONTACT: EmergencyContactFields = {
  lastname: "",
  firstname: "",
  email: "",
  phone: "",
};

function normalizeValue(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = normalizeValue(record[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function parseEmergencyContact(
  emergencyContact?: EmergencyContactFields | string | null,
): EmergencyContactFields {
  if (emergencyContact && typeof emergencyContact === "object") {
    const record = emergencyContact as Record<string, unknown>;

    return {
      lastname: pickString(record, [
        "lastname",
        "lastName",
        "last_name",
        "nom",
        "name",
      ]),
      firstname: pickString(record, [
        "firstname",
        "firstName",
        "first_name",
        "prenom",
      ]),
      email: pickString(record, ["email", "mail"]),
      phone: pickString(record, [
        "phone",
        "telephone",
        "phoneNumber",
        "phone_number",
      ]),
    };
  }

  const raw =
    typeof emergencyContact === "string" ? emergencyContact.trim() : "";

  if (!raw) {
    return { ...EMPTY_EMERGENCY_CONTACT };
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      lastname: normalizeValue(parsed.lastname),
      firstname: normalizeValue(parsed.firstname),
      email: normalizeValue(parsed.email),
      phone: normalizeValue(parsed.phone),
    };
  } catch {
    const legacyParts = raw.split("-").map((part) => part.trim());

    if (legacyParts.length >= 2) {
      return {
        lastname: legacyParts[0],
        firstname: "",
        email: "",
        phone: legacyParts.slice(1).join(" - "),
      };
    }

    return {
      lastname: raw,
      firstname: "",
      email: "",
      phone: "",
    };
  }
}

export function serializeEmergencyContact(
  fields: EmergencyContactFields,
): EmergencyContactFields | null {
  const normalized: EmergencyContactFields = {
    lastname: fields.lastname.trim(),
    firstname: fields.firstname.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
  };

  if (
    !normalized.lastname &&
    !normalized.firstname &&
    !normalized.email &&
    !normalized.phone
  ) {
    return null;
  }

  return normalized;
}

export function hasCompleteEmergencyContact(
  fields: EmergencyContactFields,
): boolean {
  return Boolean(
    fields.lastname.trim() &&
    fields.firstname.trim() &&
    fields.email.trim() &&
    fields.phone.trim(),
  );
}
