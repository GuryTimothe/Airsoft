import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import UserTable from "@/components/admin/UserTable";
import { getUsers, type User } from "@/lib/user-api";

export default async function UsersPage() {
  let users: User[] = [];
  let errorMessage: string | null = null;
  const referenceDateIso = new Date().toISOString();

  try {
    users = await getUsers();
  } catch {
    errorMessage = "Impossible de charger les utilisateurs.";
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Cette section est reservee a l'administration. Les utilisateurs ne
            sont pas affiches sur le site public.
          </p>
        </div>

        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel utilisateur
          </Link>
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />
    </main>
  );
}
