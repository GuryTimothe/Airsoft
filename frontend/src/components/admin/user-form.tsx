"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import {
  createUser,
  deleteUser,
  getCurrentUser,
  getUser,
  ProfileValidationError,
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
  type UserRole,
} from "@/lib/user-api";
import {
  parseEmergencyContact,
  serializeEmergencyContact,
} from "@/lib/emergency-contact";
import { validatePasswordPolicy } from "@/lib/password-policy";
import {
  isValidEmail,
  isValidName,
  isValidPhoneNumber,
} from "@/lib/validators";

interface UserFormProps {
  userId?: number;
  initialUser?: User;
  initialActorRole?: UserRole | null;
}

type UserFormValues = {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  dateOfBirth: string;
  pseudo: string;
  phone: string;
  emergencyLastname: string;
  emergencyFirstname: string;
  emergencyEmail: string;
  emergencyPhone: string;
  role: UserRole;
  canSeePrivate: boolean;
};

const emptyValues: UserFormValues = {
  lastname: "",
  firstname: "",
  email: "",
  password: "",
  dateOfBirth: "",
  pseudo: "",
  phone: "",
  emergencyLastname: "",
  emergencyFirstname: "",
  emergencyEmail: "",
  emergencyPhone: "",
  role: "ROLE_USER",
  canSeePrivate: false,
};

const assignableRolesByAdmin: UserRole[] = ["ROLE_USER", "ROLE_ORGANIZER"];
const assignableRolesBySuperAdmin: UserRole[] = [
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_ORGANIZER",
  "ROLE_SUPER_ADMIN",
];

function isElevatedRole(role: UserRole): boolean {
  return role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN";
}

function isPrivateAccessForcedRole(role: UserRole): boolean {
  return (
    role === "ROLE_ORGANIZER" ||
    role === "ROLE_ADMIN" ||
    role === "ROLE_SUPER_ADMIN"
  );
}

function toFormValues(user?: User): UserFormValues {
  if (!user) {
    return emptyValues;
  }

  const emergency = parseEmergencyContact(user.emergencyContact);

  return {
    lastname: user.lastname ?? "",
    firstname: user.firstname ?? "",
    email: user.email ?? "",
    password: "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    pseudo: user.pseudo ?? "",
    phone: user.phone ?? "",
    emergencyLastname: emergency.lastname,
    emergencyFirstname: emergency.firstname,
    emergencyEmail: emergency.email,
    emergencyPhone: emergency.phone,
    role: user.role ?? "ROLE_USER",
    canSeePrivate: user.canSeePrivate ?? false,
  };
}

export function UserForm({
  userId,
  initialUser,
  initialActorRole,
}: UserFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<UserFormValues>(
    initialUser ? toFormValues(initialUser) : emptyValues,
  );
  const [targetRole, setTargetRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(Boolean(userId) && !initialUser);
  const [actorRole, setActorRole] = useState<UserRole | null>(
    initialActorRole ?? null,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [invitationDialogOpen, setInvitationDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isMinor = useMemo(() => {
    if (!values.dateOfBirth) {
      return false;
    }

    const birthDate = new Date(values.dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age < 18;
  }, [values.dateOfBirth]);

  const pageTitle = useMemo(
    () => (userId ? "Modifier l'utilisateur" : "Creer un utilisateur"),
    [userId],
  );

  useEffect(() => {
    if (initialActorRole) {
      return;
    }

    let active = true;

    getCurrentUser()
      .then((user) => {
        if (active) {
          setActorRole(user.role);
        }
      })
      .catch(() => {
        if (active) {
          setActorRole(null);
        }
      });

    return () => {
      active = false;
    };
  }, [initialActorRole]);

  useEffect(() => {
    if (!userId || initialUser) {
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const user = await getUser(userId);

        if (!active) {
          return;
        }

        // Pre-fill form from user payload so edit remains usable even if
        // relation shape differs across API responses.
        setValues(toFormValues(user));
        setTargetRole(user.role);
      } catch (err) {
        if (active) {
          setErrors([
            err instanceof Error ? err.message : "Une erreur est survenue",
          ]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [userId, initialUser]);

  const isAdminActor = actorRole === "ROLE_ADMIN";
  const isAdminBlockedOnTarget =
    Boolean(userId) &&
    isAdminActor &&
    isElevatedRole(targetRole ?? "ROLE_USER");
  const roleOptions = isAdminActor
    ? assignableRolesByAdmin
    : assignableRolesBySuperAdmin;
  const isPrivateAccessLocked = isPrivateAccessForcedRole(values.role);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors([]);
    setSuccessMessage(null);

    if (isAdminBlockedOnTarget) {
      setErrors([
        "Un admin peut modifier ou supprimer uniquement les organisateurs et utilisateurs classiques.",
      ]);
      return;
    }

    if (!userId && isAdminActor && isElevatedRole(values.role)) {
      setErrors(["Un admin ne peut pas créer un admin ou super admin."]);
      return;
    }

    const emergencyContactFields = {
      lastname: values.emergencyLastname,
      firstname: values.emergencyFirstname,
      email: values.emergencyEmail,
      phone: values.emergencyPhone,
    };
    const emergencyContact = serializeEmergencyContact(emergencyContactFields);

    const clientErrors: string[] = [];

    if (!values.firstname.trim()) {
      clientErrors.push("Prénom : ce champ ne doit pas être vide.");
    } else if (!isValidName(values.firstname)) {
      clientErrors.push(
        "Prénom : ce champ ne peut contenir que des lettres, espaces et tirets.",
      );
    }

    if (!values.lastname.trim()) {
      clientErrors.push("Nom : ce champ ne doit pas être vide.");
    } else if (!isValidName(values.lastname)) {
      clientErrors.push(
        "Nom : ce champ ne peut contenir que des lettres, espaces et tirets.",
      );
    }

    if (!values.email.trim()) {
      clientErrors.push("Email : ce champ ne doit pas être vide.");
    } else if (!isValidEmail(values.email.trim())) {
      clientErrors.push(
        "Email : cette valeur n'est pas une adresse email valide.",
      );
    }

    if (!userId) {
      if (!values.password.trim()) {
        clientErrors.push("Mot de passe : ce champ ne doit pas être vide.");
      } else {
        const passwordPolicyErrors = validatePasswordPolicy(values.password);
        if (passwordPolicyErrors.length > 0) {
          clientErrors.push(
            ...passwordPolicyErrors.map(
              (message) => `Mot de passe : ${message}`,
            ),
          );
        }
      }
    } else if (values.password.trim()) {
      const passwordPolicyErrors = validatePasswordPolicy(values.password);
      if (passwordPolicyErrors.length > 0) {
        clientErrors.push(
          ...passwordPolicyErrors.map((message) => `Mot de passe : ${message}`),
        );
      }
    }

    if (!values.dateOfBirth.trim()) {
      clientErrors.push("Date de naissance : ce champ ne doit pas être vide.");
    } else if (Number.isNaN(new Date(values.dateOfBirth).getTime())) {
      clientErrors.push("Date de naissance : cette date n'est pas valide.");
    }

    if (values.phone.trim() && !isValidPhoneNumber(values.phone.trim())) {
      clientErrors.push("Téléphone : le numéro de téléphone n'est pas valide.");
    }

    const emergencyFields = {
      lastname: values.emergencyLastname.trim(),
      firstname: values.emergencyFirstname.trim(),
      email: values.emergencyEmail.trim(),
      phone: values.emergencyPhone.trim(),
    };
    const hasAnyEmergencyField = Object.values(emergencyFields).some(
      (field) => field !== "",
    );
    const allEmergencyFieldsFilled = Object.values(emergencyFields).every(
      (field) => field !== "",
    );

    // Emergency contact is mandatory for minors, and all-or-nothing for adults
    if ((isMinor || hasAnyEmergencyField) && !allEmergencyFieldsFilled) {
      if (!emergencyFields.lastname) {
        clientErrors.push("Nom du contact : ce champ ne doit pas être vide.");
      }
      if (!emergencyFields.firstname) {
        clientErrors.push(
          "Prénom du contact : ce champ ne doit pas être vide.",
        );
      }
      if (!emergencyFields.email) {
        clientErrors.push("Email du contact : ce champ ne doit pas être vide.");
      }
      if (!emergencyFields.phone) {
        clientErrors.push(
          "Téléphone du contact : ce champ ne doit pas être vide.",
        );
      }
    }

    // Any filled field must respect the same format rules, even if others are still missing
    if (emergencyFields.lastname && !isValidName(emergencyFields.lastname)) {
      clientErrors.push(
        "Nom du contact : ce champ ne peut contenir que des lettres, espaces et tirets.",
      );
    }

    if (emergencyFields.firstname && !isValidName(emergencyFields.firstname)) {
      clientErrors.push(
        "Prénom du contact : ce champ ne peut contenir que des lettres, espaces et tirets.",
      );
    }

    if (emergencyFields.email && !isValidEmail(emergencyFields.email)) {
      clientErrors.push(
        "Email du contact : cette valeur n'est pas une adresse email valide.",
      );
    }

    if (emergencyFields.phone && !isValidPhoneNumber(emergencyFields.phone)) {
      clientErrors.push(
        "Téléphone du contact : le numero de téléphone n'est pas valide.",
      );
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (userId) {
        const payload: UpdateUserPayload = {
          lastname: values.lastname,
          firstname: values.firstname,
          email: values.email,
          dateOfBirth: values.dateOfBirth,
          pseudo: values.pseudo || null,
          phone: values.phone || null,
          emergencyContact,
          role: values.role,
          canSeePrivate: isPrivateAccessLocked ? true : values.canSeePrivate,
        };

        if (values.password.trim()) {
          payload.password = values.password;
        }

        const updated = await updateUser(userId, payload);
        const emailChangeRequested = updated.email !== values.email;
        router.push(
          `/admin/users/${updated.id}${emailChangeRequested ? "?emailChangeRequested=1" : ""}`,
        );
      } else {
        const payload: CreateUserPayload = {
          lastname: values.lastname,
          firstname: values.firstname,
          email: values.email,
          password: values.password,
          dateOfBirth: values.dateOfBirth,
          pseudo: values.pseudo || null,
          phone: values.phone || null,
          emergencyContact,
          role: values.role,
          canSeePrivate: isPrivateAccessLocked ? true : values.canSeePrivate,
        };

        const message = await createUser(payload);
        setSuccessMessage(message);
        setInvitationDialogOpen(true);
      }

      if (userId) {
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ProfileValidationError) {
        setErrors(err.messages);
      } else {
        setErrors([
          err instanceof Error ? err.message : "Une erreur est survenue",
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userId) {
      return;
    }

    if (isAdminBlockedOnTarget) {
      setErrors([
        "Un admin peut modifier ou supprimer uniquement les organisateurs et utilisateurs classiques.",
      ]);
      return;
    }

    setErrors([]);
    setDeleting(true);

    try {
      await deleteUser(userId);
      setDeleteDialogOpen(false);
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setErrors([
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'utilisateur",
      ]);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{pageTitle}</CardTitle>
        <CardDescription>
          Gerer les informations de compte et permissions admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {errors.length > 0 ? (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded border border-destructive/70 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <p className="font-semibold">
                  Veuillez corriger les erreurs suivantes :
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {errors.map((errorMessage, index) => (
                    <li key={index}>{errorMessage}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {isAdminBlockedOnTarget ? (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Un admin peut modifier ou supprimer uniquement les organisateurs
                et les utilisateurs classiques.
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="firstname">Prénom</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="firstname"
                  value={values.firstname}
                  onChange={(event) =>
                    setValues({ ...values, firstname: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="lastname">Nom</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="lastname"
                  value={values.lastname}
                  onChange={(event) =>
                    setValues({ ...values, lastname: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="email">Email</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="email"
                  placeholder="exemple@exemple.com"
                  type="email"
                  value={values.email}
                  onChange={(event) =>
                    setValues({ ...values, email: event.target.value })
                  }
                />
              </div>
              {!userId ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="password">Mot de passe</Label>
                    <span
                      className="text-sm text-destructive"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={values.password}
                    onChange={(event) =>
                      setValues({ ...values, password: event.target.value })
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="dateOfBirth">Date de naissance</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) =>
                    setValues({ ...values, dateOfBirth: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pseudo">Pseudo</Label>
                <Input
                  id="pseudo"
                  value={values.pseudo}
                  onChange={(event) =>
                    setValues({ ...values, pseudo: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="0600000000"
                  value={values.phone}
                  onChange={(event) =>
                    setValues({ ...values, phone: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Contact d'urgence</Label>
                <p className="text-xs text-muted-foreground">
                  Renseigner nom, prénom, email et téléphone.
                  {isMinor
                    ? " Obligatoire pour un mineur."
                    : " Optionnel pour un majeur."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="emergencyLastname">Nom du contact</Label>
                    {isMinor ? (
                      <span
                        className="text-sm text-destructive"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    ) : null}
                  </div>
                  <Input
                    id="emergencyLastname"
                    value={values.emergencyLastname}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyLastname: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="emergencyFirstname">
                      Prénom du contact
                    </Label>
                    {isMinor ? (
                      <span
                        className="text-sm text-destructive"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    ) : null}
                  </div>
                  <Input
                    id="emergencyFirstname"
                    value={values.emergencyFirstname}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyFirstname: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="emergencyEmail">Email du contact</Label>
                    {isMinor ? (
                      <span
                        className="text-sm text-destructive"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    ) : null}
                  </div>
                  <Input
                    id="emergencyEmail"
                    placeholder="exemple@exemple.com"
                    type="email"
                    value={values.emergencyEmail}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyEmail: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="emergencyPhone">Téléphone du contact</Label>
                    {isMinor ? (
                      <span
                        className="text-sm text-destructive"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    ) : null}
                  </div>
                  <Input
                    id="emergencyPhone"
                    placeholder="0600000000"
                    value={values.emergencyPhone}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyPhone: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="role">Role</Label>
                  <span className="text-sm text-destructive" aria-hidden="true">
                    *
                  </span>
                </div>
                <select
                  id="role"
                  value={values.role}
                  onChange={(event) =>
                    setValues((prev) => {
                      const nextRole = event.target.value as UserRole;

                      return {
                        ...prev,
                        role: nextRole,
                        canSeePrivate: isPrivateAccessForcedRole(nextRole)
                          ? true
                          : prev.canSeePrivate,
                      };
                    })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role === "ROLE_USER"
                        ? "Utilisateur"
                        : role === "ROLE_ADMIN"
                          ? "Admin"
                          : role === "ROLE_ORGANIZER"
                            ? "Organisateur"
                            : "Super Admin"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canSeePrivate">Acces parties privees</Label>
                <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3">
                  <input
                    id="canSeePrivate"
                    type="checkbox"
                    checked={
                      isPrivateAccessLocked ? true : values.canSeePrivate
                    }
                    onChange={(event) =>
                      setValues({
                        ...values,
                        canSeePrivate: event.target.checked,
                      })
                    }
                    disabled={isPrivateAccessLocked}
                  />
                </div>
                {isPrivateAccessLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Pour ce role, l'acces aux parties privees est toujours
                    autorise.
                  </p>
                ) : null}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">* Champ obligatoire</p>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={submitting || isAdminBlockedOnTarget}
              >
                {submitting
                  ? "Enregistrement..."
                  : userId
                    ? "Enregistrer"
                    : "Creer"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>

              {userId ? (
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isAdminBlockedOnTarget}
                    title={
                      isAdminBlockedOnTarget
                        ? "Un admin ne peut supprimer que les organisateurs et utilisateurs."
                        : undefined
                    }
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                      <DialogDescription>
                        Cette action supprimera definitivement l'utilisateur.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setDeleteDialogOpen(false);
                          }}
                        >
                          Annuler
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Suppression..." : "Supprimer"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>

      <Dialog
        open={invitationDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/admin/users");
          }
          setInvitationDialogOpen(open);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>E-mail de confirmation envoyé</DialogTitle>
            <DialogDescription>
              {successMessage ??
                "Un e-mail de confirmation a été envoyé à l’utilisateur. Le compte sera créé après validation de son adresse e-mail."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => router.push("/admin/users")}>
              Retour aux utilisateurs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
