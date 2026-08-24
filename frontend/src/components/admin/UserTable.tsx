"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  getCurrentUser,
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
  const [isAdminOnlyActor, setIsAdminOnlyActor] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [privateFilter, setPrivateFilter] = useState<"all" | "yes" | "no">(
    "all",
  );
  const [ageFilter, setAgeFilter] = useState<"all" | "minor" | "adult">("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchBy, setSearchBy] = useState<"lastname" | "firstname">(
    "lastname",
  );
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [view, setView] = useState<CollectionView | undefined>(initialView);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    let isDisposed = false;

    async function loadActorRole() {
      try {
        const currentUser = await getCurrentUser();
        if (!isDisposed) {
          setIsAdminOnlyActor(currentUser.role === "ROLE_ADMIN");
        }
      } catch {
        if (!isDisposed) {
          setIsAdminOnlyActor(false);
        }
      }
    }

    void loadActorRole();

    return () => {
      isDisposed = true;
    };
  }, []);

  function extractPage(url?: string): number | null {
    if (!url) return null;
    const match = url.match(/[?&]page=(\d+)/);
    return match ? Number(match[1]) : null;
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const lastPage = extractPage(view?.last) ?? (view ? currentPage : null);

  const filters = useMemo(
    () => ({
      role: roleFilter !== "all" ? roleFilter : undefined,
      canSeePrivate:
        privateFilter === "all" ? undefined : privateFilter === "yes",
      isMinor: ageFilter === "all" ? undefined : ageFilter === "minor",
      search: debouncedSearch || undefined,
      searchBy,
    }),
    [roleFilter, privateFilter, ageFilter, debouncedSearch, searchBy],
  );

  async function goToPage(page: number) {
    setPageLoading(true);
    try {
      const result = await getUsers(page, filters);
      setUsers(result.users);
      setView(result.view);
      setCurrentPage(page);
    } finally {
      setPageLoading(false);
    }
  }

  // Server-side filtering: whenever a filter changes, refetch from page 1
  // instead of filtering the already-paginated results on the client.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    void goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) =>
      a.lastname.localeCompare(b.lastname, "fr"),
    );
  }, [users]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-2 text-sm">
          <span>Rechercher</span>
          <input
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            type="text"
            placeholder="Ex. Martin"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <label className="space-y-2 text-sm">
          <span>Rechercher par</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={searchBy}
            onChange={(event) =>
              setSearchBy(event.target.value as "lastname" | "firstname")
            }
          >
            <option value="lastname">Nom</option>
            <option value="firstname">Prenom</option>
          </select>
        </label>

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

        <label className="space-y-2 text-sm">
          <span>Filtrer par age</span>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={ageFilter}
            onChange={(event) =>
              setAgeFilter(event.target.value as "all" | "minor" | "adult")
            }
          >
            <option value="all">Tous</option>
            <option value="adult">Majeur</option>
            <option value="minor">Mineur</option>
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={
            roleFilter === "all" &&
            privateFilter === "all" &&
            ageFilter === "all" &&
            searchInput === "" &&
            searchBy === "lastname"
          }
          onClick={() => {
            setRoleFilter("all");
            setPrivateFilter("all");
            setAgeFilter("all");
            setSearchInput("");
            setSearchBy("lastname");
          }}
        >
          Reinitialiser les filtres
        </Button>
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
          {sortedUsers.map((user) => {
            const fullName = `${user.firstname} ${user.lastname}`.trim();
            const age = computeAge(user.dateOfBirth, referenceDateIso);
            const isMinor = age < 18;
            const isElevatedTarget =
              user.role === "ROLE_ADMIN" || user.role === "ROLE_SUPER_ADMIN";
            const canEditTarget = !(isAdminOnlyActor && isElevatedTarget);

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

                    {canEditTarget ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <PencilLine className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled
                        title="Un admin ne peut modifier que les organisateurs et utilisateurs."
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                    )}
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
