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
  age: string;
  pseudo: string;
  phone: string;
  emergencyContact: string;
  role: UserRole;
  canSeePrivate: boolean;
};

const emptyValues: UserFormValues = {
  lastname: "",
  firstname: "",
  email: "",
  password: "",
  dateOfBirth: "",
  age: "",
  pseudo: "",
  phone: "",
  emergencyContact: "",
  role: "ROLE_USER",
  canSeePrivate: false,
};

function toFormValues(user?: User): UserFormValues {
  if (!user) {
    return emptyValues;
  }

  return {
    lastname: user.lastname ?? "",
    firstname: user.firstname ?? "",
    email: user.email ?? "",
    password: "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
    age: user.age ? String(user.age) : "",
    pseudo: user.pseudo ?? "",
    phone: user.phone ?? "",
    emergencyContact: user.emergencyContact ?? "",
    role: user.role ?? "ROLE_USER",
    canSeePrivate: user.canSeePrivate ?? false,
  };
}

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<UserFormValues>(emptyValues);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMinor = Number(values.age) < 18;

  const pageTitle = useMemo(
    () => (userId ? "Modifier l'utilisateur" : "Creer un utilisateur"),
    [userId],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;
    getUser(userId)
      .then((user) => {
        if (active) {
          setValues(toFormValues(user));
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
      const ageValue = Number(values.age);

      if (!Number.isFinite(ageValue) || ageValue < 0) {
        throw new Error("L'age doit etre un nombre positif ou nul.");
      }

      if (ageValue < 18 && !values.emergencyContact.trim()) {
        throw new Error(
          "Le contact d'urgence est obligatoire pour un utilisateur mineur.",
        );
      }

      if (userId) {
        const payload: UpdateUserPayload = {
          lastname: values.lastname,
          firstname: values.firstname,
          email: values.email,
          dateOfBirth: values.dateOfBirth,
          age: ageValue,
          pseudo: values.pseudo || null,
          phone: values.phone || null,
          emergencyContact: values.emergencyContact || null,
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
          age: ageValue,
          pseudo: values.pseudo || null,
          phone: values.phone || null,
          emergencyContact: values.emergencyContact || null,
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
                <Label htmlFor="age">
                  Age
                  <RequiredMark />
                </Label>
                <Input
                  id="age"
                  type="number"
                  min="0"
                  value={values.age}
                  onChange={(event) =>
                    setValues({ ...values, age: event.target.value })
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

            <div className="space-y-2">
              <Label htmlFor="emergencyContact">
                Contact d'urgence
                {isMinor ? <RequiredMark /> : null}
              </Label>
              <Input
                id="emergencyContact"
                placeholder="Nom + telephone"
                value={values.emergencyContact}
                onChange={(event) =>
                  setValues({ ...values, emergencyContact: event.target.value })
                }
                required={isMinor}
              />
              <p className="text-xs text-muted-foreground">
                Obligatoire si l'utilisateur est mineur.
              </p>
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
