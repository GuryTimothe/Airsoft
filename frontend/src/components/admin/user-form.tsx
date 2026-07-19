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
  updateUser,
  type CreateUserPayload,
  type UpdateUserPayload,
  type User,
  type UserRole,
} from "@/lib/user-api";
import {
  hasCompleteEmergencyContact,
  parseEmergencyContact,
  serializeEmergencyContact,
} from "@/lib/emergency-contact";

interface UserFormProps {
  userId?: number;
  initialUser?: User;
  initialActorRole?: UserRole | null;
}

function RequiredMark() {
  return <span className="ml-1 text-destructive">*</span>;
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

function validatePasswordPolicy(password: string): string | null {
  if (password.length < 12) {
    return "Le mot de passe doit contenir au moins 12 caractères.";
  }

  if (!/[a-z]/.test(password)) {
    return "Le mot de passe doit contenir une minuscule.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir une majuscule.";
  }

  if (!/\d/.test(password)) {
    return "Le mot de passe doit contenir un chiffre.";
  }

  if (!/[^\w\s]/.test(password)) {
    return "Le mot de passe doit contenir un symbole.";
  }

  return null;
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
  const [error, setError] = useState<string | null>(null);
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
  }, []);

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
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
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
  }, [userId]);

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
    setError(null);

    if (isAdminBlockedOnTarget) {
      setError(
        "Un admin peut modifier ou supprimer uniquement les organisateurs et utilisateurs classiques.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const birthDate = new Date(values.dateOfBirth);
      if (Number.isNaN(birthDate.getTime())) {
        throw new Error("La date de naissance est invalide.");
      }

      const emergencyContactFields = {
        lastname: values.emergencyLastname,
        firstname: values.emergencyFirstname,
        email: values.emergencyEmail,
        phone: values.emergencyPhone,
      };
      const emergencyContact = serializeEmergencyContact(
        emergencyContactFields,
      );

      if (isMinor && !hasCompleteEmergencyContact(emergencyContactFields)) {
        throw new Error(
          "Le contact d'urgence mineur doit contenir nom, prenom, email et telephone.",
        );
      }

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
          const passwordPolicyError = validatePasswordPolicy(values.password);
          if (passwordPolicyError) {
            throw new Error(passwordPolicyError);
          }

          payload.password = values.password;
        }

        const updated = await updateUser(userId, payload);
        router.push(`/admin/users/${updated.id}`);
      } else {
        if (isAdminActor && isElevatedRole(values.role)) {
          setError("Un admin ne peut pas creer un admin ou super admin.");
          return;
        }

        const passwordPolicyError = validatePasswordPolicy(values.password);
        if (passwordPolicyError) {
          throw new Error(passwordPolicyError);
        }

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

        const created = await createUser(payload);
        router.push(`/admin/users/${created.id}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userId) {
      return;
    }

    if (isAdminBlockedOnTarget) {
      setError(
        "Un admin peut modifier ou supprimer uniquement les organisateurs et utilisateurs classiques.",
      );
      return;
    }

    setError(null);
    setDeleting(true);

    try {
      await deleteUser(userId);
      setDeleteDialogOpen(false);
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer l'utilisateur",
      );
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
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {isAdminBlockedOnTarget ? (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Un admin peut modifier ou supprimer uniquement les organisateurs
                et les utilisateurs classiques.
              </p>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstname">
                  Prenom
                  <RequiredMark />
                </Label>
                <Input
                  id="firstname"
                  value={values.firstname}
                  onChange={(event) =>
                    setValues({ ...values, firstname: event.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">
                  Nom
                  <RequiredMark />
                </Label>
                <Input
                  id="lastname"
                  value={values.lastname}
                  onChange={(event) =>
                    setValues({ ...values, lastname: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                  <RequiredMark />
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) =>
                    setValues({ ...values, email: event.target.value })
                  }
                  required
                />
              </div>
              {!userId ? (
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mot de passe
                    <RequiredMark />
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={values.password}
                    onChange={(event) =>
                      setValues({ ...values, password: event.target.value })
                    }
                    required
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  Date de naissance
                  <RequiredMark />
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={values.dateOfBirth}
                  onChange={(event) =>
                    setValues({ ...values, dateOfBirth: event.target.value })
                  }
                  required
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
                <Label htmlFor="phone">Telephone</Label>
                <Input
                  id="phone"
                  value={values.phone}
                  onChange={(event) =>
                    setValues({ ...values, phone: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>
                  Contact d'urgence
                  {isMinor ? <RequiredMark /> : null}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Renseigner nom, prenom, email et telephone.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergencyLastname">
                    Nom du contact
                    {isMinor ? <RequiredMark /> : null}
                  </Label>
                  <Input
                    id="emergencyLastname"
                    value={values.emergencyLastname}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyLastname: event.target.value,
                      })
                    }
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyFirstname">
                    Prenom du contact
                    {isMinor ? <RequiredMark /> : null}
                  </Label>
                  <Input
                    id="emergencyFirstname"
                    value={values.emergencyFirstname}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyFirstname: event.target.value,
                      })
                    }
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyEmail">
                    Email du contact
                    {isMinor ? <RequiredMark /> : null}
                  </Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={values.emergencyEmail}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyEmail: event.target.value,
                      })
                    }
                    required={isMinor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">
                    Telephone du contact
                    {isMinor ? <RequiredMark /> : null}
                  </Label>
                  <Input
                    id="emergencyPhone"
                    value={values.emergencyPhone}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        emergencyPhone: event.target.value,
                      })
                    }
                    required={isMinor}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role
                  <RequiredMark />
                </Label>
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

            <p className="text-xs text-muted-foreground">* Champ obligatoire</p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
