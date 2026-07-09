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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import {
  createUser,
  deleteUser,
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
  type EmergencyContactFields,
} from "@/lib/emergency-contact";
import { getEmergencyContactByUserId } from "@/lib/emergency-contact-api";

interface UserFormProps {
  userId?: number;
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

function applyEmergencyContactToValues(
  values: UserFormValues,
  emergency: EmergencyContactFields | null,
): UserFormValues {
  if (!emergency) {
    return values;
  }

  return {
    ...values,
    emergencyLastname: emergency.lastname,
    emergencyFirstname: emergency.firstname,
    emergencyEmail: emergency.email,
    emergencyPhone: emergency.phone,
  };
}

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<UserFormValues>(emptyValues);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!userId) {
      return;
    }

    let active = true;
    Promise.all([getUser(userId), getEmergencyContactByUserId(userId)])
      .then(([user, emergency]) => {
        if (active) {
          const baseValues = toFormValues(user);
          setValues(applyEmergencyContactToValues(baseValues, emergency));
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
          canSeePrivate: values.canSeePrivate,
        };

        if (values.password.trim()) {
          payload.password = values.password;
        }

        const updated = await updateUser(userId, payload);
        router.push(`/admin/users/${updated.id}`);
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
          canSeePrivate: values.canSeePrivate,
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

    setError(null);
    setDeleting(true);

    try {
      await deleteUser(userId);
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
              <div className="space-y-2">
                <Label htmlFor="password">
                  {userId
                    ? "Mot de passe (laisser vide pour conserver)"
                    : "Mot de passe"}
                  {!userId ? <RequiredMark /> : null}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={(event) =>
                    setValues({ ...values, password: event.target.value })
                  }
                  required={!userId}
                />
              </div>
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
                    setValues({
                      ...values,
                      role: event.target.value as UserRole,
                    })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ROLE_USER">Utilisateur</option>
                  <option value="ROLE_ADMIN">Admin</option>
                  <option value="ROLE_ORGANIZER">Organisateur</option>
                  <option value="ROLE_SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canSeePrivate">Acces parties privees</Label>
                <div className="flex h-10 items-center rounded-lg border border-input bg-background px-3">
                  <input
                    id="canSeePrivate"
                    type="checkbox"
                    checked={values.canSeePrivate}
                    onChange={(event) =>
                      setValues({
                        ...values,
                        canSeePrivate: event.target.checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitting}>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                      <DialogDescription>
                        Cette action supprimera definitivement l'utilisateur.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">
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
