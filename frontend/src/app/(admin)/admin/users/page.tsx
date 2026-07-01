import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const users = [
  {
    id: 1,
    name: "Alex Martin",
    email: "alex@mail.com",
    role: "member",
    warnings: 1,
    banned: false,
  },
  {
    id: 2,
    name: "Lucas Durand",
    email: "lucas@mail.com",
    role: "organizer",
    warnings: 0,
    banned: false,
  },
  {
    id: 3,
    name: "John Doe",
    email: "john@mail.com",
    role: "member",
    warnings: 2,
    banned: true,
  },
];

export default function UsersPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Warnings</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>

              <TableCell>{u.email}</TableCell>

              <TableCell>
                <Badge variant="secondary">{u.role}</Badge>
              </TableCell>

              <TableCell>{u.warnings}</TableCell>

              <TableCell>
                {u.banned ? (
                  <Badge variant="destructive">Banni</Badge>
                ) : (
                  <Badge variant="default">Actif</Badge>
                )}
              </TableCell>

              <TableCell className="space-x-2">
                <Button size="sm" variant="secondary">
                  Voir
                </Button>

                <Button size="sm" variant="destructive">
                  Ban
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </main>
  );
}
