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
import { deleteUser, getUser, type User } from "@/lib/user-api";
import {
  Mail,
  Phone,
  Shield,
  Trash2,
  UserRound,
  PencilLine,
} from "lucide-react";

interface UserDetailProps {
  userId: number;
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

export function UserDetail({ userId }: UserDetailProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    getUser(userId)
      .then((data) => {
        if (active) {
          setUser(data);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.firstname} {user.lastname}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail du compte utilisateur.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/users/${user.id}/edit`}>
              <PencilLine className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">
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
                <Button variant="outline" onClick={() => undefined}>
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
    </div>
  );
}
