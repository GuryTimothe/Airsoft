"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteUser, getCurrentUser, getUser, type User } from "@/lib/user-api";
import {
  Mail,
  Phone,
  Shield,
  Trash2,
  UserRound,
  PencilLine,
} from "lucide-react";
import {
  parseEmergencyContact,
  type EmergencyContactFields,
} from "@/lib/emergency-contact";

interface UserDetailProps {
  userId: number;
  emailChangeRequested?: boolean;
}

function roleLabel(role: User["role"]): string {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_ORGANIZER":
      return "Organisateur";
    case "ROLE_SUPER_ADMIN":
      return "Super Admin";
    default:
      return "Utilisateur";
  }
}

function computeAge(dateOfBirth: string): number | null {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export function UserDetail({
  userId,
  emailChangeRequested = false,
}: UserDetailProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [emergencyContact, setEmergencyContact] =
    useState<EmergencyContactFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailChangeDialogOpen, setEmailChangeDialogOpen] =
    useState(emailChangeRequested);
  const [isAdminOnlyActor, setIsAdminOnlyActor] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [currentUser, userData] = await Promise.all([
          getCurrentUser(),
          getUser(userId),
        ]);

        if (!active) {
          return;
        }

        setUser(userData);
        setIsAdminOnlyActor(currentUser.role === "ROLE_ADMIN");

        const fallbackEmergency = parseEmergencyContact(
          userData.emergencyContact,
        );
        const hasFallbackEmergency = Boolean(
          fallbackEmergency.lastname ||
          fallbackEmergency.firstname ||
          fallbackEmergency.email ||
          fallbackEmergency.phone,
        );

        setEmergencyContact(hasFallbackEmergency ? fallbackEmergency : null);
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

  async function handleDelete() {
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

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Chargement de l'utilisateur...
      </p>
    );
  }

  if (error || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utilisateur introuvable</CardTitle>
          <CardDescription>
            {error ?? "L'utilisateur demande est introuvable."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const age = computeAge(user.dateOfBirth);
  const hasEmergencyContact = Boolean(emergencyContact);
  const isElevatedTarget =
    user.role === "ROLE_ADMIN" || user.role === "ROLE_SUPER_ADMIN";
  const canManageTarget = !(isAdminOnlyActor && isElevatedTarget);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Dialog
            open={emailChangeDialogOpen}
            onOpenChange={setEmailChangeDialogOpen}
          >
            <DialogContent showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>
                  Demande de nouvelle adresse e-mail envoyée
                </DialogTitle>
                <DialogDescription>
                  Un e-mail de confirmation a été envoyé à l’utilisateur. La
                  nouvelle adresse e-mail sera effective après sa validation.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setEmailChangeDialogOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.firstname} {user.lastname}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail du compte utilisateur.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManageTarget ? (
            <Button asChild variant="outline">
              <Link href={`/admin/users/${user.id}/edit`}>
                <PencilLine className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              title="Un admin ne peut modifier que les organisateurs et utilisateurs."
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!canManageTarget}
                title={
                  canManageTarget
                    ? undefined
                    : "Un admin ne peut supprimer que les organisateurs et utilisateurs."
                }
                onClick={() => setDeleteDialogOpen(true)}
              >
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
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
          <CardDescription>Profil, role et acces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-muted-foreground" />
            <span>
              {user.firstname} {user.lastname}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{user.phone || "Non renseigne"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>{roleLabel(user.role)}</span>
          </div>
          <div>
            <span className="font-medium">Acces parties privees: </span>
            <span>{user.canSeePrivate ? "Oui" : "Non"}</span>
          </div>
          <div>
            <span className="font-medium">Age: </span>
            <span>{age ?? "Non renseigne"}</span>
          </div>
          <div>
            <span className="font-medium">Date de naissance: </span>
            <span>
              {new Date(user.dateOfBirth).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div>
            <span className="font-medium">Pseudo: </span>
            <span>{user.pseudo || "Non renseigne"}</span>
          </div>
        </CardContent>
      </Card>

      {hasEmergencyContact ? (
        <Card>
          <CardHeader>
            <CardTitle>Contact d'urgence</CardTitle>
            <CardDescription>
              Personne à contacter en cas de besoin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Nom: </span>
              <span>{emergencyContact?.lastname || "-"}</span>
            </div>
            <div>
              <span className="font-medium">Prénom: </span>
              <span>{emergencyContact?.firstname || "-"}</span>
            </div>
            <div>
              <span className="font-medium">Email: </span>
              <span>{emergencyContact?.email || "-"}</span>
            </div>
            <div>
              <span className="font-medium">Téléphone: </span>
              <span>{emergencyContact?.phone || "-"}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
