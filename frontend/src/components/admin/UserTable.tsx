"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, PencilLine } from "lucide-react";
import {
  getUsers,
  type CollectionView,
  type User,
  type UserRole,
} from "@/lib/user-api";

type UserTableProps = {
  initialUsers: User[];
  initialView?: CollectionView;
  referenceDateIso: string;
};

const roles: UserRole[] = [
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_ORGANIZER",
  "ROLE_SUPER_ADMIN",
];

function roleLabel(role: UserRole): string {
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

function computeAge(dateOfBirth: string, referenceDateIso: string): number {
  const birthDate = new Date(dateOfBirth);
  const now = new Date(referenceDateIso);

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const dayDiff = now.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export default function UserTable({
  initialUsers,
  initialView,
  referenceDateIso,
}: UserTableProps) {
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [privateFilter, setPrivateFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [view, setView] = useState<CollectionView | undefined>(initialView);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);

  function extractPage(url?: string): number | null {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? Number(match[1]) : null;
  }

  const lastPage = extractPage(view?.last) ?? (view ? currentPage : null);

  async function goToPage(page: number) {
    setPageLoading(true);
    try {
      const result = await getUsers(page);
      setUsers(result.users);
      setView(result.view);
      setCurrentPage(page);
    } finally {
      setPageLoading(false);
    }
  }

  const filteredUsers = useMemo(() => {
    return [...users]
      .filter((user) => {
        if (roleFilter !== "all" && user.role !== roleFilter) {
          return false;
        }

        if (privateFilter === "yes" && !user.canSeePrivate) {
          return false;
        }

        if (privateFilter === "no" && user.canSeePrivate) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.lastname.localeCompare(b.lastname, "fr"));
  }, [users, privateFilter, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:max-w-xl">
        <label className="space-y-2 text-sm">
          <span>Filtrer par role</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as UserRole | "all")
            }
          >
            <option value="all">Tous les roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span>Filtrer par acces prive</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={privateFilter}
            onChange={(event) =>
              setPrivateFilter(event.target.value as "all" | "yes" | "no")
            }
          >
            <option value="all">Tous</option>
            <option value="yes">Autorise</option>
            <option value="no">Refuse</option>
          </select>
        </label>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Acces parties privees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredUsers.map((user) => {
            const fullName = `${user.firstname} ${user.lastname}`.trim();
            const age = computeAge(user.dateOfBirth, referenceDateIso);
            const isMinor = age < 18;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isMinor ? (
                      <Badge variant="destructive">{age} ans</Badge>
                    ) : (
                      <Badge variant="ghost">{age} ans</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabel(user.role)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.canSeePrivate ? "default" : "outline"}>
                    {user.canSeePrivate ? "Autorise" : "Refuse"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </Link>
                    </Button>

                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        <PencilLine className="mr-2 h-4 w-4" />
                        Modifier
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {lastPage !== null && lastPage > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pageLoading || currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageLoading || currentPage >= lastPage}
            onClick={() => goToPage(currentPage + 1)}
          >
            Suivant
          </Button>
        </div>
      ) : null}
    </div>
  );
}
