import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

const parties = [
  {
    id: 1,
    title: "CQB Night",
    date: "2026-06-12",
    players: 24,
    max: 24,
    paf: 10,
  },
  {
    id: 2,
    title: "MilSim",
    date: "2026-06-20",
    players: 32,
    max: 40,
    paf: 15,
  },
]

export default function PartiesPage() {
  return (
    <main className="p-8 space-y-6">

      <h1 className="text-2xl font-bold">
        Parties
      </h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Joueurs</TableHead>
            <TableHead>PAF</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {parties.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.title}</TableCell>
              <TableCell>{p.date}</TableCell>
              <TableCell>{p.players}/{p.max}</TableCell>
              <TableCell>{p.paf}€</TableCell>
              <TableCell className="space-x-2">
                <Button size="sm" variant="secondary">
                  Voir
                </Button>
                <Button size="sm">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>

    </main>
  )
}